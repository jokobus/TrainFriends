
from fastapi import FastAPI, Request, Response, Depends, HTTPException, status
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
import uuid
import asyncio
import json
from typing import Dict, Any, Set, Optional
from datetime import datetime

app = FastAPI(title="TrainFriends - Simple Server")


# --- In-memory storage (simple, plain-text passwords for hackathon) ---
users: Dict[str, Dict[str, Any]] = {}
# users[username] = { 'password': str, 'friends': set(), 'last_location': {lat,lng,ts} or None }

sessions: Dict[str, str] = {}  # session_id -> username

friend_requests: Dict[str, Dict[str, Any]] = {}
# friend_requests[id] = { 'from': username, 'to': username, 'status': 'pending'|'accepted'|'rejected', 'created': ts }

# SSE per-user queues for pushing events
sse_queues: Dict[str, Set[asyncio.Queue]] = {}


class SignupRequest(BaseModel):
	username: str
	password: str


class GenericResponse(BaseModel):
	success: bool
	message: Optional[str] = None
	id: Optional[str] = None


class LoginRequest(BaseModel):
	username: str
	password: str


class FriendRequestBody(BaseModel):
	friendUsername: str


class LocationPush(BaseModel):
	latitude: float
	longitude: float


def create_session(username: str) -> str:
	sid = uuid.uuid4().hex
	sessions[sid] = username
	return sid


def get_username_from_cookie(request: Request) -> Optional[str]:
	sid = request.cookies.get("session_id")
	if not sid:
		return None
	return sessions.get(sid)


async def get_current_username(request: Request) -> str:
	username = get_username_from_cookie(request)
	if not username:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
	return username


@app.post("/signup", response_model=GenericResponse)
async def signup(req: SignupRequest):
	if req.username in users:
		return GenericResponse(success=False, message="Username already exists")
	users[req.username] = {"password": req.password, "friends": set(), "last_location": None}
	return GenericResponse(success=True, message="Account created.")


@app.post("/login")
async def login(req: LoginRequest, response: Response):
	u = users.get(req.username)
	if not u or u.get("password") != req.password:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
	sid = create_session(req.username)
	# set cookie
	response.set_cookie(key="session_id", value=sid, httponly=True, path="/")
	return {"success": True, "message": "Logged in."}


@app.post("/friend-request", response_model=GenericResponse)
async def send_friend_request(body: FriendRequestBody, username: str = Depends(get_current_username)):
	target = body.friendUsername
	if target not in users:
		raise HTTPException(status_code=404, detail="User not found")
	if target == username:
		return GenericResponse(success=False, message="Cannot friend yourself")
	# simple check: if already friends
	if target in users[username]["friends"]:
		return GenericResponse(success=False, message="Already friends")
	# create request
	rid = uuid.uuid4().hex
	friend_requests[rid] = {"from": username, "to": target, "status": "pending", "created": datetime.utcnow().isoformat()}
	# return the created request id to help clients/tests accept/reject the request
	return GenericResponse(success=True, message="Request created", id=rid)


@app.post("/friend-request/{request_id}/accept", response_model=GenericResponse)
async def accept_friend_request(request_id: str, username: str = Depends(get_current_username)):
	fr = friend_requests.get(request_id)
	if not fr:
		raise HTTPException(status_code=404, detail="Request not found")
	if fr["to"] != username:
		raise HTTPException(status_code=403, detail="Not allowed")
	if fr["status"] != "pending":
		return GenericResponse(success=False, message=f"Request already {fr['status']}")
	fr["status"] = "accepted"
	users[username]["friends"].add(fr["from"])
	users[fr["from"]]["friends"].add(username)
	return GenericResponse(success=True, message="Friend added")


@app.post("/friend-request/{request_id}/reject", response_model=GenericResponse)
async def reject_friend_request(request_id: str, username: str = Depends(get_current_username)):
	fr = friend_requests.get(request_id)
	if not fr:
		raise HTTPException(status_code=404, detail="Request not found")
	if fr["to"] != username:
		raise HTTPException(status_code=403, detail="Not allowed")
	if fr["status"] != "pending":
		return GenericResponse(success=False, message=f"Request already {fr['status']}")
	fr["status"] = "rejected"
	return GenericResponse(success=True, message="Request rejected")


@app.get("/friends")
async def list_friends(username: str = Depends(get_current_username)):
	friends = sorted(list(users[username]["friends"]))
	return {"friends": friends}


@app.post("/location", response_model=GenericResponse)
async def push_location(loc: LocationPush, username: str = Depends(get_current_username)):
	# store last location
	users[username]["last_location"] = {"latitude": loc.latitude, "longitude": loc.longitude, "ts": datetime.utcnow().isoformat()}

	# prepare event
	payload = {"from": username, "latitude": loc.latitude, "longitude": loc.longitude, "ts": datetime.utcnow().isoformat()}
	data = json.dumps(payload)

	# push to all friends' queues (if they have open SSE connections)
	for friend in users[username]["friends"]:
		queues = sse_queues.get(friend)
		if not queues:
			continue
		for q in list(queues):
			# put_nowait to avoid blocking; if queue is full drop event
			try:
				q.put_nowait(data)
			except asyncio.QueueFull:
				# drop
				pass

	return GenericResponse(success=True, message="Location stored")


@app.get("/events")
async def events(request: Request, username: str = Depends(get_current_username)):
	# Create a per-connection queue
	q: asyncio.Queue = asyncio.Queue(maxsize=32)
	# register
	sse_queues.setdefault(username, set()).add(q)

	async def event_generator():
		try:
			# send a welcome comment
			yield "event: message\ndata: {}\n\n".format(json.dumps({"message": "connected", "ts": datetime.utcnow().isoformat()}))
			while True:
				# if client disconnects, stop
				if await request.is_disconnected():
					break
				try:
					data = await asyncio.wait_for(q.get(), timeout=15.0)
				except asyncio.TimeoutError:
					# send a ping keep-alive comment
					yield ": ping\n\n"
					continue
				# SSE format
				yield f"data: {data}\n\n"
		finally:
			# unregister queue
			try:
				sse_queues.get(username, set()).discard(q)
			except Exception:
				pass

	return StreamingResponse(event_generator(), media_type="text/event-stream")


if __name__ == "__main__":
	import uvicorn

	# Run the app object directly so the script can be executed as
	# `python server/main.py` without requiring `server` to be importable
	# as a package. Do not use reload=True here because reload requires
	# an importable module path.
	uvicorn.run(app, host="0.0.0.0", port=8000)

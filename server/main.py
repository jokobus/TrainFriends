from fastapi import FastAPI, Request, Response, Depends, HTTPException, status
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
import uuid
import asyncio
import json
from typing import Set, Optional
from datetime import datetime, timedelta, UTC
import sqlite3
import firebase_admin
from firebase_admin import credentials
from pathlib import Path
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware

cred = credentials.Certificate("firebase.json")
firebase_admin.initialize_app(cred)


app = FastAPI(
    title="TrainFriends - Simple Server",
    middleware=[
        Middleware(
            CORSMiddleware,
            allow_origins=["http://localhost:5173"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    ],
)

# Simple SQLite DB (file stored next to this module)
# Default path (can be overridden with --data flag when running as a script)
DB_PATH = Path(__file__).resolve().parent / "data.db"
db_initialized = False

# SSE per-user queues for pushing events (in-memory)
sse_queues: dict[str, Set[asyncio.Queue]] = {}


class SignupRequest(BaseModel):
    username: str
    password: str


class GenericResponse(BaseModel):
    success: bool
    detail: Optional[str] = None
    id: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class FriendRequestBody(BaseModel):
    friendUsername: str


class Location(BaseModel):
    latitude: float
    longitude: float

def get_conn():
    # Ensure DB is initialized for the chosen DB_PATH before opening connections
    global db_initialized
    if not db_initialized:
        init_db()
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create DB file and tables for the current DB_PATH. Safe to call multiple times.

    This function does not call get_conn() to avoid recursion; it opens
    a direct sqlite3 connection and marks the DB as initialized.
    """
    global db_initialized
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    # users: store last location inline for simplicity
    cur.execute(
        """
		CREATE TABLE IF NOT EXISTS users (
			username TEXT PRIMARY KEY,
			password TEXT NOT NULL
		)
		"""
    )
    # new table to store multiple location entries per user; entries are pruned after 15 minutes
    cur.execute(
        """
		CREATE TABLE IF NOT EXISTS locations (
			username TEXT NOT NULL,
			latitude REAL NOT NULL,
			longitude REAL NOT NULL,
			ts TEXT NOT NULL
		)
		"""
    )
    cur.execute(
        """
		CREATE TABLE IF NOT EXISTS sessions (
			session_id TEXT PRIMARY KEY,
			username TEXT NOT NULL
		)
		"""
    )
    cur.execute(
        """
		CREATE TABLE IF NOT EXISTS friend_requests (
			id TEXT PRIMARY KEY,
			from_user TEXT NOT NULL,
			to_user TEXT NOT NULL,
			status TEXT NOT NULL,
			created TEXT NOT NULL
		)
		"""
    )
    cur.execute(
        """
		CREATE TABLE IF NOT EXISTS friends (
			user TEXT NOT NULL,
			friend TEXT NOT NULL,
			PRIMARY KEY (user, friend)
		)
		"""
    )

    conn.commit()
    conn.close()
    db_initialized = True


def create_session(username: str) -> str:
    sid = uuid.uuid4().hex
    conn = get_conn()
    conn.execute(
        "INSERT INTO sessions(session_id, username) VALUES (?, ?)", (sid, username)
    )
    conn.commit()
    conn.close()
    return sid


def get_username_from_cookie(request: Request) -> Optional[str]:
    sid = request.cookies.get("session_id")
    if not sid:
        return None
    conn = get_conn()
    cur = conn.execute("SELECT username FROM sessions WHERE session_id = ?", (sid,))
    row = cur.fetchone()
    conn.close()
    return row["username"] if row else None


async def get_current_username(request: Request) -> str:
    username = get_username_from_cookie(request)
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized"
        )
    return username

async def delete_old_location_entries(max_time:int=15, interval:int=60):
    """Delete old location entries. Executed all 60 seconds and delete entries older than 15 minutes. 

    :param max_time: Time in minutes. All older entries are deleted. 
    """
    while True: 
        conn = get_conn()
        cutoff = (datetime.now(UTC) - timedelta(minutes=max_time)).isoformat()
        conn.execute("DELETE FROM locations WHERE ts < ?", (cutoff,))
        conn.commit()
        conn.close()
        await asyncio.sleep(interval)

@app.post("/signup", response_model=GenericResponse)
async def signup(req: SignupRequest):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM users WHERE username = ?", (req.username,))
    if cur.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Username already exists")
    cur.execute(
        "INSERT INTO users(username, password) VALUES (?, ?)",
        (req.username, req.password),
    )
    conn.commit()
    conn.close()
    return GenericResponse(success=True, detail="Account created.")


@app.post("/login")
async def login(req: LoginRequest, response: Response):
    conn = get_conn()
    cur = conn.execute("SELECT password FROM users WHERE username = ?", (req.username,))
    row = cur.fetchone()
    conn.close()
    if not row or row["password"] != req.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )
    sid = create_session(req.username)
    response.set_cookie(key="session_id", value=sid, httponly=True, path="/")
    return {"success": True, "detail": "Logged in."}


@app.post("/logout")
async def logout(
    request: Request, response: Response, username: str = Depends(get_current_username)
):
    """Logout current user: remove session from DB and clear cookie."""
    sid = request.cookies.get("session_id")
    if sid:
        conn = get_conn()
        conn.execute("DELETE FROM sessions WHERE session_id = ?", (sid,))
        conn.commit()
        conn.close()
    # clear cookie on client
    response.delete_cookie("session_id", path="/")
    return {"success": True, "detail": "Logged out."}


@app.get("/authCheck")
async def auth_check(username: str = Depends(get_current_username)):
    """Return authenticated username if the session cookie is valid."""
    return {"username": username}


@app.post("/friend-request/create", response_model=GenericResponse)
async def send_friend_request(
    body: FriendRequestBody, username: str = Depends(get_current_username)
):
    target = body.friendUsername
    if target == username:
        raise HTTPException(status_code=400, detail="Cannot friend yourself")
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT 1 FROM users WHERE username = ?", (target,)
    )
    if not cur.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    # check existing friendship
    cur.execute(
        "SELECT 1 FROM friends WHERE user = ? AND friend = ?", (username, target)
    )
    if cur.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Already friends")
    rid = uuid.uuid4().hex
    # check for pending request
    cur.execute(
        "SELECT 1 FROM friend_requests WHERE (from_user = ?1 and to_user = ?2) OR (from_user = ?2 and to_user = ?1)", (username, target)
    )
    if cur.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Request already pending. ")

    # insert friends
    cur.execute(
        "INSERT INTO friend_requests(id, from_user, to_user, status, created) VALUES (?, ?, ?, 'pending', ?)",
        (rid, username, target, datetime.now(UTC).isoformat()),
    )
    conn.commit()
    conn.close()
    return GenericResponse(success=True, detail="Request created", id=rid)


@app.post("/friend-request/{request_id}/accept", response_model=GenericResponse)
async def accept_friend_request(
    request_id: str, username: str = Depends(get_current_username)
):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM friend_requests WHERE id = ?", (request_id,))
    fr = cur.fetchone()
    if not fr:
        conn.close()
        raise HTTPException(status_code=404, detail="Request not found")
    if fr["to_user"] != username:
        conn.close()
        raise HTTPException(status_code=403, detail="Not allowed")
    if fr["status"] != "pending":
        conn.close()
        raise HTTPException(status_code=400, detail=f"Request already {fr['status']}")
    cur.execute(
        "DELETE FROM friend_requests WHERE id = ?", (request_id,)
    )
    # add both directions
    from_user = fr["from_user"]
    cur.execute(
        "INSERT OR IGNORE INTO friends(user, friend) VALUES (?, ?)",
        (username, from_user),
    )
    cur.execute(
        "INSERT OR IGNORE INTO friends(user, friend) VALUES (?, ?)",
        (from_user, username),
    )
    conn.commit()
    conn.close()
    return GenericResponse(success=True, detail="Friend added")


@app.post("/friend-request/{request_id}/reject", response_model=GenericResponse)
async def reject_friend_request(
    request_id: str, username: str = Depends(get_current_username)
):
    """Recipient rejects a pending friend request — delete it

    Simple semantics: only the to_user can reject, and only if status is 'pending'.
    """
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM friend_requests WHERE id = ?", (request_id,))
    fr = cur.fetchone()
    if not fr:
        conn.close()
        raise HTTPException(status_code=404, detail="Request not found")
    if fr["to_user"] != username:
        conn.close()
        raise HTTPException(status_code=403, detail="Not allowed")
    if fr["status"] != "pending":
        conn.close()
        raise HTTPException(status_code=400, detail=f"Request already {fr['status']}")
    cur.execute("DELETE FROM friend_requests WHERE id = ?", (request_id,))
    conn.commit()
    conn.close()
    return GenericResponse(success=True, detail="Request rejected")


@app.post("/friend-request/{request_id}/cancel", response_model=GenericResponse)
async def cancel_friend_request(
    request_id: str, username: str = Depends(get_current_username)
):
    """Allow the sender to cancel their pending friend request - delete it.

    Simple semantics: only the from_user can cancel, and only if status is 'pending'.
    """
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM friend_requests WHERE id = ?", (request_id,))
    fr = cur.fetchone()
    if not fr:
        conn.close()
        raise HTTPException(status_code=404, detail="Request not found")
    if fr["from_user"] != username:
        conn.close()
        raise HTTPException(status_code=403, detail="Not allowed")
    if fr["status"] != "pending":
        conn.close()
        raise HTTPException(status_code=400, detail=f"Request already {fr['status']}")
    cur.execute("DELETE FROM friend_requests WHERE id = ?", (request_id,))
    conn.commit()
    conn.close()
    return GenericResponse(success=True, detail="Request canceled")


@app.get("/friend-requests")
async def list_friend_requests(username: str = Depends(get_current_username)):
    """Return pending friend-requests both to you and from you.

    Response shape matches swagger: { requestsToYou: [...], requestsFromYou: [...] }
    Each entry contains at least id and friendName (the other user).
    """
    conn = get_conn()
    # incoming pending requests (to you)
    cur = conn.execute(
        "SELECT id, from_user, status, created FROM friend_requests WHERE to_user = ? AND status = 'pending' ORDER BY created",
        (username,),
    )
    requests_to_you = [
        {
            "id": r["id"],
            "friendName": r["from_user"],
            "status": r["status"],
            "created": r["created"],
        }
        for r in cur.fetchall()
    ]

    # outgoing pending requests (from you)
    cur2 = conn.execute(
        "SELECT id, to_user, status, created FROM friend_requests WHERE from_user = ? AND status = 'pending' ORDER BY created",
        (username,),
    )
    requests_from_you = [
        {
            "id": r["id"],
            "friendName": r["to_user"],
            "status": r["status"],
            "created": r["created"],
        }
        for r in cur2.fetchall()
    ]

    conn.close()
    return {"requestsToYou": requests_to_you, "requestsFromYou": requests_from_you}


@app.get("/friends")
async def list_friends(username: str = Depends(get_current_username)):
    conn = get_conn()
    cur = conn.execute(
        "SELECT friend FROM friends WHERE user = ? ORDER BY friend", (username,)
    )
    friends = [r["friend"] for r in cur.fetchall()]
    conn.close()
    return friends


@app.delete("/friends/{friend_username}", response_model=GenericResponse)
async def delete_friend(
    friend_username: str, username: str = Depends(get_current_username)
):
    """Remove an existing friend connection between the current user and the given username.

    This removes both directional rows from the `friends` table. If the users are not
    friends, a failure response is returned.
    """
    conn = get_conn()
    cur = conn.cursor()
    # check existing friendship (current user -> friend)
    cur.execute(
        "SELECT 1 FROM friends WHERE user = ? AND friend = ?",
        (username, friend_username),
    )
    if not cur.fetchone():
        conn.close()
        return HTTPException(success=False, message="Not friends")

    # delete both directions (if present)
    cur.execute(
        "DELETE FROM friends WHERE user = ? AND friend = ?", (username, friend_username)
    )
    cur.execute(
        "DELETE FROM friends WHERE user = ? AND friend = ?", (friend_username, username)
    )
    conn.commit()
    conn.close()

    return GenericResponse(success=True, message="Friend removed")


@app.post("/location")
async def location(loc: Location, username: str = Depends(get_current_username)):
    """Store the caller's location in `locations`, prune older entries (15 minutes),
    and return all recent location entries for the caller's friends (looked up from `friends`).

    Request shape: { latitude: float, longitude: float }
    Response: list of { username, latitude, longitude, ts }
    """
    ts = datetime.now(UTC).isoformat()
    conn = get_conn()
    # insert own location row
    conn.execute(
        "INSERT INTO locations(username, latitude, longitude, ts) VALUES (?, ?, ?, ?)",
        (username, loc.latitude, loc.longitude, ts),
    )

    # delete_old_location_entries()

    # determine friends from the friends table for the current user
    cur_f = conn.execute(
        "SELECT friend FROM friends WHERE user = ? ORDER BY friend", (username,)
    )
    friends = [r["friend"] for r in cur_f.fetchall()]
    if not friends:
        conn.commit()
        conn.close()
        return []

    # query locations for the friends
    placeholders = ",".join("?" for _ in friends)
    cur = conn.execute(
        f"SELECT username, latitude, longitude, ts FROM locations WHERE username IN ({placeholders}) ORDER BY ts",
        tuple(friends),
    )
    rows = [
        {
            "username": r["username"],
            "location": {"latitude": r["latitude"], "longitude": r["longitude"]},
            "ts": r["ts"],
        }
        for r in cur.fetchall()
    ]
    conn.commit()
    conn.close()

    return rows


@app.get("/events")
async def events(request: Request, username: str = Depends(get_current_username)):
    q: asyncio.Queue = asyncio.Queue(maxsize=32)
    sse_queues.setdefault(username, set()).add(q)

    async def event_generator():
        try:
            yield "event: detail\ndata: {}\n\n".format(
                json.dumps({"detail": "connected", "ts": datetime.now(UTC).isoformat()})
            )
            while True:
                if await request.is_disconnected():
                    break
                try:
                    data = await asyncio.wait_for(q.get(), timeout=15.0)
                except asyncio.TimeoutError:
                    yield ": ping\n\n"
                    continue
                yield f"data: {data}\n\n"
        finally:
            try:
                sse_queues.get(username, set()).discard(q)
            except Exception:
                pass

    return StreamingResponse(event_generator(), media_type="text/event-stream")


if __name__ == "__main__":
    import uvicorn
    import argparse
    import sys

    parser = argparse.ArgumentParser(description="Run TrainFriends server")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind uvicorn to")
    parser.add_argument(
        "--port", default=8000, type=int, help="Port to bind uvicorn to"
    )
    parser.add_argument(
        "--data",
        default=None,
        help="Path to sqlite data file to use (overrides default)",
    )
    args = parser.parse_args()

    # If user provided --data, override DB_PATH before initializing DB
    if args.data:
        DB_PATH = Path(args.data).expanduser().resolve()

    # Ensure DB is initialized for the chosen path
    init_db()
    #asyncio.create_task(delete_old_location_entries())

    # Minimal startup scheduling
    app.add_event_handler("startup", lambda: asyncio.create_task(delete_old_location_entries()))

    uvicorn.run(app, host=args.host, port=args.port)

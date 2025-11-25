from fastapi import FastAPI, Request, Response, Depends, HTTPException, status
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
import uuid
from contextlib import asynccontextmanager
import asyncio
import uvicorn
import argparse
import sys
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

db_initialized = False

# SSE per-user queues for pushing events (in-memory)
sse_queues: dict[str, Set[asyncio.Queue]] = {}

class Config: 
    def __init__(self, host: str, port: int, db_path: str):
        self.host = host
        self.port = port
        self.db_path = db_path

config = None

class SignupRequest(BaseModel):
    userid: str
    password: str


class GenericResponse(BaseModel):
    success: bool
    detail: Optional[str] = None
    id: Optional[str] = None


class LoginRequest(BaseModel):
    userid: str
    password: str


class LogoutRequest(BaseModel): 
    session_id: str


class DeleteUserRequest(BaseModel): 
    userid: str
    password: str


class FriendRequestBody(BaseModel):
    friendUserID: str


class Location(BaseModel):
    latitude: float
    longitude: float


@asynccontextmanager 
async def lifespan(app: FastAPI):
    ## Startup    
    # initialize DB
    await init_db()

    # create and store cleanup tasks on app.state in uvicorn's loop
    app.state.cleanup_tasks = []
    app.state.cleanup_tasks.append(asyncio.create_task(delete_old_session_entries()))
    app.state.cleanup_tasks.append(asyncio.create_task(delete_old_location_entries()))

    yield
    
    ## Shutdown
    # cancel and await background tasks created at startup
    tasks = getattr(app.state, "cleanup_tasks", [])
    for t in tasks:
        t.cancel()
    if tasks:
        await asyncio.gather(*tasks, return_exceptions=True)


app = FastAPI(
    title="TrainFriends - Simple Server",
    lifespan=lifespan, 
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


def parse_args():
    parser = argparse.ArgumentParser(description="Run TrainFriends server")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind uvicorn to")
    parser.add_argument("--port", default=8000, type=int, help="Port to bind uvicorn to")
    parser.add_argument("--data", default=Path(__file__).resolve().parent / "data.db", help="Path to sqlite data file to use (overrides default)")
    return parser.parse_args()

def get_conn():
    # Ensure DB is initialized for the chosen db path before opening connections
    global db_initialized
    if not db_initialized:
        init_db()
    conn = sqlite3.connect(str(config.db_path))
    conn.row_factory = sqlite3.Row
    return conn


async def init_db():
    """Create DB file and tables for the current db path. Safe to call multiple times.

    This function does not call get_conn() to avoid recursion; it opens
    a direct sqlite3 connection and marks the DB as initialized.
    """
    global db_initialized
    config.db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(config.db_path))
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    # users: store last location inline for simplicity
    cur.execute(
        """
		CREATE TABLE IF NOT EXISTS users (
			userid TEXT PRIMARY KEY,
			password TEXT NOT NULL
		)
		"""
    )
    
    # new table to store multiple location entries per user; entries are pruned after 15 minutes
    cur.execute(
        """
		CREATE TABLE IF NOT EXISTS locations (
			userid TEXT NOT NULL,
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
            userid TEXT NOT NULL,
            ts TEXT NOT NULL
        )
        """
    )
    
    cur.execute(
        """
		CREATE TABLE IF NOT EXISTS friend_requests (
			id TEXT PRIMARY KEY,
			from_userid TEXT NOT NULL,
			to_userid TEXT NOT NULL,
			status TEXT NOT NULL,
			created TEXT NOT NULL
		)
		"""
    )
    cur.execute(
        """
		CREATE TABLE IF NOT EXISTS friends (
			userid1 TEXT NOT NULL,
			userid2 TEXT NOT NULL,
			PRIMARY KEY (userid1, userid2)
		)
		"""
    )

    conn.commit()
    conn.close()
    db_initialized = True


def create_session(userid: str) -> str:
    ts = datetime.now(UTC).isoformat()
    sid = uuid.uuid4().hex
    conn = get_conn()
    conn.execute(
        "INSERT INTO sessions(session_id, userid, ts) VALUES (?, ?, ?)", (sid, userid, ts)
    )
    conn.commit()
    conn.close()
    return sid


def get_userid_from_cookie(request: Request) -> Optional[str]:
    sid = request.cookies.get("session_id")
    if not sid:
        return None
    conn = get_conn()
    cur = conn.execute("SELECT userid FROM sessions WHERE session_id = ?", (sid,))
    row = cur.fetchone()
    conn.close()
    return row["userid"] if row else None


async def get_current_userid(request: Request) -> str:
    userid = get_userid_from_cookie(request)
    if not userid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized"
        )
    return userid


async def delete_old_location_entries(max_time:int=15, interval:int=60):
    """Delete old location entries. Executed all 60 seconds and delete entries older than 15 minutes. 

    :param max_time: Time in minutes. All older entries are deleted. 
    :param interval: Interval (in seconds) in which the timestamps are checked. 
    """
    if max_time <= 0:
        return

    while True: 
        try: 
            cutoff = (datetime.now(UTC) - timedelta(minutes=max_time)).isoformat()
            # pass the callable and its argument to asyncio.to_thread
            await asyncio.to_thread(_delete_old_location_entries, cutoff)
        except Exception as e: 
            print(f"Error in cleaning up locations with timestamp < {cutoff} from TABLE sessions. {e}")
        await asyncio.sleep(interval)

def _delete_old_location_entries(cutoff): 
    conn = get_conn()
    conn.execute("DELETE FROM locations WHERE ts < ? OR ts IS NULL", (cutoff,))
    conn.commit()
    conn.close()


async def delete_old_session_entries(max_time:int=30, interval:int=60):
    """Delete old session entries. Executed all 60 seconds and delete entries older than 30 days

    :param max_time: Time in days. All older entries are deleted. 
    :param interval: Interval (in seconds) in which the timestamps are checked. 
    """
    if max_time <= 0: 
        return
    
    while True: 
        cutoff = (datetime.now(UTC) - timedelta(days=max_time)).isoformat()
        try: 
                # pass the callable and its argument to asyncio.to_thread
                await asyncio.to_thread(_delete_old_session_entries, cutoff)
        except Exception as e: 
            print(f"Error in cleaning up sessions with timestamp < {cutoff} from TABLE sessions. {e}")
        await asyncio.sleep(interval)

def _delete_old_session_entries(cutoff): 
    conn = get_conn()
    conn.execute("DELETE FROM sessions WHERE ts < ? OR ts IS NULL", (cutoff,))
    conn.commit()
    conn.close()


@app.post("/signup", response_model=GenericResponse)
async def signup(req: SignupRequest):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM users WHERE userid = ?", (req.userid,))
    if cur.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="UserID already exists")
    cur.execute(
        "INSERT INTO users(userid, password) VALUES (?, ?)",
        (req.userid, req.password),
    )
    conn.commit()
    conn.close()
    return GenericResponse(success=True, detail="Account created.")


@app.post("/login")
async def login(request: LoginRequest, response: Response):
    conn = get_conn()
    cur = conn.execute("SELECT password FROM users WHERE userid = ?", (request.userid,))
    row = cur.fetchone()
    conn.close()
    if not row or row["password"] != request.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )
    sid = create_session(request.userid)
    response.set_cookie(key="session_id", value=sid, httponly=True, path="/")
    return {"success": True, "detail": "Logged in."}


@app.post("/logout")
async def logout(request: LogoutRequest, response: Response):
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


@app.post("/delete_user")
async def close_account(request: DeleteUserRequest, response: Response): 
    """Delete current user: remove session from DB, clear cookie, remove from locations, remove from friend-requests, remove from friends, remove from users table"""
    conn = get_conn()
    conn.execute("DELETE FROM sessions WHERE userid = ?", (request.userid,))
    conn.execute("DELETE FROM locations WHERE userid = ?", (request.userid,))
    conn.execute(
        "DELETE FROM friend_requests WHERE (from_userid = ?1 OR to_userid = ?1)",
        (request.userid),
    )
    conn.execute(
        "DELETE FROM friends WHERE (userid1 = ?1 OR userid2 = ?1)",
        (request.userid),
    )
    
    conn.commit()
    conn.close()
    
    # clear cookie on client
    # sid = request.cookies.get("session_id")
    #response.delete_cookie("session_id", path="/")
    return {"success": True, "detail": f"Deleted account {request.userid} successfully. "}
    


@app.get("/authCheck")
async def auth_check(userid: str = Depends(get_current_userid)):
    """Return authenticated userid if the session cookie is valid."""
    return {"userid": userid}


@app.post("/friend-request/create", response_model=GenericResponse)
async def send_friend_request(
    body: FriendRequestBody, userid: str = Depends(get_current_userid)
):
    target = body.friendUserID
    if target == userid:
        raise HTTPException(status_code=400, detail="Cannot friend yourself")
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT 1 FROM users WHERE userid = ?", (target,)
    )
    if not cur.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    # check existing friendship
    cur.execute(
        "SELECT 1 FROM friends WHERE userid1 = ? AND userid2 = ?", (userid, target)
    )
    if cur.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Already friends")
    rid = uuid.uuid4().hex
    # check for pending request
    cur.execute(
        "SELECT 1 FROM friend_requests WHERE (from_userid = ?1 AND to_userid = ?2) OR (from_userid = ?2 AND to_userid = ?1)",
        (userid, target)
    )
    if cur.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Request already pending. ")

    # insert friends
    cur.execute(
        "INSERT INTO friend_requests(id, from_userid, to_userid, status, created) VALUES (?, ?, ?, 'pending', ?)",
        (rid, userid, target, datetime.now(UTC).isoformat()),
    )
    conn.commit()
    conn.close()
    return GenericResponse(success=True, detail="Request created", id=rid)


@app.post("/friend-request/{request_id}/accept", response_model=GenericResponse)
async def accept_friend_request(
    request_id: str, userid: str = Depends(get_current_userid)
):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM friend_requests WHERE id = ?", (request_id,))
    fr = cur.fetchone()
    if not fr:
        conn.close()
        raise HTTPException(status_code=404, detail="Request not found")
    if fr["to_userid"] != userid:
        conn.close()
        raise HTTPException(status_code=403, detail="Not allowed")
    if fr["status"] != "pending":
        conn.close()
        raise HTTPException(status_code=400, detail=f"Request already {fr['status']}")
    cur.execute(
        "DELETE FROM friend_requests WHERE id = ?", (request_id,)
    )
    # add both directions
    from_user = fr["from_userid"]
    cur.execute(
        "INSERT OR IGNORE INTO friends(userid1, userid2) VALUES (?, ?)",
        (userid, from_user),
    )
    cur.execute(
        "INSERT OR IGNORE INTO friends(userid1, userid2) VALUES (?, ?)",
        (from_user, userid),
    )
    conn.commit()
    conn.close()
    return GenericResponse(success=True, detail="Friend added")


@app.post("/friend-request/{request_id}/reject", response_model=GenericResponse)
async def reject_friend_request(
    request_id: str, userid: str = Depends(get_current_userid)
):
    """Recipient rejects a pending friend request — delete it

    Simple semantics: only the to_userid can reject, and only if status is 'pending'.
    """
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM friend_requests WHERE id = ?", (request_id,))
    fr = cur.fetchone()
    if not fr:
        conn.close()
        raise HTTPException(status_code=404, detail="Request not found")
    if fr["to_userid"] != userid:
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
    request_id: str, userid: str = Depends(get_current_userid)
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
    if fr["from_userid"] != userid:
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
async def list_friend_requests(userid: str = Depends(get_current_userid)):
    """Return pending friend-requests both to you and from you.

    Response shape matches swagger: { requestsToYou: [...], requestsFromYou: [...] }
    Each entry contains at least id and friendName (the other user).
    """
    conn = get_conn()
    # incoming pending requests (to you)
    cur = conn.execute(
        "SELECT id, from_userid, status, created FROM friend_requests WHERE to_userid = ? AND status = 'pending' ORDER BY created",
        (userid,),
    )
    requests_to_you = [
        {
            "id": r["id"],
            "friendName": r["from_userid"],
            "status": r["status"],
            "created": r["created"],
        }
        for r in cur.fetchall()
    ]

    # outgoing pending requests (from you)
    cur2 = conn.execute(
        "SELECT id, to_userid, status, created FROM friend_requests WHERE from_userid = ? AND status = 'pending' ORDER BY created",
        (userid,),
    )
    requests_from_you = [
        {
            "id": r["id"],
            "friendName": r["to_userid"],
            "status": r["status"],
            "created": r["created"],
        }
        for r in cur2.fetchall()
    ]

    conn.close()
    return {"requestsToYou": requests_to_you, "requestsFromYou": requests_from_you}


@app.get("/friends")
async def list_friends(userid: str = Depends(get_current_userid)):
    conn = get_conn()
    cur = conn.execute(
        "SELECT userid2 FROM friends WHERE userid1 = ? ORDER BY userid2", (userid,)
    )
    friends = [r["userid2"] for r in cur.fetchall()]
    conn.close()
    return friends


@app.delete("/friends/{friend_userid}", response_model=GenericResponse)
async def delete_friend(
    friend_userid: str, userid: str = Depends(get_current_userid)
):
    """Remove an existing friend connection between the current user and the given userid.

    This removes both directional rows from the `friends` table. If the users are not
    friends, a failure response is returned.
    """
    conn = get_conn()
    cur = conn.cursor()
    # check existing friendship (current user -> friend)
    cur.execute(
        "SELECT 1 FROM friends WHERE userid1 = ? AND userid2 = ?",
        (userid, friend_userid),
    )
    if not cur.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Not friends")

    # delete both directions (if present)
    cur.execute(
        "DELETE FROM friends WHERE userid1 = ? AND userid2 = ?", (userid, friend_userid)
    )
    cur.execute(
        "DELETE FROM friends WHERE userid1 = ? AND userid2 = ?", (friend_userid, userid)
    )
    conn.commit()
    conn.close()

    return GenericResponse(success=True, detail="Friend removed")


@app.post("/location")
async def location(loc: Location, userid: str = Depends(get_current_userid)):
    """Store the caller's location in `locations`, prune older entries (15 minutes),
    and return all recent location entries for the caller's friends (looked up from `friends`).

    Request shape: { latitude: float, longitude: float }
    Response: list of { userid, latitude, longitude, ts }
    """
    ts = datetime.now(UTC).isoformat()
    conn = get_conn()
    # insert own location row
    conn.execute(
        "INSERT INTO locations(userid, latitude, longitude, ts) VALUES (?, ?, ?, ?)",
        (userid, loc.latitude, loc.longitude, ts),
    )

    # delete_old_location_entries()

    # determine friends from the friends table for the current user
    cur_f = conn.execute(
        "SELECT userid2 FROM friends WHERE userid1 = ? ORDER BY userid2", (userid,)
    )
    friends = [r["userid2"] for r in cur_f.fetchall()]
    if not friends:
        conn.commit()
        conn.close()
        return []

    # query locations for the friends
    placeholders = ",".join("?" for _ in friends)
    cur = conn.execute(
        f"SELECT userid, latitude, longitude, ts FROM locations WHERE userid IN ({placeholders}) ORDER BY ts",
        tuple(friends),
    )
    rows = [
        {
            "userid": r["userid"],
            "location": {"latitude": r["latitude"], "longitude": r["longitude"]},
            "ts": r["ts"],
        }
        for r in cur.fetchall()
    ]
    conn.commit()
    conn.close()

    return rows


@app.get("/events")
async def events(request: Request, userid: str = Depends(get_current_userid)):
    q: asyncio.Queue = asyncio.Queue(maxsize=32)
    sse_queues.setdefault(userid, set()).add(q)

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
                sse_queues.get(userid, set()).discard(q)
            except Exception:
                pass

    return StreamingResponse(event_generator(), media_type="text/event-stream")


if __name__ == "__main__":
    args = parse_args()
    config = Config(args.host, args.port, Path(args.data).expanduser().resolve())
    uvicorn.run(app, host=config.host, port=config.port)

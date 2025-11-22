## How to manually test the app (PowerShell / Windows, hackathon-friendly)

This file shows a quick, local smoke-test flow for the backend API. It uses curl.exe. 

First install dependencies via conda or pip. 

Start the backend server
  ```powershell
  python server/main.py
  ```
  This runs the FastAPI app (uvicorn) and listens on port 8000 by default.

Optional: choose a persistent DB location
 - You can override the sqlite DB file used by the server with the `--data` flag. Example:
   ```powershell
   python server/main.py --data C:\path\to\persistent\trainfriends.db
   ```
   The server will create and use that DB file (`trainfriends.db`) and retain data across restarts.

Notes

Smoke tests (PowerShell-friendly, use curl.exe)
Explicitly call `curl.exe` to avoid PowerShell's built-in alias.

1) Create two users (alice and bob) in two separate powershell windows
Alice: 
```powershell
curl.exe -X POST http://localhost:8000/signup -H "Content-Type: application/json" -d '{"username":"alice","password":"pass"}'
```
and Bob: 
```powershell
curl.exe -X POST http://localhost:8000/signup -H "Content-Type: application/json" -d '{"username":"bob","password":"pass2"}'
```

2) Login and get the session cookie

When you POST to `/login` the server sets an HTTP-only cookie named `session_id` in the response headers.
Run the login command and copy the `session_id` value from the `Set-Cookie` header in the response. Example (prints headers):

Alice:
```powershell
curl.exe -i -s -X POST http://localhost:8000/login -H "Content-Type: application/json" -d '{"username":"alice","password":"pass"}'
```
Bob: 
```powershell
curl.exe -i -s -X POST http://localhost:8000/login -H "Content-Type: application/json" -d '{"username":"bob","password":"pass2"}'
```

Look for a header like:

Set-Cookie: session_id=<hexvalue>; Path=/; HttpOnly

Copy the `<hexvalue>` (only the value) and use it in subsequent requests with a Cookie header, e.g. `-H "Cookie: session_id=<hexvalue>"`.

3) Create a friend request (alice -> bob)

Use the session cookie value you copied for Alice and supply it in the `Cookie` header for authenticated requests. Example (replace <alice_session> with the value you copied):

Alice:
```powershell
curl.exe -s -X POST http://localhost:8000/friend-request -H "Content-Type: application/json" -H "Cookie: session_id=<alice_session>" -d '{"friendUsername":"bob"}'
```

The response will contain an `id` for the friend request (e.g. `{"success":true,"id":"<rid>",...}`).

4) Accept the friend request as bob (replace <rid> with the id from step 3)

Use the session cookie value you copied for Bob. Example (replace <bob_session> and <rid>):

Bob:
```powershell
curl.exe -s -X POST http://localhost:8000/friend-request/<rid>/accept -H "Cookie: session_id=<bob_session>"
```

5) Verify the friend lists (optional)

Alice: 
```powershell
curl.exe -s http://localhost:8000/friends -H "Cookie: session_id=<alice_session>"
```
Bob: 
```powershell
curl.exe -s http://localhost:8000/friends -H "Cookie: session_id=<bob_session>"
```

6) Test SSE (Server-Sent Events) + push location

Bob (use Bob's session value):
```powershell
curl.exe -N http://localhost:8000/events -H "Cookie: session_id=<bob_session>"
```
Keep this terminal open and watching for events.


Alice (use Alice's session value):
```powershell
curl.exe -s -X POST http://localhost:8000/location -H "Content-Type: application/json" -H "Cookie: session_id=<alice_session>" -d '{"latitude":48.1371,"longitude":11.5754}'
```

Expected SSE output in Terminal B (Bob):
```
data: {"from":"alice","latitude":48.1371,"longitude":11.5754,"ts":"..."}
```

If you see only the initial "connected" message and no location event, verify that the friend relationship was established in step 4.

## Further functionalities (authCheck, logout, friend-requests, reject, cancel)

Replace placeholders like <alice_session>, <bob_session>, and <rid> with real values obtained from the login / friend-request responses.

### Auth check 
- verify session cookie is valid

```powershell
curl.exe -s http://localhost:8000/authCheck -H "Cookie: session_id=<alice_session>"
```

Expected response when authenticated:

```json
{"username":"alice"}
```

### Logout 
- clears the session on the server and clears cookie in the response

```powershell
curl.exe -i -s -X POST http://localhost:8000/logout -H "Cookie: session_id=<alice_session>"
```

Look for a `Set-Cookie` header that clears `session_id` (empty value / Max-Age=0 / Expires set).

### List pending friend requests 
- both incoming and outgoing

```powershell
curl.exe -s http://localhost:8000/friend-requests -H "Cookie: session_id=<bob_session>"
```

Sample response shape:

```json
{
  "requestsToYou": [ { "id": "<rid>", "friendName": "alice", "status": "pending", "created": "..." } ],
  "requestsFromYou": []
}
```

### Reject a pending friend request (recipient action)

```powershell
curl.exe -s -X POST http://localhost:8000/friend-request/<rid>/reject -H "Cookie: session_id=<bob_session>"
```

This will set the request's status to `rejected` (row remains in DB). The endpoint returns a JSON success message.

### Cancel a pending friend request (sender action)

```powershell
curl.exe -s -X POST http://localhost:8000/friend-request/<rid>/cancel -H "Cookie: session_id=<alice_session>"
```

This deletes the pending friend request row. The endpoint returns a JSON success message.

### Notes and quick troubleshooting
- If you get "ModuleNotFoundError: No module named 'fastapi'" install dependencies (conda, pip, etc.). 
- If the server fails to start due to DB locking on heavy write load, stop the server and retry (SQLite is fine for demo/light use).
- After `reject` the request shows status `rejected` in the friend-requests listing; after `cancel` the request no longer appears in either list.
- Trying to accept/reject/cancel a request that is not in `pending` state will return a JSON response indicating the current status (e.g. `Request already accepted`).
- All of these endpoints require authentication (a valid `session_id` cookie). If the cookie is missing or invalid you'll get a 401 response with a JSON body like `{ "detail": "Unauthorized" }`.
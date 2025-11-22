## How to manually test the app (PowerShell / Windows, hackathon-friendly)

This file shows a quick, local smoke-test flow for the backend API. It uses curl.exe. 

First install dependencies via conda or pip. 

Start the backend server
- From the repository root run:
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
- On first run the server will create `server/data.db` (SQLite file) to persist users, sessions and friend data.
- Passwords are stored in plaintext for demo/hackathon simplicity. 

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
- Terminal B: open an SSE stream as bob (it will show a welcome message)

Bob (use Bob's session value):
```powershell
curl.exe -N http://localhost:8000/events -H "Cookie: session_id=<bob_session>"
```
Keep this terminal open and watching for events.

- Terminal A: push a location as alice (this should be pushed to bob via SSE)

Alice (use Alice's session value):
```powershell
curl.exe -s -X POST http://localhost:8000/location -H "Content-Type: application/json" -H "Cookie: session_id=<alice_session>" -d '{"latitude":48.1371,"longitude":11.5754}'
```

Expected SSE output in Terminal B (Bob):
```
data: {"from":"alice","latitude":48.1371,"longitude":11.5754,"ts":"..."}
```

If you see only the initial "connected" message and no location event, verify that the friend relationship was established in step 4.

Quick troubleshooting
- If you get "ModuleNotFoundError: No module named 'fastapi'" install dependencies as shown above.
- If the server fails to start due to DB locking on heavy write load, stop the server and retry (SQLite is fine for demo/light use).

That's it — this should be enough to manually exercise signup/login/friend-request/accept and SSE location pushes for the hackathon demo.
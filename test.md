## How to manually test the app (simple, local, hackathon-friendly)

You'll use two terminals (A and B) and a third to run the server.

## Start the backend server
In a terminal cd to server/test_run, run:
```shell
python .\server\main.py
```
This runs the FastAPI app (it uses uvicorn in the script). Server listens on port 8000.
Basic API smoke tests with curl (pwsh-friendly)
I'll use curl.exe (explicit) to avoid the PowerShell curl alias subtlety.

Signup user alice:
```shell
curl.exe -X POST http://localhost:8000/signup -H "Content-Type: application/json" -d '{"username":"alice","password":"pass"}'
```
Signup user bob:
```shell
curl.exe -X POST http://localhost:8000/signup -H "Content-Type: application/json" -d '{"username":"bob","password":"pass2"}'
```
Login alice and save cookie jar:
```shell
curl.exe -s -X POST http://localhost:8000/login -H "Content-Type: application/json" -d '{"username":"alice","password":"pass"}' -c alice_cookies.txt -D alice_headers.txt
```

`-c alice_cookies.txt` saves the session cookie.

Login bob and save cookie jar:
```shell
curl.exe -s -X POST http://localhost:8000/login -H "Content-Type: application/json" -d '{"username":"bob","password":"pass2"}' -c bob_cookies.txt -D bob_headers.txt
```
Create a friend request (alice -> bob) and get the request id
```shell
curl.exe -s -X POST http://localhost:8000/friend-request -H "Content-Type: application/json" -d '{"friendUsername":"bob"}' -b alice_cookies.txt
```
Use alice's cookie to authenticate:
The response is JSON and, thanks to the small edit, includes "id": "<rid>". Copy that id for the next step.


Accept the friend request as bob. Suppose the id returned was abcdef123. Then (using bob's cookie):
```shell
curl.exe -s -X POST http://localhost:8000/friend-request/abcdef123/accept -b bob_cookies.txt
```
If successful, both users now appear in each other's friends set on the server.
Verify /friends for each user (optional)
For alice:
```shell
curl.exe -s http://localhost:8000/friends -b alice_cookies.txt
```
For bob:
```shell
curl.exe -s http://localhost:8000/friends -b bob_cookies.txt
```
Test SSE + push location (two terminals)
Terminal B: open an SSE stream as bob (will show a welcome message immediately)
```shell
curl.exe -N http://localhost:8000/events -b bob_cookies.txt
```
You should see a first "connected" message from the server like:
data: {"message":"connected","ts":"..."}
Keep this terminal open and watching.
Terminal A: push a location as alice (this should be pushed to bob via SSE)
```shell
curl.exe -s -X POST http://localhost:8000/location -H "Content-Type: application/json" -d '{"latitude":48.1371,"longitude":11.5754}' -b alice_cookies.txt
```
In Terminal B you should see an event like:
data: {"from":"alice","latitude":48.1371,"longitude":11.5754,"ts":"..."}
If you only see the connected ping and no location, check that the friend relationship was established (step 4).
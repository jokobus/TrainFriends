# server/test.py
# Automatic test script to test interaction between two friends Alice and Bob
import requests
import threading
import time
import json

BASE = "http://localhost:8000"

def sse_reader(session):
    with session.get(f"{BASE}/events", stream=True) as resp:
        for line in resp.iter_lines():
            if line:
                try:
                    text = line.decode()
                except:
                    text = line
                if text.startswith("data: "):
                    payload = text[len("data: "):]
                    print("SSE:", payload)

def main():
    # install requests if missing: pip install requests
    a = requests.Session()
    b = requests.Session()

    # signup (ignore errors)
    a.post(f"{BASE}/signup", json={"username": "alice", "password": "pass"})
    b.post(f"{BASE}/signup", json={"username": "bob", "password": "pass2"})

    # login (stores cookie in the session)
    r = a.post(f"{BASE}/login", json={"username": "alice", "password": "pass"})
    print("alice login:", r.status_code)
    r = b.post(f"{BASE}/login", json={"username": "bob", "password": "pass2"})
    print("bob login:", r.status_code)

    # alice sends friend request
    r = a.post(f"{BASE}/friend-request/create", json={"friendUsername": "bob"})
    print("friend-request response:", r.text)
    req_json = r.json()
    rid = req_json.get("id")
    print("request id:", rid)

    # bob accepts
    r = b.post(f"{BASE}/friend-request/{rid}/accept")
    print("accept response:", r.text)

    # start SSE reader in background for bob
    t = threading.Thread(target=sse_reader, args=(b,), daemon=True)
    t.start()

    time.sleep(1)
    # alice reports her location; server will return recent locations for Alice's friends (bob)
    r = a.post(f"{BASE}/location", json={"latitude": 48.1371, "longitude": 11.5754})
    print("location (report+query) response:", r.status_code, r.text)

    # register device tokens for FCM (hackathon simple - one token per user)
    r = a.post(f"{BASE}/register-token", json={"token": "tok-alice"})
    print("alice register-token:", r.status_code, r.text)
    r = b.post(f"{BASE}/register-token", json={"token": "tok-bob"})
    print("bob register-token:", r.status_code, r.text)

    # alice notifies her friends (bob) that she's nearby
    r = a.post(f"{BASE}/notify-friends", json={"friends": ["bob"]})
    print("notify-friends response:", r.status_code, r.text)

    # wait a bit to receive SSE
    time.sleep(3)

if __name__ == "__main__":
    main()
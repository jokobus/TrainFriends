# TrainFriends — HackaTUM 2025 (City of Munich Challenge)

## Inspiration

Friends from the same Munich suburb commute to university alone, missing chances for a chat because they don’t know they’re on the same train.

## What it does

This project analyzes location data in real time and notifies both parties when they’re on the same train, turning a solitary ride into a social opportunity.

Key ideas:
- Exchange short GPS updates between friends.
- Detect nearby friends on the same train (or close-by) and notify both sides.
- Use a lightweight server and persistent SQLite storage for sessions, friend relationships and short-lived location entries. Location entries are automatically deleted after 15 minutes. 

## How we built it

- Backend: Python (FastAPI) server with a SQLite database to manage users, sessions, friend requests/friends and recent location entries. 
- Frontend: Node.js + TypeScript web app using Vite/React. An Android app for live GPS access and native notifications. 

## Architecture (short)

- server/
  - `main.py` — FastAPI server, stores data in `server/data.db` by default, exposes endpoints like `/signup`, `/login`, `/location` and `/friends`
- frontend/
  - Vite + React TypeScript app, mobile-capable. 

## Reproduce / Run locally (Windows PowerShell)

Below are minimal steps to get backend and frontend running on a dev machine. These commands assume PowerShell on Windows (pwsh.exe) and recent Node.js and Python 3.10+ installed.

1) Backend

You need the following dependencies

```
fastapi
pydantic
uuid
asyncio
json
typing
datetime
sqlite3
firebase-admin
```

```python
python server/main.py
```

Notes:
- The server automatically creates `server/data.db` and necessary tables.
- For debugging/testing you can inspect the tables with `python server/dump_db.py`
- API docs and testing UI are available at `http://localhost:8000/docs` (or the port you configured).


2) Frontend (web / development)

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` (vite uses port 3000 in this project). The frontend expects the backend available under the proxy setting (see `frontend/package.json`).

3) Android — quick notes

If you want to build an Android app (for live GPS access), follow the general Capacitor flow from the `frontend` folder:

```powershell
cd frontend
npm run build
npx cap sync android
npx cap open android
```

Then build/run from Android Studio. You may need to install the Android SDK / Android Studio and configure an emulator or device.

## Configuration & tips

- The server uses session cookies (`session_id`) for auth. Use the login endpoint to obtain the cookie (browser automatically stores it).
- Location entries are pruned after ~15 minutes as implemented in `server/main.py`.
- SSE endpoint: `/events` provides a text/event-stream for receiving push events from the server.

## Development notes

- To change the backend port for convenience with the frontend proxy, run the server with `--port 8080`.
- The frontend has Vite, React and MUI. The repository already contains the majority of components under `frontend/src`.
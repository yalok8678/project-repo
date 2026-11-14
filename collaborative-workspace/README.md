# CollabSpace — Real-Time Collaborative Workspace

A full-stack Notion/Figma-inspired collaborative workspace MVP built with React, Express, PostgreSQL, Prisma, TipTap, Yjs and WebSockets.

## Included
- Email/password registration and login (JWT)
- Workspaces, members, pages and role-based access (owner/admin/editor/commenter/viewer)
- TipTap rich-text editor backed by Yjs CRDT documents
- Live collaboration through a dedicated WebSocket server (`y-websocket`)
- Live user presence and colored cursors
- Comments attached to pages
- Version snapshots (manual save + restore)
- Page history list
- API and architecture documentation
- Basic API tests and a manual multi-browser test plan
- Optional Redis connection configuration for future horizontal scaling

> This is a runnable MVP/starter, not a hardened production service. The collaboration server uses Yjs LevelDB persistence locally. For multi-instance production deployment, use a shared Yjs persistence/provider strategy and Redis pub/sub adapter; the Redis configuration is included as an extension point rather than claiming distributed synchronization is already enabled.

## Requirements
- Node.js 20+
- PostgreSQL 15+
- npm
- Optional Redis 7+

## 1. Configure environment
Copy `server/.env.example` to `server/.env` and set `DATABASE_URL`, `JWT_SECRET`, and `CLIENT_ORIGIN`.
Copy `client/.env.example` to `client/.env`.

## 2. Install and initialize database
```bash
cd server
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```
The API starts on `http://localhost:4000`.

## 3. Start collaboration server
In a second terminal:
```bash
cd collaboration
npm install
npm run dev
```
The WebSocket server starts on `ws://localhost:1234`.

## 4. Start frontend
In a third terminal:
```bash
cd client
npm install
npm run dev
```
Open `http://localhost:5173`.

## First use
1. Register two accounts in separate browser profiles.
2. Create a workspace from the dashboard.
3. Invite/add the second account by email from workspace settings.
4. Create a page and open it in both browsers.
5. Type in either browser; changes and cursors should synchronize.

## Important notes
- Workspace owner can manage membership and permissions.
- `viewer` cannot edit; `commenter` can comment; `editor` can edit.
- Page snapshots are saved from the editor toolbar. Snapshots store the Yjs document state as base64.
- The collaboration server uses `y-websocket` with LevelDB persistence in `collaboration/data`.
- The browser authenticates to the collaboration server using a short-lived collaboration token obtained from the API.
- Redis is optional and currently used for health/config visibility only. Do not run multiple collaboration instances until a shared persistence and pub/sub provider is implemented and load-tested.
- Before production: add email verification/password reset, CSRF strategy if moving away from bearer tokens, audit logs, rate limits on collaboration rooms, malware/file upload controls, backups, observability, and security review.

## Useful scripts
Server:
- `npm run dev`
- `npm test`
- `npm run prisma:studio`

Client:
- `npm run dev`
- `npm run build`

Collaboration:
- `npm run dev`

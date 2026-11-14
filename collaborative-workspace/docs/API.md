# API reference

Base URL: `http://localhost:4000/api`

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Sign in |
| GET | `/me` | Current user |
| GET | `/collab-token` | Short-lived WebSocket token |
| GET/POST | `/workspaces` | List/create workspaces |
| GET | `/workspaces/:workspaceId` | Workspace, members, pages |
| POST | `/workspaces/:workspaceId/members` | Add registered user |
| PATCH | `/workspaces/:workspaceId/members/:memberId` | Change role |
| POST | `/workspaces/:workspaceId/pages` | Create page |
| GET/PATCH | `/pages/:pageId` | Read/update page title |
| GET/POST | `/pages/:pageId/comments` | List/create comments |
| GET/POST | `/pages/:pageId/snapshots` | List/create snapshots |
| GET | `/snapshots/:snapshotId` | Read snapshot state |
| GET | `/health` | API health |

All endpoints except register, login and health require `Authorization: Bearer <token>`.

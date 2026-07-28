# Kanban Task Manager

A full-stack Kanban application with authenticated collaboration, persistent board/task CRUD, due dates, explicit task completion, and durable pointer/keyboard drag-and-drop ordering.

## Stack

- React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, Zustand, and dnd-kit
- Node.js, Express 5, Mongoose, MongoDB, Zod, JWT, and bcrypt
- Vitest, React Testing Library, Supertest, and MongoDB Memory Server

## Prerequisites

- Node.js 20 or newer
- npm
- MongoDB 8.x. The included Windows helper starts a user-owned single-node replica set because transactions are used for ownership changes and ordering.

## Environment

Copy `server/.env.example` to `server/.env` and configure at least:

```env
MONGODB_URI=mongodb://127.0.0.1:27019/kanban?replicaSet=rs0
JWT_ACCESS_SECRET=replace-with-at-least-32-characters
JWT_REFRESH_SECRET=replace-with-another-32-character-secret
ALLOWED_ORIGINS=http://localhost:5173
```

If the frontend cannot use a same-origin `/api/v1` proxy, create `.env.local`:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

## Install and Run

```bash
npm install
npm run db:start
npm --workspace server run seed
npm run server:dev
npm run dev
```

`npm run db:start` is idempotent and keeps its files under `.runtime/mongodb-kanban-rs0`. Verify the transaction-capable topology with `npm run db:verify`. If this checkout previously used standalone MongoDB on port 27017, stop the API and run `npm run db:migrate:standalone` once before seeding or restarting it; migration refuses to overwrite a non-empty destination.

Frontend: `http://localhost:5173`  
API: `http://localhost:5000/api/v1`  
Health: `http://localhost:5000/health`  
Readiness: `http://localhost:5000/ready`

### Seeded Accounts

`npm --workspace server run seed` is idempotent and creates four demo accounts, all with the password `password1234`:

| Email | Global role | Board access |
|---|---|---|
| `admin@example.com` | admin | Sees every board (documented administrative bypass) |
| `demo@example.com` | user | Owner of *Platform Launch* and *Roadmap Archive* |
| `editor@example.com` | editor | Accepted editor on *Platform Launch*, pending invite on *Roadmap Archive* |
| `viewer@example.com` | viewer | Read-only viewer on *Platform Launch* |

The fixture includes three columns, five tasks (four assigned, one deliberately unassigned), due dates, subtasks, and a completed task, so collaboration and assignment behavior can be demonstrated without manual setup.

## Security and Data Behavior

- Access JWTs remain in memory and are sent as bearer tokens.
- Rotating refresh JWTs use scoped HTTP-only cookies.
- Two distinct authorization layers:
  - **Global roles** (`admin`, `editor`, `viewer`, `user`) on the user account. Only `admin` grants cross-board reach; self-registration cannot request `admin`, so the public endpoint cannot escalate privileges.
  - **Per-board access** (`viewer`, `editor`, `owner`) on board membership, which decides what a user may do on a specific board.
- Writes use strict Zod validation and optimistic document versions.
- Task and column moves use transactional, collision-safe position rewrites.

### Collaboration and Assignment

- Board owners manage collaborators from **Board menu → Manage Collaborators**: invite by email, switch a collaborator between editor and viewer, remove access, or transfer ownership. Invitees must already have an account and gain access once the invitation is accepted.
- Membership endpoints are owner-only; the invitation-acceptance route is performed by the invitee.
- Tasks can be assigned to an accepted collaborator from the add/edit task modal, and the assignee is shown in the task detail view. Assignment is optional — tasks may stay unassigned.

### Theme Persistence

Theme is stored on the user account, not just the device, so it follows a user
to another browser. `PATCH /api/v1/auth/me` updates only the caller's own
profile — the account comes from the access token, so one user cannot modify
another, and the strict contract accepts nothing but `themePreference`.

The stored value is an intent rather than a resolved theme: `system` (the
default) defers to the operating system's colour scheme and tracks live
changes to it, while `light` and `dark` are explicit choices. Logged-out users
still get local-storage persistence, and the account preference is adopted once
a session is restored.

See [OpenAPI](docs/openapi.yaml) and [authorization rules](docs/authorization.md).

## Quality Commands

| Command | Purpose |
|---|---|
| `npm run lint` | Lint frontend, shared, and backend source |
| `npm run db:start` | Start and initialize the local `rs0` MongoDB instance |
| `npm run db:verify` | Verify that `rs0` has a writable primary |
| `npm run api:smoke` | Exercise every API route with disposable curl data |
| `npm run typecheck` | Type-check the frontend |
| `npm test` | Run frontend tests |
| `npm run build` | Build the frontend |
| `npm --workspace server test` | Run backend/Supertest integration tests |
| `npm --workspace server run build` | Build the backend |
| `npm run check:all` | Run frontend and backend quality gates |
| `npm audit --audit-level=high` | Check dependency vulnerabilities |

## Current Test Coverage Areas

- API envelope/error normalization and access-token behavior
- Board loading/cache integration and endpoint mutations
- Component loading, error, board, column, and task behavior
- Registration, login, refresh rotation, logout, and protected routes
- Persistent board CRUD, strict validation, and concurrency conflicts
- Viewer/editor/owner/admin authorization and cross-board isolation
- Transactional task/column ordering, due dates, and task completion

## Deployment

### Public URLs

| Service | URL |
|---|---|
| Frontend | <https://kanban-task-manager-psi.vercel.app> |
| Backend API | <https://kanban-api-jmi7.onrender.com/api/v1> |
| API health | <https://kanban-api-jmi7.onrender.com/health> |
| API readiness | <https://kanban-api-jmi7.onrender.com/ready> |

The frontend is hosted on Vercel, the API on Render, and the database on
MongoDB Atlas. The API is on Render's free tier, so it sleeps after inactivity
and the first request may take roughly a minute to wake.

### Provided configuration

| File | Purpose |
|---|---|
| [`render.yaml`](render.yaml) | Render blueprint deploying the API as a web service and the client as a static site |
| [`vercel.json`](vercel.json) | Vercel config for the client alone (SPA rewrites + Vite build) |
| [`server/Dockerfile`](server/Dockerfile) | Multi-stage API image for any container host |

### Required production environment

Set these on the API service. The two JWT secrets must be at least 32
characters; startup deliberately fails if a `development-` placeholder is left
in place while `NODE_ENV=production`.

| Variable | Notes |
|---|---|
| `MONGODB_URI` | **Must be a replica set or mongos.** Task moves, column moves, and ownership transfer use multi-document transactions, so a standalone `mongod` fails readiness. MongoDB Atlas satisfies this by default. |
| `ALLOWED_ORIGINS` | Comma-separated exact client origins. CORS runs with `credentials: true`, so a wildcard will not work. |
| `CROSS_SITE_COOKIES` | Set to `true` when the client and API are on **different sites** (for example a Vercel client calling a Render API). This switches the refresh cookie to `SameSite=None; Secure`, without which the browser never sends it and sessions silently expire after the access token lapses. Requires HTTPS origins; startup fails otherwise. Leave unset for local development. |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Generate per environment; never reuse the development defaults. |
| `NODE_ENV=production` | Also switches the refresh cookie to `Secure`, which requires HTTPS on both origins. |
| `PORT` | Host-assigned on most platforms. |

For the client, set `VITE_API_URL` to the deployed API base (for example
`https://kanban-api.onrender.com/api/v1`). It is read at build time and falls
back to the `/api/v1` same-origin path when unset.

### Seeding a deployed database

Run the seed from the deployed host's shell rather than locally. `MONGODB_URI`
is already configured there, so no production credentials need to be handled
locally, and the host's DNS can resolve `mongodb+srv://` URIs (some networks
block the SRV lookup they require, producing `querySrv ECONNREFUSED` even when
the credentials are valid).

On Render, open the service's **Shell** tab and run:

```bash
npm --workspace server run seed:prod
```

`seed:prod` executes the compiled `dist/` output, so it works in a production
install where `tsx` (a devDependency) is unavailable. Use `npm --workspace
server run seed` for local development instead.

Seeding is idempotent but destructive to the demo fixture: it deletes and
recreates the seeded users and boards, so avoid re-running it once a deployment
holds real data.

### Verifying a deployment

```bash
curl https://<api-host>/health   # process liveness, no database dependency
curl https://<api-host>/ready    # 200 only when MongoDB is connected and transaction-capable
```

`/ready` returning 503 with `NOT_READY` almost always means `MONGODB_URI` points
at a standalone server rather than a replica set.

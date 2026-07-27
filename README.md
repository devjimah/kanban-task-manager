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

Seed login: `demo@example.com` / `password1234`

## Security and Data Behavior

- Access JWTs remain in memory and are sent as bearer tokens.
- Rotating refresh JWTs use scoped HTTP-only cookies.
- Board access levels are viewer, editor, and owner; global administrators have documented bypass scope.
- Writes use strict Zod validation and optimistic document versions.
- Task and column moves use transactional, collision-safe position rewrites.

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

No production URLs are published yet. Before submission, deploy the API and frontend, configure production CORS/cookie settings and MongoDB, verify both health probes, and add the public URLs here.

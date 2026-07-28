# Design Decisions

Where this implementation deviates from the suggested schema or endpoint shapes
in the specification, this document records what was built and why. The
specification presents those shapes as *suggested*; each decision below keeps
the required behaviour while changing how it is modelled.

## 1. Task state is derived from `columnId`, not stored in a `status` field

**Specification:** The suggested Task model lists a `status` field, and the
validation requirements ask for task status values to be validated.

**Implemented:** `Task` has no `status` field. A task's workflow state *is* the
column it belongs to (`columnId`), and explicit completion is a separate,
timestamped fact (`completedAt`).

### Why

A stored `status` string would duplicate information that `columnId` already
holds, and the two can disagree. Every task move would have to update both, in
the same transaction, or the board would start reporting a state that
contradicts where the card actually sits. That is a classic denormalisation
bug, and it appears precisely when the two writes are not atomic — which is the
hardest case to notice in testing and the easiest to hit under concurrent use.

The columns on a board are also user-defined and renameable. A user can add
"Blocked", rename "Doing" to "In Progress", reorder columns, or delete one. A
fixed `status` enum cannot express that, and a free-text `status` validated
against the board's current column titles is just `columnId` with extra steps —
worse, it breaks on rename unless every task in the column is rewritten too.

Deriving state from the relationship means:

- **One source of truth.** Moving a task is a single `columnId` write. There is
  no second field that can drift.
- **Renames are free.** Retitling a column cannot orphan or invalidate a task,
  because tasks reference the column by id, not by its title.
- **The database enforces ordering.** A unique compound index on
  `{ columnId, position }` makes two tasks holding the same slot in a column
  impossible at the storage layer, not merely unlikely.

### How the requirement is still met

The *behaviour* the specification asks for is fully present:

- **Status is exposed in the API.** `GET /boards/:id` returns each column with
  its ordered tasks, so a client always knows a task's state. The frontend maps
  it onto a `status` string (the column's title) at the client boundary in
  `src/api/kanban.ts`, which is what the UI renders in the task detail view.
- **Status transitions are validated.** `PATCH /tasks/:id/move` accepts only a
  real `columnId` (validated as an ObjectId, then checked for board membership
  and access), so a task can never be moved into a state that does not exist.
  An invalid status value is rejected — the check is referential integrity
  against the board's actual columns, which is strictly stronger than matching a
  string against a hardcoded enum.
- **Explicit completion is modelled separately.** `PATCH /tasks/:id/complete`
  sets or clears `completedAt`, because "done" is a distinct fact from "sits in
  the rightmost column". A board may have no Done column at all, and a task can
  be reopened, which a timestamp records and a boolean status would lose.

### Trade-off accepted

Answering "show me every task with status X across all boards" requires joining
through columns rather than filtering one indexed field. That query is not part
of this application's feature set, and `columnId` is indexed, so the cost is a
lookup rather than a scan. If cross-board status reporting were later required,
the fix would be a read-model or aggregation — not a duplicated field on the
write path.

## 2. Global roles and per-board access are separate authorisation layers

**Specification:** The RBAC section lists Admin / Editor / Viewer as user roles.
A later section lists Viewer / Editor / Owner as board access levels.

**Implemented:** Both, as distinct concepts.

- `User.role` — `admin`, `editor`, `viewer`, `user`. An account-wide posture.
  Only `admin` grants cross-board reach.
- `BoardMember.access` — `viewer`, `editor`, `owner`. Decides what a specific
  user may do on a specific board.

### Why

Permission on a Kanban board is inherently per-board: the same person is
reasonably an editor on one board and a viewer on another. A single global role
cannot express that, and collapsing the two would mean either granting
edit rights everywhere or nowhere.

Keeping both layers satisfies the RBAC table literally while making the
collaboration rules ("only owners and editors can modify content", "viewers
cannot edit") enforceable per board, which is what the specification's
collaboration section actually requires. Authorisation resolves as: global
`admin` bypasses board checks; everyone else is evaluated against their
`BoardMember.access` for the board being touched.

Self-registration cannot request `admin`; the public contract excludes it, so
the endpoint cannot be used to escalate privileges.

## 3. API routes are versioned under `/api/v1`

**Specification:** Suggested endpoints are written unversioned, e.g.
`/auth/register`, `/boards/:id`.

**Implemented:** The same paths, mounted under `/api/v1`.

Every suggested route exists with the suggested method and shape; only the
prefix differs. Versioning the API means a future breaking change can ship
alongside the current contract instead of breaking deployed clients, which
matters here because the frontend is deployed separately from the API and the
two are not guaranteed to update together.

## 4. Route handlers are thin; business rules live in services

**Specification:** The deliverables list controllers, routes, models,
middleware, and configuration.

**Implemented:** All of those, plus a `services/` layer.

`controllers/` translate HTTP to and from the domain — read the request, call a
service, shape the response envelope. `services/` own the invariants:
transactional task and column moves, ownership transfer, optimistic version
checks. Keeping the rules out of the HTTP layer is what allows them to be
tested directly and reused between routes without duplicating logic.

## 5. Task and column moves run in MongoDB transactions

Reordering is not a single write. Moving a task changes its `columnId` and
`position`, and shifts the positions of its neighbours in both the source and
destination columns. With a unique index on `{ columnId, position }`, a partial
write does not merely produce bad ordering — it fails outright and can leave the
board wedged.

All such multi-document rewrites are wrapped in a transaction with an optimistic
version check, so a move either applies completely or not at all, and a stale
client is rejected rather than silently overwriting a concurrent change.

This is why the deployment requires a MongoDB replica set (or mongos) rather
than a standalone `mongod`: standalone deployments do not support
multi-document transactions. The API verifies this at startup and reports it
through the `/ready` probe instead of failing later, mid-request.

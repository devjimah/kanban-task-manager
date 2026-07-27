# ADR 0001: Use MongoDB with Mongoose

- Status: Accepted
- Date: 2026-07-14

## Decision

Use MongoDB with Mongoose for persistent application data. Boards, columns, and tasks use separate collections linked by immutable object IDs. Nested subtasks remain embedded in tasks because their lifecycle is owned by a task.

## Rationale

- MongoDB is explicitly supported by the project requirements.
- The document model fits task/subtask reads while separate column and task collections avoid an unbounded board document.
- Mongoose provides schema validation, indexes, optimistic concurrency, transactions, and a mature TypeScript ecosystem.
- The current environment and project history already use Node.js/MongoDB patterns.

## Consequences

- Multi-document reorder operations require a MongoDB replica set in production and integration environments.
- API contracts must use string IDs and must never expose mutable column titles as relationships.
- Transactions, unique indexes, backups, and migration/index synchronization need operational documentation.

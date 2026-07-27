# Authorization Model

## Authentication

- Access tokens are HS256 JWTs with a 15-minute default lifetime, issuer `kanban-api`, audience `kanban-client`, and explicit `access` token type.
- Refresh tokens use a different secret, a 7-day default lifetime, one-time rotation, and a scoped `HttpOnly`, `SameSite=Strict` cookie.
- Only SHA-256 refresh-token hashes are stored. Logout and rotation revoke the matching server session.
- Passwords are hashed with bcrypt. Registration cannot request the global admin role.
- Authentication failures use generic messages and login/registration failures are rate limited.

## Global Roles

| Role | Scope |
|---|---|
| `user` | Access is determined by accepted board memberships. |
| `admin` | May access all boards as an explicit operational bypass. Admin assignment is database/operations controlled. |

## Board Access

| Operation | Viewer | Editor | Owner |
|---|---:|---:|---:|
| Read board/tasks | Yes | Yes | Yes |
| Create/update/delete tasks | No | Yes | Yes |
| Create/update/delete columns | No | Yes | Yes |
| Rename board | No | Yes | Yes |
| Delete board | No | No | Yes |
| List/invite/change/remove collaborators | No | No | Yes |
| Transfer ownership | No | No | Yes |

Invitations remain pending until the invited user accepts. Only accepted memberships grant access. Owners cannot be demoted or removed; ownership must first be transferred atomically to an accepted collaborator.

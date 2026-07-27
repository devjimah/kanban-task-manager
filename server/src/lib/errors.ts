// What: Operational HTTP error class.
// Does: Defines the common structured shape consumed by global error middleware.
// If removed: Specialized API errors lose their shared type and response contract.
export class AppError extends Error {
  // What: Base application-error constructor.
  // Does: Attaches an HTTP status, stable code, and optional field errors to operational failures.
  // If removed: Expected failures lose their structured API response metadata.
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly errors?: Array<{ field: string; message: string }>,
  ) {
    super(message);
  }
}

// What: Specialized operational error class.
// Does: Represents a requested resource that does not exist.
// If removed: Services cannot express standard resource-level 404 failures consistently.
export class NotFoundError extends AppError {
  // What: Resource-not-found error constructor.
  // Does: Produces the standard 404 error used when a requested database entity is absent.
  // If removed: Missing resources would need duplicated error construction or become 500 errors.
  constructor(resource: string) {
    super(404, "NOT_FOUND", `${resource} was not found`);
  }
}

// What: Specialized operational error class.
// Does: Represents concurrency conflicts and unsafe state transitions.
// If removed: Services cannot express standard 409 failures consistently.
export class ConflictError extends AppError {
  // What: Resource-conflict error constructor.
  // Does: Produces the standard 409 response for stale versions and unsafe state transitions.
  // If removed: Concurrency and business conflicts could be reported with incorrect status codes.
  constructor(message = "The resource changed; reload and try again") {
    super(409, "VERSION_CONFLICT", message);
  }
}

// What: Specialized authentication error class.
// Does: Represents missing, invalid, expired, or revoked authentication credentials.
// If removed: Authentication failures cannot produce consistent 401 responses.
export class UnauthorizedError extends AppError {
  // What: Authentication-error constructor.
  // Does: Creates a safe 401 response without exposing token or credential details.
  // If removed: Auth code must duplicate 401 metadata or leak internal verification errors.
  constructor(message = "Authentication is required") {
    super(401, "UNAUTHORIZED", message);
  }
}

// What: Specialized authorization error class.
// Does: Represents authenticated users who lack permission for an operation.
// If removed: RBAC denials cannot produce consistent 403 responses.
export class ForbiddenError extends AppError {
  // What: Authorization-error constructor.
  // Does: Creates the safe 403 response used by global and board-level policies.
  // If removed: Permission failures become inconsistent or may be mistaken for authentication failures.
  constructor(message = "You do not have permission to perform this action") {
    super(403, "FORBIDDEN", message);
  }
}

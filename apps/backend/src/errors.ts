import * as S from "@effect/schema/Schema";

/**
 * Domain errors
 * These are typed errors that Effect can catch by tag
 */

export class TodoNotFoundError extends S.TaggedError<TodoNotFoundError>()(
  "TodoNotFoundError",
  {
    id: S.String,
  }
) {}

export class ValidationError extends S.TaggedError<ValidationError>()(
  "ValidationError",
  {
    message: S.String,
    issues: S.optional(S.Unknown),
  }
) {}

export class DatabaseError extends S.TaggedError<DatabaseError>()(
  "DatabaseError",
  {
    message: S.String,
    cause: S.optional(S.Unknown),
  }
) {}
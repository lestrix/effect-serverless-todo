import { Schema as S } from "effect";

/**
 * Todo entity schema
 * Used for both database storage and API responses
 */
export const Todo = S.Struct({
  id: S.String.pipe(S.minLength(1)),
  title: S.String.pipe(S.minLength(1), S.maxLength(200)),
  completed: S.Boolean,
  createdAt: S.String, // ISO 8601 date string
});

export type Todo = S.Schema.Type<typeof Todo>;

/**
 * CreateTodoInput - for POST /todos
 * No id or createdAt (server-generated)
 */
export const CreateTodoInput = S.Struct({
  title: S.String.pipe(S.minLength(1), S.maxLength(200)),
  completed: S.optional(S.Boolean).pipe(S.withDecodingDefault(() => false)),
});

export type CreateTodoInput = Omit<S.Schema.Type<typeof CreateTodoInput>, 'completed'> & {
  completed?: boolean;
};

/**
 * UpdateTodoInput - for PATCH /todos/:id
 * All fields optional for partial updates
 */
export const UpdateTodoInput = S.partial(
  S.Struct({
    title: S.String.pipe(S.minLength(1), S.maxLength(200)),
    completed: S.Boolean,
  })
);

export type UpdateTodoInput = S.Schema.Type<typeof UpdateTodoInput>;

/**
 * API Response wrappers
 */
export const TodoListResponse = S.Array(Todo);
export type TodoListResponse = S.Schema.Type<typeof TodoListResponse>;

export const ErrorResponse = S.Struct({
  error: S.String,
  details: S.optional(S.Unknown),
});
export type ErrorResponse = S.Schema.Type<typeof ErrorResponse>;
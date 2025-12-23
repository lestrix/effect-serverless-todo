import { Context, Effect, Layer, Ref } from "effect";
import { Todo, CreateTodoInput, UpdateTodoInput } from "@todo/shared";
import { TodoNotFoundError } from "../src/errors.js";

/**
 * TodoRepository service interface
 * This is the contract - implementations can vary (in-memory, DynamoDB, etc.)
 */
export interface TodoRepository {
  getAll: Effect.Effect<readonly Todo[]>;
  getById: (id: string) => Effect.Effect<Todo, TodoNotFoundError>;
  create: (input: CreateTodoInput) => Effect.Effect<Todo>;
  update: (
    id: string,
    updates: UpdateTodoInput
  ) => Effect.Effect<Todo, TodoNotFoundError>;
  delete: (id: string) => Effect.Effect<void, TodoNotFoundError>;
}

/**
 * Service tag for dependency injection
 */
export const TodoRepository = Context.GenericTag<TodoRepository>("TodoRepository");

/**
 * In-memory implementation using Effect Ref
 * Perfect for development and testing
 */
export const TodoRepositoryLive = Layer.effect(
  TodoRepository,
  Effect.gen(function* () {
    // Ref is Effect's atomic reference - thread-safe state
    const todosRef = yield* Ref.make<Map<string, Todo>>(new Map());
    let idCounter = 1;

    return TodoRepository.of({
      getAll: Ref.get(todosRef).pipe(
        Effect.map((map) => Array.from(map.values())),
        Effect.tap((todos) => Effect.log(`Retrieved ${todos.length} todos`))
      ),

      getById: (id) =>
        Ref.get(todosRef).pipe(
          Effect.flatMap((map) => {
            const todo = map.get(id);
            return todo
              ? Effect.succeed(todo)
              : Effect.fail(new TodoNotFoundError({ id }));
          }),
          Effect.tap((todo) => Effect.log(`Retrieved todo: ${todo.id}`))
        ),

      create: (input) =>
        Effect.gen(function* () {
          const id = `todo-${idCounter++}`;
          const now = new Date().toISOString();

          const todo: Todo = {
            id,
            title: input.title,
            completed: input.completed ?? false,
            createdAt: now,
          };

          yield* Ref.update(todosRef, (map) => new Map(map).set(id, todo));
          yield* Effect.log(`Created todo: ${id}`);

          return todo;
        }),

      update: (id, updates) =>
        Ref.get(todosRef).pipe(
          Effect.flatMap((map) => {
            const existing = map.get(id);
            if (!existing) {
              return Effect.fail(new TodoNotFoundError({ id }));
            }

            const updated: Todo = {
              ...existing,
              ...updates,
            };

            return Ref.update(todosRef, (map) => new Map(map).set(id, updated)).pipe(
              Effect.as(updated),
              Effect.tap(() => Effect.log(`Updated todo: ${id}`))
            );
          })
        ),

      delete: (id) =>
        Ref.get(todosRef).pipe(
          Effect.flatMap((map) => {
            if (!map.has(id)) {
              return Effect.fail(new TodoNotFoundError({ id }));
            }

            return Ref.update(todosRef, (map) => {
              const newMap = new Map(map);
              newMap.delete(id);
              return newMap;
            }).pipe(Effect.tap(() => Effect.log(`Deleted todo: ${id}`)));
          })
        ),
    });
  })
);
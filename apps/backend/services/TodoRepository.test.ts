import { describe, it, expect } from "vitest";
import { Effect, Layer } from "effect";
import { TodoRepository, TodoRepositoryLive } from "./TodoRepository.js";
import { TodoNotFoundError } from "../errors.js";

describe("TodoRepository", () => {
  const testLayer = TodoRepositoryLive;

  it("creates and retrieves a todo", async () => {
    const program = Effect.gen(function* () {
      const repo = yield* TodoRepository;

      const created = yield* repo.create({
        title: "Test todo",
        completed: false,
      });

      expect(created.title).toBe("Test todo");
      expect(created.completed).toBe(false);
      expect(created.id).toBeDefined();

      const retrieved = yield* repo.getById(created.id);
      expect(retrieved).toEqual(created);
    });

    await Effect.runPromise(program.pipe(Effect.provide(testLayer)));
  });

  it("updates a todo", async () => {
    const program = Effect.gen(function* () {
      const repo = yield* TodoRepository;

      const todo = yield* repo.create({ title: "Original", completed: false });
      const updated = yield* repo.update(todo.id, { completed: true });

      expect(updated.completed).toBe(true);
      expect(updated.title).toBe("Original");
    });

    await Effect.runPromise(program.pipe(Effect.provide(testLayer)));
  });

  it("deletes a todo", async () => {
    const program = Effect.gen(function* () {
      const repo = yield* TodoRepository;

      const todo = yield* repo.create({ title: "To delete" });
      yield* repo.delete(todo.id);

      // Should fail with TodoNotFoundError
      return yield* repo.getById(todo.id);
    });

    await expect(
      Effect.runPromise(program.pipe(Effect.provide(testLayer)))
    ).rejects.toThrow(TodoNotFoundError);
  });

  it("fails when getting non-existent todo", async () => {
    const program = Effect.gen(function* () {
      const repo = yield* TodoRepository;
      return yield* repo.getById("non-existent");
    });

    await expect(
      Effect.runPromise(program.pipe(Effect.provide(testLayer)))
    ).rejects.toThrow(TodoNotFoundError);
  });

  it("lists all todos", async () => {
    const program = Effect.gen(function* () {
      const repo = yield* TodoRepository;

      yield* repo.create({ title: "Todo 1" });
      yield* repo.create({ title: "Todo 2" });
      yield* repo.create({ title: "Todo 3" });

      const all = yield* repo.getAll;
      expect(all).toHaveLength(3);
    });

    await Effect.runPromise(program.pipe(Effect.provide(testLayer)));
  });
});
import { describe, it, expect } from "vitest";
import { Schema as S, Effect } from "effect";
import { Todo, CreateTodoInput } from "./Todo.js";

describe("Todo Schema", () => {
  it("validates a valid Todo", async () => {
    const validTodo = {
      id: "todo-123",
      title: "Learn Effect",
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const program = S.decodeUnknown(Todo)(validTodo);
    const result = await Effect.runPromise(program);

    expect(result).toEqual(validTodo);
  });

  it("rejects Todo with missing fields", async () => {
    const invalidTodo = {
      id: "todo-123",
      // missing title
      completed: false,
    };

    const program = S.decodeUnknown(Todo)(invalidTodo);

    await expect(Effect.runPromise(program)).rejects.toThrow();
  });

  it("rejects Todo with empty title", async () => {
    const invalidTodo = {
      id: "todo-123",
      title: "", // empty string
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const program = S.decodeUnknown(Todo)(invalidTodo);

    await expect(Effect.runPromise(program)).rejects.toThrow();
  });
});

describe("CreateTodoInput Schema", () => {
  it("defaults completed to false", async () => {
    const input = {
      title: "New todo",
    };

    const program = S.decodeUnknown(CreateTodoInput)(input);
    const result = await Effect.runPromise(program);

    expect(result.completed).toBe(false);
  });
});
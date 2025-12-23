import { Effect } from "effect";
import * as Http from "@effect/platform/HttpServer";
import * as S from "@effect/schema/Schema";
import { CreateTodoInput, UpdateTodoInput, ErrorResponse } from "@todo/shared";
import { TodoRepository } from "./services/TodoRepository.js";
import { TodoNotFoundError, ValidationError } from "./errors.js";

/**
 * Helper: Parse and validate request body with Effect Schema
 */
const parseBody = <A, I, R>(schema: S.Schema<A, I, R>) =>
  (request: Http.request.ServerRequest) =>
    Effect.gen(function* () {
      const body = yield* request.json;
      return yield* S.decodeUnknown(schema)(body).pipe(
        Effect.mapError(
          (error) =>
            new ValidationError({
              message: "Invalid request body",
              issues: error,
            })
        )
      );
    });

/**
 * Helper: Create JSON response
 */
const jsonResponse = <A>(data: A, status: number = 200) =>
  Http.response.json(data, {
    status,
    headers: Http.headers.fromInput({
      "Content-Type": "application/json",
    }),
  });

/**
 * Helper: Map errors to HTTP responses
 */
const handleErrors = <E, A>(effect: Effect.Effect<A, E>) =>
  effect.pipe(
    Effect.catchTags({
      TodoNotFoundError: (error) =>
        Effect.succeed(
          jsonResponse(
            { error: `Todo with id ${error.id} not found` } satisfies ErrorResponse,
            404
          )
        ),
      ValidationError: (error) =>
        Effect.succeed(
          jsonResponse(
            {
              error: error.message,
              details: error.issues,
            } satisfies ErrorResponse,
            400
          )
        ),
    }),
    Effect.catchAll((error) =>
      Effect.succeed(
        jsonResponse(
          {
            error: "Internal server error",
            details: String(error),
          } satisfies ErrorResponse,
          500
        )
      )
    )
  );

/**
 * Main HTTP router
 */
export const RouterLive = Http.router.empty.pipe(
  // GET /health
  Http.router.get(
    "/health",
    Effect.gen(function* () {
      return jsonResponse({
        status: "ok",
        timestamp: new Date().toISOString(),
        service: "todo-api",
      });
    })
  ),

  // GET /todos
  Http.router.get(
    "/todos",
    Effect.gen(function* () {
      const repo = yield* TodoRepository;
      const todos = yield* repo.getAll;
      return jsonResponse(todos);
    }).pipe(handleErrors)
  ),

  // POST /todos
  Http.router.post(
    "/todos",
    Effect.gen(function* () {
      const request = yield* Http.request.ServerRequest;
      const repo = yield* TodoRepository;

      const input = yield* parseBody(CreateTodoInput)(request);
      const todo = yield* repo.create(input);

      return jsonResponse(todo, 201);
    }).pipe(handleErrors)
  ),

  // GET /todos/:id
  Http.router.get(
    "/todos/:id",
    Effect.gen(function* () {
      const request = yield* Http.request.ServerRequest;
      const repo = yield* TodoRepository;
      const id = request.params.id;

      const todo = yield* repo.getById(id);
      return jsonResponse(todo);
    }).pipe(handleErrors)
  ),

  // PATCH /todos/:id
  Http.router.patch(
    "/todos/:id",
    Effect.gen(function* () {
      const request = yield* Http.request.ServerRequest;
      const repo = yield* TodoRepository;
      const id = request.params.id;

      const updates = yield* parseBody(UpdateTodoInput)(request);
      const todo = yield* repo.update(id, updates);

      return jsonResponse(todo);
    }).pipe(handleErrors)
  ),

  // DELETE /todos/:id
  Http.router.delete(
    "/todos/:id",
    Effect.gen(function* () {
      const request = yield* Http.request.ServerRequest;
      const repo = yield* TodoRepository;
      const id = request.params.id;

      yield* repo.delete(id);
      return Http.response.empty({ status: 204 });
    }).pipe(handleErrors)
  ),

  // OPTIONS /* - CORS preflight
  Http.router.options(
    "/*",
    Effect.succeed(
      Http.response.empty({
        status: 204,
        headers: Http.headers.fromInput({
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        }),
      })
    )
  )
);
import { NodeRuntime } from "@effect/platform-node";
import { Effect, Layer, Logger, LogLevel } from "effect";
import * as Http from "@effect/platform/HttpServer";
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Context as LambdaContext,
} from "aws-lambda";
import { RouterLive } from "./router.js";
import { TodoRepositoryLive } from "./services/TodoRepository.js";

/**
 * AWS Lambda handler
 * Converts API Gateway events → Effect HTTP → API Gateway responses
 */
export const handler = async (
  event: APIGatewayProxyEventV2,
  _context: LambdaContext
): Promise<APIGatewayProxyResultV2> => {
  const program = Effect.gen(function* () {
    // Parse Lambda event into HTTP request
    const method = event.requestContext.http.method;
    const path = event.rawPath;
    const query = event.rawQueryString || "";
    const url = query ? `${path}?${query}` : path;
    const headers = new Headers(event.headers || {});
    
    // Decode body if present
    const body = event.body
      ? event.isBase64Encoded
        ? Buffer.from(event.body, "base64").toString()
        : event.body
      : undefined;

    // Create Web API Request
    const webRequest = new Request(`http://localhost${url}`, {
      method,
      headers,
      body,
    });

    // Get router from Effect context
    const router = yield* Http.router.Router;

    // Create Effect server request from Web request
    const serverRequest = Http.request.fromWeb(webRequest);

    // Execute router
    const response = yield* router.pipe(
      Effect.provideService(Http.request.ServerRequest, serverRequest)
    );

    // Add CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Convert Effect response to Lambda response
    const responseText = yield* response.text;

    return {
      statusCode: response.status,
      headers: {
        ...Object.fromEntries(response.headers),
        ...corsHeaders,
      },
      body: responseText,
    };
  }).pipe(
    // Global error handler
    Effect.catchAll((error) =>
      Effect.succeed({
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Internal Server Error",
          message: String(error),
        }),
      })
    ),
    // Set log level
    Logger.withMinimumLogLevel(LogLevel.Info),
    // Provide dependencies
    Effect.provide(RouterLive),
    Effect.provide(TodoRepositoryLive)
  );

  // Run Effect program and return result
  return NodeRuntime.runPromise(program);
};// test

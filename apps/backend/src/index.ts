import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Context as LambdaContext,
} from "aws-lambda";

/**
 * Temporary simplified Lambda handler for debugging
 * Tests basic Lambda Function URL connectivity
 */
export const handler = async (
  event: APIGatewayProxyEventV2,
  context: LambdaContext
): Promise<APIGatewayProxyResultV2> => {
  try {
    console.log("Event:", JSON.stringify(event, null, 2));
    console.log("Context:", JSON.stringify(context, null, 2));

    const path = event.rawPath || event.requestContext?.http?.path || "/";
    const method = event.requestContext?.http?.method || "GET";

    // Simple routing
    if (path === "/health" && method === "GET") {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "ok",
          timestamp: new Date().toISOString(),
          service: "todo-api",
          message: "Simplified handler working!",
        }),
      };
    }

    // Default response
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Lambda Function URL is working!",
        path,
        method,
        event: event.requestContext,
      }),
    };
  } catch (error) {
    console.error("Handler error:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }),
    };
  }
};

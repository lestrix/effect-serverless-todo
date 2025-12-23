import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Context as LambdaContext,
} from "aws-lambda";
import type { Todo } from "@todo/shared";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  DeleteCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

// DynamoDB setup
const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME || "TodoTable";

// Helper: Generate UUID
const generateId = () => Math.random().toString(36).substring(2, 15);

// Helper: JSON response
const jsonResponse = (data: any, statusCode: number = 200) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});

/**
 * Complete CRUD Lambda handler with extensive logging
 */
export const handler = async (
  event: APIGatewayProxyEventV2,
  context: LambdaContext
): Promise<APIGatewayProxyResultV2> => {
  console.log("=== LAMBDA INVOCATION START ===");
  console.log("Request ID:", context.awsRequestId);
  console.log("Path:", event.rawPath);
  console.log("Method:", event.requestContext?.http?.method);
  console.log("Headers:", JSON.stringify(event.headers));
  console.log("Body:", event.body);

  try {
    const path = event.rawPath || "/";
    const method = event.requestContext?.http?.method || "GET";

    // Health check
    if (path === "/health" && method === "GET") {
      console.log("Health check requested");

      // Get count from DynamoDB
      const scanResult = await dynamodb.send(new ScanCommand({
        TableName: TABLE_NAME,
        Select: "COUNT",
      }));

      return jsonResponse({
        status: "ok",
        timestamp: new Date().toISOString(),
        service: "todo-api",
        todoCount: scanResult.Count || 0,
      });
    }

    // GET /todos - List all todos
    if (path === "/todos" && method === "GET") {
      console.log("GET /todos - Scanning DynamoDB");

      const result = await dynamodb.send(new ScanCommand({
        TableName: TABLE_NAME,
      }));

      const todoList = result.Items || [];
      console.log("GET /todos - Returning", todoList.length, "todos");
      return jsonResponse(todoList);
    }

    // POST /todos - Create new todo
    if (path === "/todos" && method === "POST") {
      console.log("POST /todos - Creating new todo");
      const body = event.body ? JSON.parse(event.body) : {};
      console.log("Request body:", body);

      if (!body.title || typeof body.title !== "string" || body.title.trim().length === 0) {
        console.error("Invalid title:", body.title);
        return jsonResponse({ error: "Title is required and must be a non-empty string" }, 400);
      }

      const id = generateId();
      const todo = {
        id,
        title: body.title.trim(),
        completed: body.completed === true,
        createdAt: new Date().toISOString(),
      };

      await dynamodb.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: todo,
      }));

      console.log("Created todo in DynamoDB:", todo);
      return jsonResponse(todo, 201);
    }

    // GET /todos/:id - Get single todo
    const getTodoMatch = path.match(/^\/todos\/([^/]+)$/);
    if (getTodoMatch && method === "GET") {
      const id = getTodoMatch[1];
      console.log("GET /todos/" + id);

      const result = await dynamodb.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { id },
      }));

      if (!result.Item) {
        console.error("Todo not found in DynamoDB:", id);
        return jsonResponse({ error: `Todo with id ${id} not found` }, 404);
      }

      console.log("Found todo:", result.Item);
      return jsonResponse(result.Item);
    }

    // PATCH /todos/:id - Update todo
    if (getTodoMatch && method === "PATCH") {
      const id = getTodoMatch[1];
      console.log("PATCH /todos/" + id);

      const body = event.body ? JSON.parse(event.body) : {};
      console.log("Update body:", body);

      // Validate input
      if (body.title !== undefined) {
        if (typeof body.title !== "string" || body.title.trim().length === 0) {
          console.error("Invalid title:", body.title);
          return jsonResponse({ error: "Title must be a non-empty string" }, 400);
        }
      }

      if (body.completed !== undefined) {
        if (typeof body.completed !== "boolean") {
          console.error("Invalid completed:", body.completed);
          return jsonResponse({ error: "Completed must be a boolean" }, 400);
        }
      }

      // Build update expression
      const updateExpressions: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};

      if (body.title !== undefined) {
        updateExpressions.push("#title = :title");
        expressionAttributeNames["#title"] = "title";
        expressionAttributeValues[":title"] = body.title.trim();
      }

      if (body.completed !== undefined) {
        updateExpressions.push("#completed = :completed");
        expressionAttributeNames["#completed"] = "completed";
        expressionAttributeValues[":completed"] = body.completed;
      }

      if (updateExpressions.length === 0) {
        console.error("No valid fields to update");
        return jsonResponse({ error: "No valid fields to update" }, 400);
      }

      const result = await dynamodb.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id },
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW",
      }));

      if (!result.Attributes) {
        console.error("Todo not found in DynamoDB:", id);
        return jsonResponse({ error: `Todo with id ${id} not found` }, 404);
      }

      console.log("Updated todo in DynamoDB:", result.Attributes);
      return jsonResponse(result.Attributes);
    }

    // DELETE /todos/:id - Delete todo
    if (getTodoMatch && method === "DELETE") {
      const id = getTodoMatch[1];
      console.log("DELETE /todos/" + id);

      // Check if todo exists before deleting
      const getResult = await dynamodb.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { id },
      }));

      if (!getResult.Item) {
        console.error("Todo not found in DynamoDB:", id);
        return jsonResponse({ error: `Todo with id ${id} not found` }, 404);
      }

      await dynamodb.send(new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { id },
      }));

      console.log("Deleted todo from DynamoDB:", id);
      return jsonResponse(null, 204);
    }

    // OPTIONS - CORS preflight (handled by Lambda Function URL, but add fallback)
    if (method === "OPTIONS") {
      console.log("OPTIONS request for:", path);
      return { statusCode: 204, headers: {}, body: "" };
    }

    // 404 - Route not found
    console.error("Route not found:", method, path);
    return jsonResponse({
      error: "Not Found",
      message: `Route ${method} ${path} not found`,
      availableRoutes: [
        "GET /health",
        "GET /todos",
        "POST /todos",
        "GET /todos/:id",
        "PATCH /todos/:id",
        "DELETE /todos/:id",
      ],
    }, 404);

  } catch (error) {
    console.error("=== HANDLER ERROR ===");
    console.error("Error:", error);
    console.error("Stack:", error instanceof Error ? error.stack : "No stack trace");

    return jsonResponse({
      error: "Internal Server Error",
      message: error instanceof Error ? error.message : String(error),
      requestId: context.awsRequestId,
    }, 500);
  } finally {
    console.log("=== LAMBDA INVOCATION END ===");
  }
};

import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Context as LambdaContext,
} from "aws-lambda";
import type { Todo } from "@todo/shared";

// In-memory storage (will reset on Lambda cold start)
// Using a mutable structure since Map values need to be updated
const todos: Map<string, {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}> = new Map();

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
      return jsonResponse({
        status: "ok",
        timestamp: new Date().toISOString(),
        service: "todo-api",
        todoCount: todos.size,
      });
    }

    // GET /todos - List all todos
    if (path === "/todos" && method === "GET") {
      console.log("GET /todos - Returning", todos.size, "todos");
      const todoList = Array.from(todos.values());
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

      todos.set(id, todo);
      console.log("Created todo:", todo);
      return jsonResponse(todo, 201);
    }

    // GET /todos/:id - Get single todo
    const getTodoMatch = path.match(/^\/todos\/([^/]+)$/);
    if (getTodoMatch && method === "GET") {
      const id = getTodoMatch[1];
      console.log("GET /todos/" + id);

      const todo = todos.get(id);
      if (!todo) {
        console.error("Todo not found:", id);
        return jsonResponse({ error: `Todo with id ${id} not found` }, 404);
      }

      console.log("Found todo:", todo);
      return jsonResponse(todo);
    }

    // PATCH /todos/:id - Update todo
    if (getTodoMatch && method === "PATCH") {
      const id = getTodoMatch[1];
      console.log("PATCH /todos/" + id);

      const todo = todos.get(id);
      if (!todo) {
        console.error("Todo not found:", id);
        return jsonResponse({ error: `Todo with id ${id} not found` }, 404);
      }

      const body = event.body ? JSON.parse(event.body) : {};
      console.log("Update body:", body);

      if (body.title !== undefined) {
        if (typeof body.title !== "string" || body.title.trim().length === 0) {
          console.error("Invalid title:", body.title);
          return jsonResponse({ error: "Title must be a non-empty string" }, 400);
        }
        todo.title = body.title.trim();
      }

      if (body.completed !== undefined) {
        if (typeof body.completed !== "boolean") {
          console.error("Invalid completed:", body.completed);
          return jsonResponse({ error: "Completed must be a boolean" }, 400);
        }
        todo.completed = body.completed;
      }

      todos.set(id, todo);
      console.log("Updated todo:", todo);
      return jsonResponse(todo);
    }

    // DELETE /todos/:id - Delete todo
    if (getTodoMatch && method === "DELETE") {
      const id = getTodoMatch[1];
      console.log("DELETE /todos/" + id);

      const todo = todos.get(id);
      if (!todo) {
        console.error("Todo not found:", id);
        return jsonResponse({ error: `Todo with id ${id} not found` }, 404);
      }

      todos.delete(id);
      console.log("Deleted todo:", id);
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

import type { Todo, CreateTodoInput, UpdateTodoInput } from "@todo/shared";

/**
 * Type-safe API client
 * Uses shared types from @todo/shared to prevent drift
 */
const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new ApiError(response.status, error.error || "Request failed");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  health: () => fetchJson<{ status: string; timestamp: string }>(`${API_BASE}/health`),

  getTodos: () => fetchJson<Todo[]>(`${API_BASE}/todos`),

  getTodo: (id: string) => fetchJson<Todo>(`${API_BASE}/todos/${id}`),

  createTodo: (input: CreateTodoInput) =>
    fetchJson<Todo>(`${API_BASE}/todos`, {
      method: "POST",
      body: JSON.stringify(input),
    }),

  updateTodo: (id: string, updates: UpdateTodoInput) =>
    fetchJson<Todo>(`${API_BASE}/todos/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    }),

  deleteTodo: (id: string) =>
    fetchJson<void>(`${API_BASE}/todos/${id}`, {
      method: "DELETE",
    }),
};

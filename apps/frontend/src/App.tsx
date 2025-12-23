import React, { useEffect, useState } from "react";
import { api } from "./api/client";
import type { Todo } from "@todo/shared";

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<string>("");

  useEffect(() => {
    checkHealth();
    loadTodos();
  }, []);

  const checkHealth = async () => {
    try {
      const health = await api.health();
      setHealthStatus(`✓ Backend online (${new Date(health.timestamp).toLocaleTimeString()})`);
    } catch (err) {
      setHealthStatus("✗ Backend offline");
    }
  };

  const loadTodos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTodos();
      setTodos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load todos");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    try {
      const todo = await api.createTodo({ title: newTodo.trim() });
      setTodos([...todos, todo]);
      setNewTodo("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create todo");
    }
  };

  const handleToggle = async (todo: Todo) => {
    try {
      const updated = await api.updateTodo(todo.id, { completed: !todo.completed });
      setTodos(todos.map((t) => (t.id === todo.id ? updated : t)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update todo");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteTodo(id);
      setTodos(todos.filter((t) => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete todo");
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <h1>Effect Serverless Todo</h1>

      <p style={{ fontSize: "0.875rem", color: healthStatus.startsWith("✓") ? "green" : "red" }}>
        {healthStatus}
      </p>

      {error && (
        <div
          style={{
            padding: "1rem",
            background: "#fee",
            border: "1px solid #c00",
            marginTop: "1rem",
          }}
        >
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: "1rem" }}>
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={handleCreate} style={{ marginTop: "2rem", display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="New todo..."
          style={{ flex: 1 }}
        />
        <button type="submit" style={{ background: "#0066cc", color: "#fff" }}>
          Add
        </button>
      </form>

      {loading ? (
        <p style={{ marginTop: "2rem" }}>Loading...</p>
      ) : todos.length === 0 ? (
        <p style={{ marginTop: "2rem", color: "#666" }}>No todos yet. Create one!</p>
      ) : (
        <ul style={{ listStyle: "none", marginTop: "2rem" }}>
          {todos.map((todo) => (
            <li
              key={todo.id}
              style={{
                padding: "1rem",
                background: "#fff",
                border: "1px solid #ddd",
                marginBottom: "0.5rem",
                borderRadius: "4px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ flex: 1 }}>
                <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => handleToggle(todo)}
                    style={{ marginRight: "0.75rem" }}
                  />
                  <span
                    style={{
                      textDecoration: todo.completed ? "line-through" : "none",
                      color: todo.completed ? "#999" : "inherit",
                    }}
                  >
                    {todo.title}
                  </span>
                </label>
                <small style={{ display: "block", marginTop: "0.25rem", color: "#666" }}>
                  {new Date(todo.createdAt).toLocaleString()}
                </small>
              </div>
              <button
                onClick={() => handleDelete(todo.id)}
                style={{ background: "#c00", color: "#fff" }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

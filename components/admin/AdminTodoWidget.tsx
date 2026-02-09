'use client';

import { useState, useEffect, useCallback } from 'react';
import type { TodoItem } from './admin-types';

export default function AdminTodoWidget() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [newText, setNewText] = useState('');
  const [newDate, setNewDate] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTodos = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/todos');
      const data = await res.json();
      if (res.ok) setTodos(data.todos);
    } catch (err) {
      console.error('Failed to fetch todos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTodos(); }, [fetchTodos]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newText.trim()) return;
    try {
      const res = await fetch('/api/admin/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newText.trim(), dueDate: newDate || null }),
      });
      const data = await res.json();
      if (res.ok) {
        setTodos((prev) => [...prev.filter((t) => !t.done), data.todo, ...prev.filter((t) => t.done)]);
        setNewText('');
        setNewDate('');
      }
    } catch (err) {
      console.error('Failed to add todo:', err);
    }
  }

  async function handleToggle(id: string, done: boolean) {
    setTodos((prev) => prev.map((t) => t.id === id ? { ...t, done } : t));
    try {
      await fetch(`/api/admin/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done }),
      });
      await fetchTodos();
    } catch (err) {
      console.error('Failed to toggle todo:', err);
      setTodos((prev) => prev.map((t) => t.id === id ? { ...t, done: !done } : t));
    }
  }

  async function handleDelete(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    try {
      await fetch(`/api/admin/todos/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete todo:', err);
      await fetchTodos();
    }
  }

  async function handleClearCompleted() {
    const done = todos.filter((t) => t.done);
    setTodos((prev) => prev.filter((t) => !t.done));
    try {
      await Promise.all(done.map((t) => fetch(`/api/admin/todos/${t.id}`, { method: 'DELETE' })));
    } catch (err) {
      console.error('Failed to clear completed:', err);
      await fetchTodos();
    }
  }

  const undoneCount = todos.filter((t) => !t.done).length;
  const doneCount = todos.filter((t) => t.done).length;

  function isOverdue(dueDate: string | null): boolean {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date(new Date().toDateString());
  }

  function formatDueDate(dueDate: string): string {
    const d = new Date(dueDate);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  if (loading) return null;

  return (
    <div className="admin-todo-widget">
      <button
        className="admin-todo-header"
        onClick={() => setCollapsed(!collapsed)}
        aria-expanded={!collapsed}
      >
        <span className="admin-todo-header-left">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.6 }}>
            <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M4.5 8l2.5 2.5L11.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Tasks</span>
          {undoneCount > 0 && (
            <span className="admin-todo-badge">{undoneCount}</span>
          )}
        </span>
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
        >
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {!collapsed && (
        <div className="admin-todo-body">
          {todos.length === 0 && (
            <p className="admin-todo-empty">No tasks yet. Add one below.</p>
          )}

          <div className="admin-todo-list">
            {todos.map((t) => (
              <div key={t.id} className={`admin-todo-item ${t.done ? 'admin-todo-item-done' : ''}`}>
                <label className="admin-todo-check">
                  <input
                    type="checkbox"
                    checked={t.done}
                    onChange={() => handleToggle(t.id, !t.done)}
                  />
                  <span className="admin-todo-checkmark" />
                </label>
                <span className="admin-todo-text">{t.text}</span>
                {t.dueDate && (
                  <span className={`admin-todo-due ${isOverdue(t.dueDate) && !t.done ? 'admin-todo-due-overdue' : ''}`}>
                    {formatDueDate(t.dueDate)}
                  </span>
                )}
                <button
                  className="admin-todo-delete"
                  onClick={() => handleDelete(t.id)}
                  aria-label="Delete task"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>

          <form className="admin-todo-add" onSubmit={handleAdd}>
            <input
              type="text"
              className="admin-todo-input"
              placeholder="Add a task…"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
            />
            <input
              type="date"
              className="admin-todo-date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
            <button type="submit" className="admin-todo-add-btn" disabled={!newText.trim()}>
              Add
            </button>
          </form>

          {doneCount > 0 && (
            <button className="admin-todo-clear" onClick={handleClearCompleted}>
              Clear {doneCount} completed
            </button>
          )}
        </div>
      )}
    </div>
  );
}

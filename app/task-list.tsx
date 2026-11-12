"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { loadTasks, saveTasks } from "./task-storage";
import type { Task } from "./task-storage";

export function TaskList() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [draft, setDraft] = useState("");
  const [storageError, setStorageError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      setTasks(loadTasks());
    } catch {
      setStorageError("Не удалось загрузить задачи. Обновите страницу и попробуйте снова.");
    }
  }, []);

  function updateTasks(nextTasks: Task[]) {
    try {
      saveTasks(nextTasks);
      setTasks(nextTasks);
      setStorageError("");
      return true;
    } catch {
      setStorageError("Не удалось сохранить изменения. Проверьте настройки браузера и попробуйте снова.");
      return false;
    }
  }

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = draft.trim();
    if (!title || tasks === null) return;

    const task: Task = { id: crypto.randomUUID(), title, completed: false };
    if (updateTasks([task, ...tasks])) {
      setDraft("");
      inputRef.current?.focus();
    }
  }

  function setTaskCompleted(taskId: string, completed: boolean) {
    if (tasks === null) return;

    updateTasks(tasks.map((task) => task.id === taskId ? { ...task, completed } : task));
  }

  function deleteTask(taskId: string, fromKeyboard: boolean) {
    if (tasks === null) return;

    const deleted = updateTasks(tasks.filter((task) => task.id !== taskId));
    if (deleted && fromKeyboard) inputRef.current?.focus();
  }

  const completedCount = tasks?.filter((task) => task.completed).length ?? 0;

  return (
    <>
      <header className="list-header">
        <h1>Список задач</h1>
        <p className="completion-count" aria-live="polite" aria-atomic="true">
          Выполнено <span>{tasks ? `${completedCount} из ${tasks.length}` : "—"}</span>
        </p>
        <progress
          className="completion-rule"
          aria-label="Выполнение задач"
          max={Math.max(tasks?.length ?? 0, 1)}
          value={completedCount}
        />
      </header>

      <section aria-label="Задачи">
        <form className="task-form" onSubmit={addTask}>
          <label className="entry-mark" htmlFor="task-title">
            <span aria-hidden="true">+</span>
            <span className="visually-hidden">Новая задача</span>
          </label>
          <input
            ref={inputRef}
            id="task-title"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Что сделать?"
            autoComplete="off"
            maxLength={240}
            disabled={tasks === null}
          />
          <button className="add-button" type="submit" disabled={tasks === null || !draft.trim()}>
            Добавить
          </button>
        </form>

        <p className="storage-error" role="alert">{storageError}</p>

        {tasks === null && !storageError && (
          <p className="loading-state" role="status">Загрузка задач…</p>
        )}

        {tasks?.length === 0 && (
          <div className="empty-state">
            <h2>Список пока пуст</h2>
            <p>Добавьте первую задачу, чтобы начать.</p>
          </div>
        )}

        {tasks && tasks.length > 0 && (
          <ul className="task-list" role="list">
            {tasks.map((task) => (
              <li key={task.id} className="task-row">
                <label className="task-label">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={(event) => setTaskCompleted(task.id, event.target.checked)}
                  />
                  <span className="task-title">{task.title}</span>
                </label>
                <button
                  type="button"
                  className="delete-button"
                  aria-label={`Удалить задачу: ${task.title}`}
                  onClick={(event) => deleteTask(task.id, event.detail === 0)}
                >
                  <span className="delete-mark" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

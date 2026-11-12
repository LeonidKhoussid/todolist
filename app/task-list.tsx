"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { ListChecks, Plus } from "lucide-react";
import { Button } from "../components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "../components/ui/empty";
import { ToggleGroup, ToggleGroupItem } from "../components/ui/toggle-group";
import { TaskRow } from "./task-row";
import { loadTasks, saveTasks } from "./task-storage";
import type { Task } from "./task-storage";

const taskFilters = [
  { value: "all", label: "Все" },
  { value: "active", label: "В работе" },
  { value: "completed", label: "Готово" },
] as const;

type TaskFilter = (typeof taskFilters)[number]["value"];

const emptyStates = {
  all: {
    title: "Список пока пуст",
    description: "Добавьте первую задачу в поле выше.",
  },
  active: {
    title: "Нет задач в работе",
    description: "Добавьте новую задачу или верните выполненную в работу.",
  },
  completed: {
    title: "Пока нет выполненных задач",
    description: "Отметьте задачу выполненной, чтобы увидеть её здесь.",
  },
};

export function TaskList() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [storageError, setStorageError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const taskToAnimate = useRef<string | null>(null);

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
      taskToAnimate.current = task.id;
      setDraft("");
      if (filter === "completed") setFilter("active");
      inputRef.current?.focus();
    }
  }

  function animateNewTask(row: HTMLLIElement | null, taskId: string) {
    if (!row || taskToAnimate.current !== taskId) return;

    taskToAnimate.current = null;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    row.animate(
      [
        { opacity: 0, transform: "translateY(-8px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 260, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
    );
  }

  function updateTask(taskId: string, changes: Partial<Pick<Task, "completed" | "schedule">>) {
    if (tasks === null) return false;
    return updateTasks(tasks.map((task) => task.id === taskId ? { ...task, ...changes } : task));
  }

  function setTaskCompleted(taskId: string, completed: boolean) {
    const saved = updateTask(taskId, { completed });
    if (saved && filter !== "all" && document.activeElement?.matches(":focus-visible")) {
      inputRef.current?.focus();
    }
  }

  function deleteTask(taskId: string, fromKeyboard: boolean) {
    if (tasks === null) return;

    const deleted = updateTasks(tasks.filter((task) => task.id !== taskId));
    if (deleted && fromKeyboard) inputRef.current?.focus();
  }

  function changeFilter(value: string) {
    const selectedFilter = taskFilters.find((option) => option.value === value);
    if (selectedFilter) setFilter(selectedFilter.value);
  }

  const completedCount = tasks?.filter((task) => task.completed).length ?? 0;
  const counts = {
    all: tasks?.length ?? 0,
    active: (tasks?.length ?? 0) - completedCount,
    completed: completedCount,
  };
  const completionRatio = counts.all > 0 ? completedCount / counts.all : 0;
  const visibleTasks = tasks?.filter((task) => {
    if (filter === "all") return true;
    return task.completed === (filter === "completed");
  });
  const emptyState = emptyStates[filter];

  return (
    <>
      <header className="list-header">
        <h1>Список задач</h1>
        <p className="completion-count" aria-live="polite" aria-atomic="true">
          Выполнено <span>{tasks ? `${completedCount} из ${counts.all}` : "—"}</span>
        </p>
        <div className="completion-rule">
          <progress
            aria-label="Выполнение задач"
            max={Math.max(counts.all, 1)}
            value={completedCount}
          />
          <span
            aria-hidden="true"
            className="completion-fill"
            style={{ transform: `scaleX(${completionRatio})` }}
          />
        </div>
      </header>

      <section className="task-panel" aria-label="Задачи">
        <form className="task-form" onSubmit={addTask}>
          <div className="task-entry">
            <label className="entry-mark" htmlFor="task-title">
              <Plus aria-hidden="true" size={18} />
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
          </div>
          <Button className="add-button" type="submit" disabled={tasks === null || !draft.trim()}>
            Добавить
          </Button>
        </form>

        <p className="storage-error" role="alert">{storageError}</p>

        <div className="filter-toolbar">
          <ToggleGroup
            type="single"
            role="radiogroup"
            value={filter}
            onValueChange={changeFilter}
            aria-label="Фильтр задач"
            spacing={1}
          >
            {taskFilters.map(({ value, label }) => (
              <ToggleGroupItem className="filter-item" key={value} value={value}>
                {label}
                {tasks && <span className="filter-count">{counts[value]}</span>}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {tasks === null && !storageError && (
          <p className="loading-state" role="status">Загрузка задач…</p>
        )}

        {visibleTasks?.length === 0 && (
          <Empty className="task-empty">
            <EmptyHeader>
              <EmptyMedia className="task-empty-icon" variant="icon">
                <ListChecks aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle><h2>{emptyState.title}</h2></EmptyTitle>
              <EmptyDescription>{emptyState.description}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {visibleTasks && visibleTasks.length > 0 && (
          <ul className="task-list" role="list">
            {visibleTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                rowRef={(row) => animateNewTask(row, task.id)}
                onCompletedChange={(completed) => setTaskCompleted(task.id, completed)}
                onScheduleChange={(schedule) => updateTask(task.id, { schedule })}
                onDelete={(fromKeyboard) => deleteTask(task.id, fromKeyboard)}
              />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

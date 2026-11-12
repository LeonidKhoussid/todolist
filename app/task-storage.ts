import { isTaskSchedule } from "./task-schedule";
import type { TaskSchedule } from "./task-schedule";

export type Task = {
  id: string;
  title: string;
  completed: boolean;
  schedule?: TaskSchedule;
};

const storageKey = "spisok-zadach:tasks";

function isTask(value: unknown): value is Task {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "title" in value &&
    typeof value.title === "string" &&
    "completed" in value &&
    typeof value.completed === "boolean" &&
    (!("schedule" in value) || isTaskSchedule(value.schedule))
  );
}

export function loadTasks(): Task[] {
  const savedTasks = localStorage.getItem(storageKey);
  if (savedTasks === null) return [];

  const tasks: unknown = JSON.parse(savedTasks);
  if (!Array.isArray(tasks) || !tasks.every(isTask)) {
    throw new Error("Invalid saved task list");
  }

  return tasks;
}

export function saveTasks(tasks: Task[]) {
  localStorage.setItem(storageKey, JSON.stringify(tasks));
}

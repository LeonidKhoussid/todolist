export type TaskTimer = {
  durationSeconds: number;
  remainingMs: number;
  endsAt: number | null;
};

export type TaskSchedule = {
  date?: string;
  time?: string;
  timer?: TaskTimer;
};

export const maxTimerSeconds = 24 * 60 * 60;

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "long",
  timeZone: "UTC",
});

function isDate(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000")) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function isTimer(value: unknown): value is TaskTimer {
  if (typeof value !== "object" || value === null) return false;

  const { durationSeconds, remainingMs, endsAt } = value as Partial<TaskTimer>;
  return (
    typeof durationSeconds === "number" &&
    Number.isInteger(durationSeconds) &&
    durationSeconds > 0 &&
    durationSeconds <= maxTimerSeconds &&
    typeof remainingMs === "number" &&
    Number.isInteger(remainingMs) &&
    remainingMs >= 0 &&
    remainingMs <= durationSeconds * 1000 &&
    (endsAt === null || (typeof endsAt === "number" && Number.isSafeInteger(endsAt) && endsAt > 0))
  );
}

export function isTaskSchedule(value: unknown): value is TaskSchedule {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;

  const { date, time, timer } = value as TaskSchedule;
  return (
    (date === undefined || isDate(date)) &&
    (time === undefined || (typeof time === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time))) &&
    (timer === undefined || isTimer(timer))
  );
}

export function createTimer(durationSeconds: number): TaskTimer {
  return { durationSeconds, remainingMs: durationSeconds * 1000, endsAt: null };
}

export function getRemainingTime(timer: TaskTimer, now: number) {
  if (timer.endsAt === null) return timer.remainingMs;
  return Math.max(0, Math.min(timer.durationSeconds * 1000, timer.endsAt - now));
}

export function formatCountdown(remainingMs: number) {
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = String(Math.floor(totalSeconds / 60) % 60).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return hours > 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
}

export function formatTaskDate(value: string) {
  return dateFormatter.format(new Date(`${value}T00:00:00Z`));
}

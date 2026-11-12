import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../components/ui/button";
import { createTimer, isTaskSchedule, maxTimerSeconds } from "./task-schedule";
import type { TaskSchedule } from "./task-schedule";

type TaskScheduleEditorProps = {
  id: string;
  schedule: TaskSchedule | undefined;
  onSave: (schedule: TaskSchedule | undefined) => void;
  onCancel: () => void;
};

export function TaskScheduleEditor({ id, schedule, onSave, onCancel }: TaskScheduleEditorProps) {
  const [error, setError] = useState("");
  const duration = schedule?.timer?.durationSeconds ?? 0;

  function saveSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const date = String(fields.get("date") || "");
    const time = String(fields.get("time") || "");
    const durationSeconds = Number(fields.get("minutes")) * 60 + Number(fields.get("seconds"));

    if (!Number.isInteger(durationSeconds) || durationSeconds < 0 || durationSeconds > maxTimerSeconds) {
      setError("Укажите длительность таймера до 24 часов.");
      return;
    }

    const timer = durationSeconds === schedule?.timer?.durationSeconds
      ? schedule.timer
      : durationSeconds > 0 ? createTimer(durationSeconds) : undefined;
    const nextSchedule = { date: date || undefined, time: time || undefined, timer };

    if (!isTaskSchedule(nextSchedule)) {
      setError("Проверьте дату, время и длительность таймера.");
      return;
    }

    setError("");
    onSave(date || time || timer ? nextSchedule : undefined);
  }

  return (
    <form id={id} className="schedule-editor" aria-label="Дата, время и таймер" onSubmit={saveSchedule}>
      <div className="schedule-fields">
        <label>
          Дата
          <input type="date" name="date" defaultValue={schedule?.date} min="0001-01-01" max="9999-12-31" />
        </label>
        <label>
          Время
          <input type="time" name="time" defaultValue={schedule?.time} />
        </label>
        <fieldset>
          <legend>Таймер</legend>
          <div className="schedule-duration">
            <label className="duration-field">
              <input
                type="number"
                name="minutes"
                aria-label="Минуты"
                placeholder="0"
                min={0}
                max={maxTimerSeconds / 60}
                defaultValue={Math.floor(duration / 60) || ""}
              />
              <span aria-hidden="true">мин</span>
            </label>
            <label className="duration-field">
              <input
                type="number"
                name="seconds"
                aria-label="Секунды"
                placeholder="0"
                min={0}
                max={59}
                defaultValue={duration % 60 || ""}
              />
              <span aria-hidden="true">сек</span>
            </label>
          </div>
        </fieldset>
      </div>
      {error && <p className="schedule-error" role="alert">{error}</p>}
      <div className="schedule-actions">
        <p>Очистите поле, чтобы убрать параметр.</p>
        <div>
          <Button type="button" variant="ghost" onClick={onCancel}>Отмена</Button>
          <Button type="submit">Сохранить</Button>
        </div>
      </div>
    </form>
  );
}

import { useEffect, useId, useRef, useState } from "react";
import { CalendarClock, CalendarDays, Clock3, Pause, Play, RotateCcw, Timer, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { TaskScheduleEditor } from "./task-schedule-editor";
import type { ScheduleSection } from "./task-schedule-editor";
import { createTimer, formatCountdown, formatTaskDate, getRemainingTime } from "./task-schedule";
import type { TaskSchedule, TaskTimer } from "./task-schedule";
import type { Task } from "./task-storage";

type TaskRowProps = {
  task: Task;
  onCompletedChange: (completed: boolean) => void;
  onScheduleChange: (schedule: TaskSchedule | undefined) => boolean;
  onDelete: (fromKeyboard: boolean) => void;
  rowRef: (row: HTMLLIElement | null) => void;
};

export function TaskRow({ task, onCompletedChange, onScheduleChange, onDelete, rowRef }: TaskRowProps) {
  const [editorSection, setEditorSection] = useState<ScheduleSection | null>(null);
  const editorId = useId();
  const scheduleButtonRef = useRef<HTMLButtonElement>(null);
  const checkboxId = `task-${task.id}`;
  const schedule = task.schedule;
  const displayDate = schedule?.date ? formatTaskDate(schedule.date) : "";
  const editorOpen = editorSection !== null;
  const defaultSection = schedule?.date ? "date" : schedule?.time ? "time" : schedule?.timer ? "timer" : "date";

  function closeEditor() {
    setEditorSection(null);
    scheduleButtonRef.current?.focus();
  }

  function saveSchedule(nextSchedule: TaskSchedule | undefined) {
    if (onScheduleChange(nextSchedule)) closeEditor();
  }

  return (
    <li className="task-row" ref={rowRef}>
      <div className="task-row-main">
        <Checkbox
          className="task-checkbox"
          id={checkboxId}
          checked={task.completed}
          onCheckedChange={(checked) => onCompletedChange(checked === true)}
        />
        <label className="task-title" htmlFor={checkboxId}>{task.title}</label>
        <Button
          ref={scheduleButtonRef}
          type="button"
          variant="ghost"
          size="icon"
          className="schedule-button"
          title="Дата, время и таймер"
          aria-label={`Дата, время и таймер: ${task.title}`}
          aria-expanded={editorOpen}
          aria-controls={editorOpen ? editorId : undefined}
          onClick={() => setEditorSection(editorOpen ? null : defaultSection)}
        >
          <CalendarClock aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="delete-button"
          aria-label={`Удалить задачу: ${task.title}`}
          onClick={(event) => onDelete(event.detail === 0)}
        >
          <Trash2 aria-hidden="true" />
        </Button>

        {schedule && (
          <div className="task-schedule">
            {schedule.date && (
              <Button type="button" variant="ghost" className="schedule-label"
                aria-label={`Изменить дату: ${displayDate}`}
                aria-expanded={editorSection === "date"} aria-controls={editorOpen ? editorId : undefined}
                onClick={() => setEditorSection("date")}>
                <CalendarDays aria-hidden="true" size={15} />
                <time dateTime={schedule.date}>{displayDate}</time>
              </Button>
            )}
            {schedule.time && (
              <Button type="button" variant="ghost" className="schedule-label"
                aria-label={`Изменить время: ${schedule.time}`}
                aria-expanded={editorSection === "time"} aria-controls={editorOpen ? editorId : undefined}
                onClick={() => setEditorSection("time")}>
                <Clock3 aria-hidden="true" size={15} />
                <time dateTime={schedule.time}>{schedule.time}</time>
              </Button>
            )}
            {schedule.timer && (
              <TaskCountdown
                timer={schedule.timer}
                onChange={(timer) => onScheduleChange({ ...schedule, timer })}
              />
            )}
          </div>
        )}
      </div>
      {editorSection && (
        <TaskScheduleEditor
          id={editorId}
          schedule={schedule}
          section={editorSection}
          onSectionChange={setEditorSection}
          onSave={saveSchedule}
          onCancel={closeEditor}
        />
      )}
    </li>
  );
}

function TaskCountdown({ timer, onChange }: { timer: TaskTimer; onChange: (timer: TaskTimer) => boolean }) {
  const [now, setNow] = useState(Date.now);
  const remaining = getRemainingTime(timer, now);
  const running = timer.endsAt !== null && remaining > 0;
  const expired = remaining === 0;
  const initial = timer.endsAt === null && timer.remainingMs === timer.durationSeconds * 1000;

  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, [running]);

  function toggleTimer() {
    const timestamp = Date.now();
    const timeLeft = getRemainingTime(timer, timestamp);
    const nextTimer = running
      ? { ...timer, remainingMs: timeLeft, endsAt: null }
      : { ...timer, endsAt: timestamp + (timeLeft || timer.durationSeconds * 1000) };
    if (onChange(nextTimer)) setNow(timestamp);
  }

  const timerAction = running ? "Приостановить таймер"
    : expired ? "Перезапустить таймер"
    : initial ? "Запустить таймер"
    : "Продолжить таймер";

  return (
    <div className="task-countdown">
      <span className="countdown-value" data-expired={expired}>
        <Timer aria-hidden="true" size={15} />
        <span role="timer" aria-label="Оставшееся время">{formatCountdown(remaining)}</span>
      </span>
      <Button type="button" variant="ghost" size="icon" className="timer-button" aria-label={timerAction} title={timerAction} onClick={toggleTimer}>
        {running ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="timer-button"
        aria-label="Сбросить таймер"
        title="Сбросить таймер"
        disabled={initial}
        onClick={() => onChange(createTimer(timer.durationSeconds))}
      >
        <RotateCcw aria-hidden="true" />
      </Button>
      <span className="countdown-status" role="status">{expired ? "Время вышло" : ""}</span>
    </div>
  );
}

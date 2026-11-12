import { useState } from "react";
import type { FormEvent } from "react";
import { CalendarDays, Clock3, Timer, X } from "lucide-react";
import { Tabs } from "radix-ui";
import { Button } from "../components/ui/button";
import { createTimer, isTaskSchedule, maxTimerSeconds } from "./task-schedule";
import type { TaskSchedule } from "./task-schedule";

const sections = [
  { value: "date", label: "Дата", icon: CalendarDays },
  { value: "time", label: "Время", icon: Clock3 },
  { value: "timer", label: "Таймер", icon: Timer },
] as const;

export type ScheduleSection = (typeof sections)[number]["value"];

const timeOptions = ["09:00", "12:00", "18:00"].map((time) => ({ value: time, label: time }));
const timerOptions = [5, 15, 25].map((minutes) => ({ value: String(minutes), label: `${minutes} мин` }));

type TaskScheduleEditorProps = {
  id: string;
  schedule: TaskSchedule | undefined;
  section: ScheduleSection;
  onSectionChange: (section: ScheduleSection) => void;
  onSave: (schedule: TaskSchedule | undefined) => void;
  onCancel: () => void;
};

function localDate(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function TaskScheduleEditor({
  id, schedule, section, onSectionChange, onSave, onCancel,
}: TaskScheduleEditorProps) {
  const [error, setError] = useState("");
  const [draft, setDraft] = useState(() => {
    const duration = schedule?.timer?.durationSeconds ?? 0;
    return {
      date: schedule?.date ?? "",
      time: schedule?.time ?? "",
      minutes: String(Math.floor(duration / 60) || ""),
      seconds: String(duration % 60 || ""),
    };
  });

  const dateOptions = [
    { value: localDate(0), label: "Сегодня" },
    { value: localDate(1), label: "Завтра" },
  ];
  const durationSeconds = Number(draft.minutes) * 60 + Number(draft.seconds);
  const configured = { date: Boolean(draft.date), time: Boolean(draft.time), timer: durationSeconds > 0 };

  function updateDraft(changes: Partial<typeof draft>) {
    setDraft((current) => ({ ...current, ...changes }));
    setError("");
  }

  function saveSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const minutes = Number(draft.minutes);
    const seconds = Number(draft.seconds);

    if (!Number.isInteger(minutes) || minutes < 0 || !Number.isInteger(seconds) ||
        seconds < 0 || seconds > 59 || durationSeconds > maxTimerSeconds) {
      onSectionChange("timer");
      setError("Длительность — до 24 часов, секунды — от 0 до 59.");
      return;
    }

    const currentTimer = schedule?.timer;
    let timer = currentTimer;
    if (durationSeconds !== currentTimer?.durationSeconds) {
      timer = durationSeconds > 0 ? createTimer(durationSeconds) : undefined;
    }

    const nextSchedule = { date: draft.date || undefined, time: draft.time || undefined, timer };
    if (!isTaskSchedule(nextSchedule)) {
      setError("Проверьте дату и время.");
      return;
    }

    setError("");
    onSave(draft.date || draft.time || timer ? nextSchedule : undefined);
  }

  return (
    <form id={id} className="schedule-editor" aria-label="Дата, время и таймер" onSubmit={saveSchedule}>
      <Tabs.Root value={section} onValueChange={(value) => {
        const selectedSection = sections.find((item) => item.value === value);
        if (selectedSection) onSectionChange(selectedSection.value);
      }}>
        <Tabs.List className="schedule-tabs" aria-label="Параметры задачи">
          {sections.map(({ value, label, icon: Icon }) => (
            <Tabs.Trigger key={value} value={value} className="schedule-tab" data-configured={configured[value]}>
              <Icon size={15} aria-hidden="true" />
              {label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="date" className="schedule-section">
          <div className="schedule-field-group">
            <label className="schedule-field">
              Дата
              <input type="date" value={draft.date} min="0001-01-01" max="9999-12-31"
                onChange={(event) => updateDraft({ date: event.target.value })} />
            </label>
            <ClearSetting label="Убрать дату" disabled={!draft.date} onClick={() => updateDraft({ date: "" })} />
          </div>
          <QuickPicks options={dateOptions} selected={draft.date} onSelect={(date) => updateDraft({ date })} />
        </Tabs.Content>

        <Tabs.Content value="time" className="schedule-section">
          <div className="schedule-field-group">
            <label className="schedule-field">
              Время
              <input type="time" value={draft.time} onChange={(event) => updateDraft({ time: event.target.value })} />
            </label>
            <ClearSetting label="Убрать время" disabled={!draft.time} onClick={() => updateDraft({ time: "" })} />
          </div>
          <QuickPicks options={timeOptions} selected={draft.time} onSelect={(time) => updateDraft({ time })} />
        </Tabs.Content>

        <Tabs.Content value="timer" className="schedule-section">
          <div className="schedule-field-group">
            <fieldset className="schedule-field">
              <legend>Длительность</legend>
              <div className="schedule-duration">
                <label className="duration-field">
                  <input type="number" aria-label="Минуты" placeholder="0" min={0} max={maxTimerSeconds / 60}
                    value={draft.minutes} onChange={(event) => updateDraft({ minutes: event.target.value })} />
                  <span aria-hidden="true">мин</span>
                </label>
                <label className="duration-field">
                  <input type="number" aria-label="Секунды" placeholder="0" min={0} max={59}
                    value={draft.seconds} onChange={(event) => updateDraft({ seconds: event.target.value })} />
                  <span aria-hidden="true">сек</span>
                </label>
              </div>
            </fieldset>
            <ClearSetting label="Убрать таймер" disabled={!draft.minutes && !draft.seconds}
              onClick={() => updateDraft({ minutes: "", seconds: "" })} />
          </div>
          <QuickPicks options={timerOptions} selected={Number(draft.seconds) === 0 ? draft.minutes : ""}
            onSelect={(minutes) => updateDraft({ minutes, seconds: "" })} />
        </Tabs.Content>
      </Tabs.Root>
      {error && <p className="schedule-error" role="alert">{error}</p>}
      <div className="schedule-actions">
        <Button type="button" variant="ghost" onClick={onCancel}>Отмена</Button>
        <Button type="submit">Сохранить</Button>
      </div>
    </form>
  );
}

function ClearSetting({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <Button type="button" variant="ghost" size="icon" className="schedule-clear"
      aria-label={label} title={label} disabled={disabled} onClick={onClick}>
      <X aria-hidden="true" />
    </Button>
  );
}

function QuickPicks({ options, selected, onSelect }: {
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="schedule-presets">
      <span>Быстрый выбор</span>
      <div className="schedule-presets-list">
        {options.map(({ value, label }) => (
          <Button key={value} type="button" variant="outline" className="schedule-preset"
            aria-pressed={selected === value} onClick={() => onSelect(value)}>
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}

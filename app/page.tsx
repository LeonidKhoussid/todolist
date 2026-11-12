import { TaskList } from "./task-list";

export default function HomePage() {
  return (
    <main className="workspace">
      <header className="page-header">
        <span className="page-mark" aria-hidden="true" />
        <h1>Список задач</h1>
      </header>
      <TaskList />
      <footer className="page-footer">Задачи сохраняются в этом браузере.</footer>
    </main>
  );
}

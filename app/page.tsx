import { TaskList } from "./task-list";

export default function HomePage() {
  return (
    <main className="workspace">
      <TaskList />
      <footer className="page-footer">Задачи сохраняются в этом браузере.</footer>
    </main>
  );
}

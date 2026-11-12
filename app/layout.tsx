import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/inter";
import "@fontsource-variable/rubik";
import "./globals.css";

export const metadata: Metadata = {
  title: "Список задач",
  description: "Личный список задач с сохранением в браузере.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}

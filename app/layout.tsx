import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import "@fontsource-variable/inter";
import "@fontsource-variable/rubik";
import "./globals.css";

export const metadata: Metadata = {
  title: "Список задач",
  description: "Личный список задач с сохранением в браузере.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" storageKey="spisok-zadach:theme">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

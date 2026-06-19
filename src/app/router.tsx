import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "./AppLayout";
import { CallPage } from "../features/calls/CallPage";
import { ExportPage } from "../features/exports/ExportPage";
import { ImportPage } from "../features/imports/ImportPage";
import { ProgressPage } from "../features/progress/ProgressPage";
import { ReportsPage } from "../features/reports/ReportsPage";
import { RemindersPage } from "../features/reminders/RemindersPage";
import { SettingsPage } from "../features/settings/SettingsPage";
import { StudentsPage } from "../features/students/StudentsPage";

export function normalizeRouterBasename(baseUrl?: string): string {
  const normalizedBase = (baseUrl || "/").trim();

  if (!normalizedBase || normalizedBase === "/") {
    return "/";
  }

  const withLeadingSlash = normalizedBase.startsWith("/") ? normalizedBase : `/${normalizedBase}`;
  return withLeadingSlash.replace(/\/+$/, "") || "/";
}

export const routerBasename = normalizeRouterBasename(import.meta.env.BASE_URL);

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <AppLayout />,
      children: [
        { index: true, element: <Navigate to="/import" replace /> },
        { path: "import", element: <ImportPage /> },
        { path: "students", element: <StudentsPage /> },
        { path: "call", element: <CallPage /> },
        { path: "reminders", element: <RemindersPage /> },
        { path: "progress", element: <ProgressPage /> },
        { path: "reports", element: <ReportsPage /> },
        { path: "export", element: <ExportPage /> },
        { path: "settings", element: <SettingsPage /> }
      ]
    }
  ],
  {
    basename: routerBasename
  }
);


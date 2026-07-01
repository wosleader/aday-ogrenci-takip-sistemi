import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "./AppLayout";
import { CallPage } from "../features/calls/CallPage";
import { ExportPage } from "../features/exports/ExportPage";
import { ImportPage } from "../features/imports/ImportPage";
import { SettingsPage } from "../features/settings/SettingsPage";
import { StudentsPage } from "../features/students/StudentsPage";
import { UIDemoPage } from "../features/demo/UIDemoPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/import" replace /> },
      { path: "import", element: <ImportPage /> },
      { path: "students", element: <StudentsPage /> },
      { path: "call", element: <CallPage /> },
      { path: "export", element: <ExportPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "demo-ui", element: <UIDemoPage /> }
    ]
  }
]);

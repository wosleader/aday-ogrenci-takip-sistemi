import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { initializeDatabase } from "../db/seed";
import { router } from "./router";

export function App() {
  useEffect(() => {
    void initializeDatabase();
  }, []);

  return <RouterProvider router={router} />;
}

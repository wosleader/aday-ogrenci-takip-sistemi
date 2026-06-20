import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { bootstrapPilotSeedIfNeeded } from "../db/pilotSeed";
import { initializeDatabase } from "../db/seed";
import { router } from "./router";

export function App() {
  useEffect(() => {
    void initializeDatabase()
      .then(() => bootstrapPilotSeedIfNeeded())
      .catch((error) => {
        console.error("Veritabanı başlatılırken hata oluştu.", error);
      });
  }, []);

  return <RouterProvider router={router} />;
}

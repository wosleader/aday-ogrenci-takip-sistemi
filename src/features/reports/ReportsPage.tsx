import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { AppOutletContext } from "../../app/AppLayout";
import { PageHeader } from "../../components/PageHeader";
import { DetailedReportsView } from "./DetailedReportsView";
import { ManagerDashboardView } from "./ManagerDashboardView";

type ReportsView = "dashboard" | "detailed";

export function ReportsPage() {
  const { openStudentById } = useOutletContext<AppOutletContext>();
  const [activeView, setActiveView] = useState<ReportsView>("dashboard");

  return (
    <section className="reports-page">
      <div className="reports-shell-header">
        <PageHeader title="Raporlar" description="Yönetici görünümünü veya ayrıntılı operasyon raporlarını inceleyin." />
        <div className="reports-view-tabs" role="tablist" aria-label="Rapor görünümü">
          <button type="button" role="tab" aria-selected={activeView === "dashboard"} className={activeView === "dashboard" ? "active" : ""} onClick={() => setActiveView("dashboard")}>
            Yönetici Dashboard
          </button>
          <button type="button" role="tab" aria-selected={activeView === "detailed"} className={activeView === "detailed" ? "active" : ""} onClick={() => setActiveView("detailed")}>
            Detaylı Raporlar
          </button>
        </div>
      </div>
      <div role="tabpanel" aria-label={activeView === "dashboard" ? "Yönetici Dashboard" : "Detaylı Raporlar"}>
        {activeView === "dashboard" ? <ManagerDashboardView openStudentById={openStudentById} /> : <DetailedReportsView openStudentById={openStudentById} />}
      </div>
    </section>
  );
}

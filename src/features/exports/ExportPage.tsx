import { EmptyState } from "../../components/EmptyState";
import { PageHeader } from "../../components/PageHeader";

export function ExportPage() {
  return (
    <div className="page">
      <PageHeader
        title="Detaylı Export"
        description="Detaylı Excel çıktısı Sprint 2 sonrasında veri akışına bağlanacak."
      />
      <EmptyState
        title="Export işlemi henüz etkin değil"
        description="Sprint 1 sadece JSON yedekleme çekirdeğini hazırlar."
      />
    </div>
  );
}

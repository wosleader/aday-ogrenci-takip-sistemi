import { EmptyState } from "../../components/EmptyState";
import { PageHeader } from "../../components/PageHeader";

export function StudentsPage() {
  return (
    <div className="page">
      <PageHeader
        title="Aday Listesi"
        description="Gerçek aday verisi Sprint 2 sonrasında import akışından beslenecek."
      />
      <EmptyState
        title="Henüz aday verisi yok"
        description="Veri modeli ve yerel veritabanı hazırlandıktan sonra liste akışı eklenecek."
      />
    </div>
  );
}

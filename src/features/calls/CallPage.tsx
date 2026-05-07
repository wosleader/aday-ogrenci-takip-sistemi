import { EmptyState } from "../../components/EmptyState";
import { PageHeader } from "../../components/PageHeader";

export function CallPage() {
  return (
    <div className="page">
      <PageHeader
        title="Arama Ekranı"
        description="Klavye odaklı arama operasyonu için ana çalışma ekranı."
      />
      <EmptyState
        title="Arama akışı Sprint 2 sonrası"
        description="Bu aşamada call log yazımı veya aday kuyruğu oluşturulmuyor."
      />
    </div>
  );
}

import { Upload } from "lucide-react";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { PageHeader } from "../../components/PageHeader";

export function ImportPage() {
  return (
    <div className="page">
      <PageHeader
        title="Excel İçe Aktar"
        description="Sprint 2'de simülasyonlu Excel import akışı bu ekrana bağlanacak."
      />
      <EmptyState
        title="Import motoru henüz bağlanmadı"
        description="Bu sürümde yalnızca Sprint 0 ve Sprint 1 altyapısı hazırlanıyor."
        action={
          <Button type="button" disabled>
            <Upload size={18} aria-hidden="true" />
            Excel Seç
          </Button>
        }
      />
    </div>
  );
}

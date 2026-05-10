import { useLiveQuery } from "dexie-react-hooks";
import { useMemo, useState } from "react";
import { Button } from "../../components/Button";
import { PageHeader } from "../../components/PageHeader";
import { readDetailedExportData } from "./services/exportDataReader";
import {
  createExportPreviewSummary,
  createDetailedExportSheet
} from "./services/exportMapper";
import { readFilteredExportSnapshot } from "./services/exportSelection";
import type { ExportScope } from "./services/exportTypes";
import { createDetailedExportFileName, downloadDetailedExportWorkbook } from "./services/excelExporter";

function scopeLabel(scope: ExportScope): string {
  return scope === "filtered" ? "Mevcut filtrelenmiş liste" : "Tüm adaylar";
}

function formatSnapshotDate(value?: string | null): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function ExportPage() {
  const [scope, setScope] = useState<ExportScope>("all");
  const [isExporting, setIsExporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [snapshot] = useState(() => readFilteredExportSnapshot());
  const filteredIds = scope === "filtered" ? snapshot?.student_ids : undefined;
  const dataset = useLiveQuery(
    () => readDetailedExportData({ studentIds: filteredIds }),
    [scope, snapshot?.created_at],
    undefined
  );
  const summary = useMemo(
    () => (dataset ? createExportPreviewSummary(dataset, scope) : null),
    [dataset, scope]
  );
  const canExportFiltered = Boolean(snapshot?.student_ids.length);
  const canExport = Boolean(dataset && summary && summary.student_count > 0 && (scope === "all" || canExportFiltered));

  async function exportToExcel() {
    if (!dataset || !summary) {
      return;
    }

    setIsExporting(true);
    setMessage("Excel dosyası hazırlanıyor...");

    try {
      const sheet = createDetailedExportSheet(dataset);
      const fileName = createDetailedExportFileName();
      await downloadDetailedExportWorkbook(sheet, fileName);
      setMessage(`${fileName} indirildi.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Excel dışa aktarma tamamlanamadı.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="Excel Dışa Aktar"
        description="Adayları, telefonları, tekrar aramaları ve görüşme geçmişini detaylı Excel formatında dışa aktarın."
      />

      <section className="export-info-box">
        <strong>Excel dışa aktarımı raporlama ve paylaşım içindir.</strong>
        <p>
          Bu Excel dosyası raporlama ve paylaşım amaçlıdır. Programdaki tüm verileri daha sonra eksiksiz geri yüklemek
          istiyorsanız Ayarlar &gt; Veri Yönetimi bölümünden "Tam Sistem Yedeği Al" seçeneğini kullanın.
        </p>
        <p>
          Excel dışa aktarımı; listeyi incelemek, paylaşmak veya raporlamak içindir. Bu dosyayı tekrar içe aktarmak,
          tüm görüşme geçmişi, hatırlatmalar ve sistem ilişkilerini birebir geri yükleme garantisi vermez.
        </p>
      </section>

      <section className="panel">
        <h2>Export Kapsamı</h2>
        <div className="export-scope-grid">
          <label className={`export-option ${scope === "all" ? "active" : ""}`}>
            <input
              checked={scope === "all"}
              onChange={() => setScope("all")}
              type="radio"
            />
            <span>
              <strong>Tüm adayları dışa aktar</strong>
              <small>IndexedDB içindeki tüm aktif aday kayıtlarını okur.</small>
            </span>
          </label>

          <label className={`export-option ${scope === "filtered" ? "active" : ""} ${!canExportFiltered ? "disabled" : ""}`}>
            <input
              checked={scope === "filtered"}
              disabled={!canExportFiltered}
              onChange={() => setScope("filtered")}
              type="radio"
            />
            <span>
              <strong>Mevcut filtrelenmiş listeyi dışa aktar</strong>
              <small>
                {snapshot
                  ? `${snapshot.student_count} aday · ${snapshot.filter_label ?? "Filtre özeti yok"} · ${formatSnapshotDate(
                      snapshot.created_at
                    )}`
                  : "Mevcut filtrelenmiş liste bulunamadı. Önce Aday Listesi ekranında filtreleme yapın."}
              </small>
            </span>
          </label>
        </div>
      </section>

      <section className="panel">
        <h2>Export Öncesi Özet</h2>
        {!dataset || !summary ? (
          <p className="muted-text">Export özeti hazırlanıyor...</p>
        ) : (
          <div className="summary-grid">
            <div className="summary-metric">
              <span>Export kapsamı</span>
              <strong>{scopeLabel(scope)}</strong>
            </div>
            <div className="summary-metric">
              <span>Aday sayısı</span>
              <strong>{summary.student_count}</strong>
            </div>
            <div className="summary-metric">
              <span>Görüşme kaydı</span>
              <strong>{summary.total_call_log_count}</strong>
            </div>
            <div className="summary-metric">
              <span>Maksimum Arama N</span>
              <strong>{summary.max_call_log_count}</strong>
            </div>
            <div className="summary-metric">
              <span>Dinamik arama grubu</span>
              <strong>{summary.dynamic_call_group_count}</strong>
            </div>
            <div className="summary-metric">
              <span>Tahmini kolon</span>
              <strong>{summary.estimated_column_count}</strong>
            </div>
          </div>
        )}

        {scope === "filtered" && !canExportFiltered ? (
          <p className="error-text">Mevcut filtrelenmiş liste bulunamadı. Önce Aday Listesi ekranında filtreleme yapın.</p>
        ) : null}
        {message ? <p className="student-action-message">{message}</p> : null}

        <div className="toolbar">
          <Button disabled={!canExport || isExporting} onClick={() => void exportToExcel()} type="button">
            {isExporting ? "Hazırlanıyor..." : "Detaylı Excel Dışa Aktar"}
          </Button>
        </div>
      </section>
    </div>
  );
}

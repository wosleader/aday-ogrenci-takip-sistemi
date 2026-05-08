import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Clipboard, Download, Upload } from "lucide-react";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { PageHeader } from "../../components/PageHeader";
import { COLUMN_DEFINITIONS } from "./services/columnDefinitions";
import { matchColumns } from "./services/columnMatching";
import { parseFirstWorksheet, reparseWorksheetWithHeaderRow } from "./services/excelReader";
import { simulateImport } from "./services/importSimulation";
import {
  createImportLogText,
  createTechnicalSupportLog,
  downloadTextFile,
  groupLogsBySeverity,
  type PrivacyMode
} from "./services/logExport";
import type { ImportFieldKey, ImportSimulationSummary, ParsedWorksheet } from "./services/types";

const STORAGE_KEY = "aday-takip:last-import-simulation";
const MAX_VISIBLE_LOGS = 50;

type StoredSimulationState = {
  worksheet: ParsedWorksheet;
  summary: ImportSimulationSummary;
  manualMappings: Record<number, ImportFieldKey | "ignore" | "">;
};

export function ImportPage() {
  const [worksheet, setWorksheet] = useState<ParsedWorksheet | null>(null);
  const [summary, setSummary] = useState<ImportSimulationSummary | null>(null);
  const [manualMappings, setManualMappings] = useState<Record<number, ImportFieldKey | "ignore" | "">>(
    {}
  );
  const [error, setError] = useState<string | null>(null);
  const [headerRowNumber, setHeaderRowNumber] = useState(1);
  const [privacyMode, setPrivacyMode] = useState<PrivacyMode>("private");

  const columnMatches = useMemo(
    () => (worksheet ? matchColumns(worksheet.headers, manualMappings).matches : []),
    [manualMappings, worksheet]
  );
  const groupedLogs = useMemo(
    () => (summary ? groupLogsBySeverity([...summary.logs, ...summary.detailed_logs]) : null),
    [summary]
  );

  useEffect(() => {
    const storedValue = sessionStorage.getItem(STORAGE_KEY);

    if (!storedValue) {
      return;
    }

    try {
      const storedState = JSON.parse(storedValue) as StoredSimulationState;
      setWorksheet(storedState.worksheet);
      setSummary(storedState.summary);
      setManualMappings(storedState.manualMappings);
      setHeaderRowNumber(storedState.worksheet.detected_header_row_number);
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  function persistSimulation(nextState: StoredSimulationState) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  }

  function applySimulation(
    nextWorksheet: ParsedWorksheet,
    nextManualMappings: Record<number, ImportFieldKey | "ignore" | ""> = manualMappings
  ) {
    const simulation = simulateImport(nextWorksheet, { manualMappings: nextManualMappings });

    setWorksheet(nextWorksheet);
    setSummary(simulation);
    setManualMappings(nextManualMappings);
    setHeaderRowNumber(nextWorksheet.detected_header_row_number);
    persistSimulation({
      worksheet: nextWorksheet,
      summary: simulation,
      manualMappings: nextManualMappings
    });
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setError(null);
      const buffer = await file.arrayBuffer();
      const parsedWorksheet = await parseFirstWorksheet(buffer, file.name);
      applySimulation(parsedWorksheet, {});
    } catch (caughtError) {
      setWorksheet(null);
      setSummary(null);
      setError(caughtError instanceof Error ? caughtError.message : "Excel dosyası okunamadı.");
    }
  }

  function handleHeaderRowChange(nextHeaderRowNumber: number) {
    if (!worksheet) {
      return;
    }

    const reparsedWorksheet = reparseWorksheetWithHeaderRow(worksheet, nextHeaderRowNumber);
    applySimulation(reparsedWorksheet, {});
  }

  function updateManualMapping(sourceIndex: number, value: ImportFieldKey | "ignore" | "") {
    setManualMappings((current) => ({
      ...current,
      [sourceIndex]: value
    }));
  }

  function rerunSimulationWithMappings() {
    if (!worksheet) {
      return;
    }

    applySimulation(worksheet, manualMappings);
  }

  function clearSimulation() {
    sessionStorage.removeItem(STORAGE_KEY);
    setWorksheet(null);
    setSummary(null);
    setManualMappings({});
    setHeaderRowNumber(1);
    setError(null);
  }

  function createFileSuffix() {
    return new Date().toISOString().replace(/[:.]/g, "-");
  }

  function downloadImportLog() {
    if (!worksheet || !summary) {
      return;
    }

    const content = createImportLogText(worksheet, summary, columnMatches, "full");
    downloadTextFile(`import-log-${createFileSuffix()}.txt`, content);
  }

  function createSupportLog() {
    if (!worksheet || !summary) {
      return "";
    }

    return createTechnicalSupportLog({
      worksheet,
      summary,
      columnMatches,
      activePage: window.location.pathname,
      privacyMode
    });
  }

  async function copySupportLog() {
    const content = createSupportLog();

    if (!content) {
      return;
    }

    await navigator.clipboard.writeText(content);
  }

  function downloadSupportLog() {
    const content = createSupportLog();

    if (!content) {
      return;
    }

    downloadTextFile(`teknik-destek-logu-${createFileSuffix()}.txt`, content);
  }

  return (
    <div className="page">
      <PageHeader
        title="Excel İçe Aktar"
        description="Dosya kaydedilmeden okunur, ilk worksheet üzerinden ön izleme ve simülasyon üretilir."
      />

      <section className="panel">
        <label className="file-picker">
          <input accept=".xlsx,.xls" type="file" onChange={handleFileChange} />
          <Button type="button" variant="secondary" className="file-picker-button">
            <Upload size={18} aria-hidden="true" />
            Excel Dosyası Seç ve Ön Kontrol Yap
          </Button>
        </label>
        {error ? <p className="error-text">{error}</p> : null}
        {summary ? (
          <Button type="button" variant="secondary" onClick={clearSimulation}>
            Simülasyonu Temizle
          </Button>
        ) : null}
      </section>

      {!summary ? (
        <EmptyState
          title="Henüz simülasyon yok"
          description="İlk Excel sekmesi okunur, kolonlar otomatik eşleştirilir, hatalar ve uyarılar gösterilir. Onay vermeden kayıt yapılmaz."
          action={
            <ul className="check-list">
              <li>İlk Excel sekmesi okunur</li>
              <li>Kolonlar otomatik eşleştirilir</li>
              <li>Hatalar ve uyarılar gösterilir</li>
              <li>Onay vermeden kayıt yapılmaz</li>
            </ul>
          }
        />
      ) : (
        <>
          <section className="summary-grid" aria-label="Import simülasyon özeti">
            <SummaryMetric label="Toplam satır" value={summary.total_rows} />
            <SummaryMetric label="Okunacak satır" value={summary.readable_rows} />
            <SummaryMetric label="İçe aktarılmayacak satır" value={summary.skipped_rows} />
            <SummaryMetric label="Telefon bilgisi eksik kayıt" value={summary.empty_phone_count ?? 0} />
            <SummaryMetric
              label="Kampanyası Diğer yapılacak"
              value={summary.default_campaign_assigned_count}
            />
            <SummaryMetric
              label="Varsayılan saat atanacak"
              value={summary.default_time_assigned_count}
              description="Tekrar arama tarihi var ama saat boş. Sistem bu kayıtları 11:00 olarak planlayacak."
            />
          </section>

          <section className="panel">
            <h2>Worksheet</h2>
            <p>
              Okunan sekme: <strong>{worksheet?.sheet_name}</strong>
            </p>
            <p>
              Algılanan başlık satırı: <strong>{worksheet?.detected_header_row_number}</strong>
            </p>
            {worksheet?.ignored_sheet_names.length ? (
              <p>Yok sayılan sekmeler: {worksheet.ignored_sheet_names.join(", ")}</p>
            ) : null}
            <label className="inline-field">
              Başlık satırı
              <input
                min={1}
                max={worksheet?.raw_rows.length ?? 1}
                type="number"
                value={headerRowNumber}
                onChange={(event) => setHeaderRowNumber(Number(event.target.value))}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleHeaderRowChange(headerRowNumber)}
              >
                Başlık Satırını Uygula
              </Button>
            </label>
          </section>

          <section className="panel">
            <h2>Kolon Eşleştirme</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Kolon</th>
                    <th>Excel Başlığı</th>
                    <th>Algılanan CRM Alanı</th>
                    <th>Güven</th>
                    <th>Manuel Seçim</th>
                  </tr>
                </thead>
                <tbody>
                  {columnMatches.map((match) => (
                    <tr key={match.source_index}>
                      <td>
                        {match.source_column_letter} ({match.source_column_number})
                      </td>
                      <td>{match.source_header || "Başlık boş"}</td>
                      <td>
                        {match.target_field
                          ? COLUMN_DEFINITIONS.find((definition) => definition.field === match.target_field)
                              ?.label
                          : match.status === "ignored"
                            ? "Yok sayıldı"
                            : "Eşleştirme gerekli"}
                      </td>
                      <td>
                        {match.status} / {Math.round(match.confidence * 100)}%
                      </td>
                      <td>
                        <select
                          value={manualMappings[match.source_index] ?? match.target_field ?? ""}
                          onChange={(event) =>
                            updateManualMapping(
                              match.source_index,
                              event.target.value as ImportFieldKey | "ignore" | ""
                            )
                          }
                        >
                          <option value="">Otomatik</option>
                          <option value="ignore">Yok say</option>
                          {COLUMN_DEFINITIONS.map((definition) => (
                            <option key={definition.field} value={definition.field}>
                              {definition.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button type="button" variant="secondary" onClick={rerunSimulationWithMappings}>
              Eşleştirmeyi Güncelle ve Tekrar Simüle Et
            </Button>
          </section>

          <section className="panel">
            <h2>İlk 20 Satır Ön İzleme</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Satır</th>
                    <th>Ad Soyad</th>
                    <th>Veli</th>
                    <th>Telefon</th>
                    <th>2. Telefon</th>
                    <th>Kampanya</th>
                    <th>Tekrar Arama</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.preview_rows.map((row) => (
                    <tr key={row.row_number}>
                      <td>{row.row_number}</td>
                      <td>{row.student_full_name}</td>
                      <td>{row.guardian_full_name ?? "-"}</td>
                      <td>{row.phone_1 ?? "-"}</td>
                      <td>{row.phone_2 ?? "-"}</td>
                      <td>{row.campaign_name}</td>
                      <td>{row.reminder_at ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel">
            <h2>Import Log</h2>
            <p>Önce özet gösterilir; satır detayları Detayları göster içinde tutulur.</p>
            <div className="toolbar">
              <Button type="button" variant="secondary" onClick={downloadImportLog}>
                <Download size={16} aria-hidden="true" />
                Logu TXT Olarak İndir
              </Button>
            </div>
            {groupedLogs ? (
              <>
                <LogGroup title="Hatalar" logs={groupedLogs.error.slice(0, MAX_VISIBLE_LOGS)} />
                <LogGroup title="Uyarılar" logs={groupedLogs.warning.slice(0, MAX_VISIBLE_LOGS)} />
                <LogGroup title="Bilgiler" logs={groupedLogs.info.slice(0, MAX_VISIBLE_LOGS)} />
              </>
            ) : null}
            {summary.detailed_logs.length ? (
              <details className="details-block">
                <summary>Detayları göster ({summary.detailed_logs.length})</summary>
                <LogGroup title="Satır Detayları" logs={summary.detailed_logs} />
              </details>
            ) : null}
          </section>

          <section className="panel">
            <h2>Teknik Destek Logu</h2>
            <p>Destek paylaşımı için import durumu, kolon eşleşmeleri ve sistem bilgileri TXT olarak hazırlanır.</p>
            <label className="inline-field">
              Log içeriği
              <select value={privacyMode} onChange={(event) => setPrivacyMode(event.target.value as PrivacyMode)}>
                <option value="private">Gizlilik korumalı log</option>
                <option value="full">Tam log</option>
              </select>
            </label>
            <div className="toolbar">
              <Button type="button" variant="secondary" onClick={() => void copySupportLog()}>
                <Clipboard size={16} aria-hidden="true" />
                Hata Logunu Kopyala
              </Button>
              <Button type="button" variant="secondary" onClick={downloadSupportLog}>
                <Download size={16} aria-hidden="true" />
                Hata Logunu TXT Olarak İndir
              </Button>
              <Button type="button" variant="secondary" onClick={downloadSupportLog}>
                <Download size={16} aria-hidden="true" />
                Teknik Destek Paketi Oluştur
              </Button>
            </div>
          </section>

          <section className="panel">
            <h2>İçe Aktarma</h2>
            <p>Simülasyon hazır. Gerçek kayıt yazma Sprint 3'te aktif olacak.</p>
            <Button type="button" disabled>
              İçe Aktar - Sprint 3'te aktif olacak
            </Button>
          </section>
        </>
      )}
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  description
}: {
  label: string;
  value: number;
  description?: string;
}) {
  return (
    <div className="summary-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      {description ? <small>{description}</small> : null}
    </div>
  );
}

function LogGroup({ title, logs }: { title: string; logs: ImportSimulationSummary["logs"] }) {
  return (
    <section className="log-group">
      <h3>{title}</h3>
      {logs.length ? (
        <ul className="log-list">
          {logs.map((log, index) => (
            <li key={`${title}-${log.message}-${index}`} data-severity={log.severity}>
              <strong>{log.row_number ? `Satır ${log.row_number}: ` : ""}</strong>
              {log.message}
              {log.suggested_action ? <small>Önerilen işlem: {log.suggested_action}</small> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p>Bu grupta kayıt yok.</p>
      )}
    </section>
  );
}

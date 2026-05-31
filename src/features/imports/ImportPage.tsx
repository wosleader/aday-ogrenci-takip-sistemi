import { useEffect, useMemo, useRef, useState, type ChangeEvent, type MouseEvent } from "react";
import { Clipboard, Download, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { PageHeader } from "../../components/PageHeader";
import { COLUMN_DEFINITIONS } from "./services/columnDefinitions";
import { matchColumns } from "./services/columnMatching";
import { parseFirstWorksheet, reparseWorksheetWithHeaderRow } from "./services/excelReader";
import {
  checkPossibleDuplicateImport,
  type DuplicateImportWarning
} from "./services/importDuplicateGuard";
import { simulateImport } from "./services/importSimulation";
import { writeImportToDatabase, type ImportWriteResult } from "./services/importWriter";
import {
  createImportLogText,
  createTechnicalSupportLog,
  downloadTextFile,
  groupLogsBySeverity,
  type PrivacyMode
} from "./services/logExport";
import type { ColumnMatch, ImportFieldKey, ImportSimulationSummary, ParsedWorksheet } from "./services/types";

const STORAGE_KEY = "aday-takip:last-import-simulation";
const INITIAL_VISIBLE_COLUMN_MATCHES = 10;
const INITIAL_VISIBLE_IMPORT_MESSAGES = 5;
const IMPORT_MESSAGE_EXPANSION_STEPS = [5, 20, 50];
const INITIAL_VISIBLE_PREVIEW_ROWS = 10;
const MAX_VISIBLE_PREVIEW_ROWS = 20;

type StoredSimulationState = {
  worksheet: ParsedWorksheet;
  summary: ImportSimulationSummary;
  manualMappings: Record<number, ImportFieldKey | "ignore" | "">;
};

const SYSTEM_EXPORT_INFO_TOOLTIP =
  "Bu kolon rapor/sistem bilgisidir. Aday kaydına aktarılmaz.";
const SYSTEM_EXPORT_INFO_TOOLTIP_DELAY_MS = 120;

function isSystemExportInfoMatch(match: ColumnMatch) {
  return match.status === "ignored" && match.note?.startsWith("Sistem bilgisi");
}

function getColumnMatchStatusLabel(match: ColumnMatch) {
  if (match.status === "manual") {
    return "Elle eşleştirildi";
  }

  if (match.status === "mapping_required") {
    return "Elle eşleştirme gerekli";
  }

  if (match.status === "ignored") {
    return "İçe aktarılmayacak";
  }

  if (match.status === "matched" && match.confidence >= 1) {
    return "Tam eşleşti";
  }

  return "Eşleşti";
}

function SystemExportInfoLabel() {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const tooltipTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (tooltipTimerRef.current != null) {
        window.clearTimeout(tooltipTimerRef.current);
      }
    };
  }, []);

  function showTooltipSoon() {
    if (tooltipTimerRef.current != null) {
      window.clearTimeout(tooltipTimerRef.current);
    }

    tooltipTimerRef.current = window.setTimeout(() => {
      setIsTooltipVisible(true);
    }, SYSTEM_EXPORT_INFO_TOOLTIP_DELAY_MS);
  }

  function hideTooltip() {
    if (tooltipTimerRef.current != null) {
      window.clearTimeout(tooltipTimerRef.current);
      tooltipTimerRef.current = null;
    }

    setIsTooltipVisible(false);
  }

  return (
    <span
      onBlur={hideTooltip}
      onFocus={showTooltipSoon}
      onMouseEnter={showTooltipSoon}
      onMouseLeave={hideTooltip}
      style={{
        alignItems: "center",
        display: "inline-flex",
        gap: 5,
        position: "relative",
        verticalAlign: "middle"
      }}
      tabIndex={0}
    >
      <span>İçe Aktarılamaz</span>
      <span
        aria-label={SYSTEM_EXPORT_INFO_TOOLTIP}
        role="img"
        style={{
          alignItems: "center",
          backgroundColor: "#f7f1e8",
          border: "1px solid #ded2c1",
          borderRadius: "999px",
          color: "#786a55",
          cursor: "help",
          display: "inline-flex",
          flexShrink: 0,
          fontSize: 9,
          fontWeight: 700,
          height: 13,
          justifyContent: "center",
          lineHeight: 1,
          transform: "translateY(1px)",
          userSelect: "none",
          verticalAlign: "middle",
          width: 13
        }}
      >
        <span aria-hidden="true" style={{ display: "block", lineHeight: 1, transform: "none" }}>
          i
        </span>
      </span>
      {isTooltipVisible ? (
        <span
          role="tooltip"
          style={{
            backgroundColor: "#3f382f",
            borderRadius: 6,
            boxShadow: "0 8px 20px rgba(31, 26, 20, 0.18)",
            color: "#fffaf2",
            fontSize: 11,
            fontWeight: 500,
            left: 0,
            lineHeight: 1.35,
            padding: "6px 8px",
            position: "absolute",
            top: "calc(100% + 5px)",
            userSelect: "none",
            whiteSpace: "nowrap",
            zIndex: 20
          }}
        >
          {SYSTEM_EXPORT_INFO_TOOLTIP}
        </span>
      ) : null}
    </span>
  );
}

export function ImportPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const columnMappingSectionRef = useRef<HTMLElement | null>(null);
  const previewSectionRef = useRef<HTMLElement | null>(null);
  const [worksheet, setWorksheet] = useState<ParsedWorksheet | null>(null);
  const [summary, setSummary] = useState<ImportSimulationSummary | null>(null);
  const [manualMappings, setManualMappings] = useState<Record<number, ImportFieldKey | "ignore" | "">>(
    {}
  );
  const [error, setError] = useState<string | null>(null);
  const [headerRowNumber, setHeaderRowNumber] = useState(1);
  const [privacyMode, setPrivacyMode] = useState<PrivacyMode>("private");
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportWriteResult | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateImportWarning | null>(null);
  const [duplicateOverrideAccepted, setDuplicateOverrideAccepted] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [isColumnMappingExpanded, setIsColumnMappingExpanded] = useState(false);
  const [errorsVisibleCount, setErrorsVisibleCount] = useState(INITIAL_VISIBLE_IMPORT_MESSAGES);
  const [warningsVisibleCount, setWarningsVisibleCount] = useState(INITIAL_VISIBLE_IMPORT_MESSAGES);
  const [infoVisibleCount, setInfoVisibleCount] = useState(INITIAL_VISIBLE_IMPORT_MESSAGES);
  const [previewVisibleRowCount, setPreviewVisibleRowCount] = useState(INITIAL_VISIBLE_PREVIEW_ROWS);
  const [hideSystemExportColumns, setHideSystemExportColumns] = useState(false);

  const columnMatches = useMemo(
    () => (worksheet ? matchColumns(worksheet.headers, manualMappings).matches : []),
    [manualMappings, worksheet]
  );
  const systemExportInfoMatches = useMemo(
    () => columnMatches.filter(isSystemExportInfoMatch),
    [columnMatches]
  );
  const displayColumnMatches = useMemo(
    () =>
      hideSystemExportColumns
        ? columnMatches.filter((match) => !isSystemExportInfoMatch(match))
        : columnMatches,
    [columnMatches, hideSystemExportColumns]
  );
  const collapsedColumnMatches = useMemo(
    () => getInitialVisibleColumnMatches(displayColumnMatches, manualMappings),
    [displayColumnMatches, manualMappings]
  );
  const visibleColumnMatches = useMemo(
    () => (isColumnMappingExpanded ? displayColumnMatches : collapsedColumnMatches),
    [collapsedColumnMatches, displayColumnMatches, isColumnMappingExpanded]
  );
  const selectedMappingOwners = useMemo(
    () => createSelectedMappingOwners(columnMatches, manualMappings),
    [columnMatches, manualMappings]
  );
  const hiddenColumnMatchCount = displayColumnMatches.length - collapsedColumnMatches.length;
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
      const restoredSummary = simulateImport(storedState.worksheet, {
        manualMappings: storedState.manualMappings
      });
      setWorksheet(storedState.worksheet);
      setSummary(restoredSummary);
      setManualMappings(storedState.manualMappings);
      setHeaderRowNumber(storedState.worksheet.detected_header_row_number);
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function checkDuplicate() {
      if (!worksheet || !summary) {
        setDuplicateWarning(null);
        setDuplicateOverrideAccepted(false);
        setIsDuplicateModalOpen(false);
        return;
      }

      const warning = await checkPossibleDuplicateImport(worksheet, summary);

      if (!isCancelled) {
        setDuplicateWarning(warning.isPossibleDuplicate ? warning : null);
        setDuplicateOverrideAccepted(false);
        setIsDuplicateModalOpen(false);
      }
    }

    void checkDuplicate();

    return () => {
      isCancelled = true;
    };
  }, [summary, worksheet]);

  function persistSimulation(nextState: StoredSimulationState) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  }

  function resetProgressiveDisclosure() {
    setIsColumnMappingExpanded(false);
    setErrorsVisibleCount(INITIAL_VISIBLE_IMPORT_MESSAGES);
    setWarningsVisibleCount(INITIAL_VISIBLE_IMPORT_MESSAGES);
    setInfoVisibleCount(INITIAL_VISIBLE_IMPORT_MESSAGES);
    setPreviewVisibleRowCount(INITIAL_VISIBLE_PREVIEW_ROWS);
  }

  function resetFileInput() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function prepareFileInputForSelection(event: MouseEvent<HTMLInputElement>) {
    event.currentTarget.value = "";
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
    setImportResult(null);
    setDuplicateOverrideAccepted(false);
    setIsDuplicateModalOpen(false);
    resetProgressiveDisclosure();
    persistSimulation({
      worksheet: nextWorksheet,
      summary: simulation,
      manualMappings: nextManualMappings
    });
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const fileInput = event.currentTarget;
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setError(null);
      setImportResult(null);
      setDuplicateWarning(null);
      setDuplicateOverrideAccepted(false);
      setIsDuplicateModalOpen(false);
      setHideSystemExportColumns(false);
      const buffer = await file.arrayBuffer();
      const parsedWorksheet = await parseFirstWorksheet(buffer, file.name);
      parsedWorksheet.file_size = file.size;
      parsedWorksheet.file_last_modified = file.lastModified;
      applySimulation(parsedWorksheet, {});
    } catch (caughtError) {
      setWorksheet(null);
      setSummary(null);
      resetProgressiveDisclosure();
      setError(caughtError instanceof Error ? caughtError.message : "Excel dosyası okunamadı.");
    } finally {
      fileInput.value = "";
    }
  }

  function handleHeaderRowChange(nextHeaderRowNumber: number) {
    if (!worksheet) {
      return;
    }

    const reparsedWorksheet = reparseWorksheetWithHeaderRow(worksheet, nextHeaderRowNumber);
    setHideSystemExportColumns(false);
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
    resetFileInput();
    sessionStorage.removeItem(STORAGE_KEY);
    setWorksheet(null);
    setSummary(null);
    setManualMappings({});
    setHeaderRowNumber(1);
    setError(null);
    setImportResult(null);
    setDuplicateWarning(null);
    setDuplicateOverrideAccepted(false);
    setIsDuplicateModalOpen(false);
    setHideSystemExportColumns(false);
    resetProgressiveDisclosure();
  }

  function clearCompletedSimulation() {
    resetFileInput();
    sessionStorage.removeItem(STORAGE_KEY);
    setWorksheet(null);
    setSummary(null);
    setManualMappings({});
    setHeaderRowNumber(1);
    setDuplicateWarning(null);
    setDuplicateOverrideAccepted(false);
    setIsDuplicateModalOpen(false);
    setHideSystemExportColumns(false);
    resetProgressiveDisclosure();
  }

  function createFileSuffix() {
    return new Date().toISOString().replace(/[:.]/g, "-");
  }

  function formatImportDate(value?: string | null) {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat("tr-TR", {
      dateStyle: "short",
      timeStyle: "short"
    }).format(date);
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

  async function performImport({ skipDuplicateCheck = false } = {}) {
    if (!worksheet) {
      return;
    }

    const currentSummary = simulateImport(worksheet, { manualMappings });

    if (currentSummary.readable_rows === 0) {
      return;
    }

    setIsImporting(true);
    setError(null);
    setImportResult(null);
    setSummary(currentSummary);
    persistSimulation({
      worksheet,
      summary: currentSummary,
      manualMappings
    });

    try {
      if (!skipDuplicateCheck) {
        const duplicateWarning = await checkPossibleDuplicateImport(worksheet, currentSummary);

        if (duplicateWarning.isPossibleDuplicate && !duplicateOverrideAccepted) {
          setDuplicateWarning(duplicateWarning);
          setIsDuplicateModalOpen(true);
          setIsImporting(false);
          return;
        }
      }

      const result = await writeImportToDatabase(worksheet, currentSummary);
      downloadTextFile(result.backup.file_name, result.backup.json);
      clearCompletedSimulation();
      setImportResult(result);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "İçe aktarma sırasında bilinmeyen bir hata oluştu.";
      setError(`İçe aktarma tamamlanamadı. Transaction geri alındı; kısmi veri kalmadı. ${message}`);
    } finally {
      setIsImporting(false);
    }
  }

  async function handleImport() {
    if (!worksheet || !summary || summary.readable_rows === 0) {
      return;
    }

    const userConfirmed = window.confirm(
      "Simülasyondaki okunabilir aday kayıtları IndexedDB'ye yazılacak. Devam edilsin mi?"
    );

    if (!userConfirmed) {
      return;
    }

    await performImport();
  }

  function cancelDuplicateImport() {
    setIsDuplicateModalOpen(false);
    setDuplicateOverrideAccepted(false);
    setError("İçe aktarma iptal edildi. Aynı dosyayı tekrar içe aktarmak isterseniz önce uyarıyı onaylamalısınız.");
  }

  function continueDuplicateImport() {
    setDuplicateOverrideAccepted(true);
    setIsDuplicateModalOpen(false);
    setError(null);
    void performImport({ skipDuplicateCheck: true });
  }

  return (
    <div className="page">
      <PageHeader
        title="Excel İçe Aktar"
        description="Dosya kaydedilmeden okunur, ilk worksheet üzerinden ön izleme ve simülasyon üretilir."
      />

      {duplicateWarning && isDuplicateModalOpen ? (
        <div className="import-modal-backdrop" role="presentation">
          <section
            aria-describedby="duplicate-import-modal-description"
            aria-labelledby="duplicate-import-modal-title"
            aria-modal="true"
            className="import-duplicate-modal"
            role="dialog"
          >
            <div className="import-modal-warning-mark">!</div>
            <h2 id="duplicate-import-modal-title">Bu dosya daha önce içe aktarılmış olabilir</h2>
            <p id="duplicate-import-modal-description">
              Bu dosyayı tekrar içe aktarırsanız aynı adaylar yeniden eklenebilir ve mükerrer kayıtlar oluşabilir.
            </p>
            <div className="duplicate-modal-details">
              {duplicateWarning.matched_imports.map((match) => (
                <dl key={match.import_id}>
                  <div>
                    <dt>Dosya adı</dt>
                    <dd>{match.file_name}</dd>
                  </div>
                  <div>
                    <dt>Worksheet</dt>
                    <dd>{match.sheet_name}</dd>
                  </div>
                  <div>
                    <dt>Önceki import tarihi</dt>
                    <dd>{formatImportDate(match.finished_at ?? match.started_at)}</dd>
                  </div>
                  <div>
                    <dt>Önceki import kayıt sayısı</dt>
                    <dd>{match.imported_rows}</dd>
                  </div>
                </dl>
              ))}
            </div>
            <div className="import-modal-actions">
              <Button type="button" onClick={cancelDuplicateImport}>
                İptal Et
              </Button>
              <Button type="button" variant="secondary" onClick={continueDuplicateImport}>
                Yine de İçe Aktar
              </Button>
            </div>
          </section>
        </div>
      ) : null}

      <section className="panel">
        <label className="file-picker">
          <input
            accept=".xlsx,.xls"
            ref={fileInputRef}
            type="file"
            onClick={prepareFileInputForSelection}
            onChange={handleFileChange}
          />
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
        importResult ? (
          <section className="import-result">
            <h3>İçe Aktarma Tamamlandı</h3>
            <div className="summary-grid">
              <SummaryMetric label="Oluşturulan öğrenci" value={importResult.created_students} />
              <SummaryMetric label="Oluşturulan veli" value={importResult.created_guardians} />
              <SummaryMetric label="Oluşturulan telefon" value={importResult.created_phones} />
              <SummaryMetric label="Oluşturulan hatırlatma" value={importResult.created_reminders} />
              <SummaryMetric label="Kaydedilen içe aktarma logu" value={importResult.saved_import_logs} />
              <SummaryMetric label="Atlanan satır" value={importResult.skipped_rows} />
            </div>
            <p>İçe aktarma öncesi güvenlik yedeği oluşturuldu ve indirilebilir hale getirildi.</p>
            <Button type="button" variant="secondary" onClick={() => navigate("/students")}>
              Aday Listesine Git
            </Button>
          </section>
        ) : (
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
        )
      ) : (
        <>
          <section className="summary-grid" aria-label="İçe aktarma ön kontrol özeti">
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

          {duplicateWarning ? (
            <section className="panel duplicate-warning-panel">
              <h2>Bu dosya daha önce içe aktarılmış olabilir</h2>
              <p>Otomatik birleştirme yapılmayacak. Devam ederseniz kayıtlar yeniden oluşabilir.</p>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Dosya</th>
                      <th>Worksheet</th>
                      <th>İçe aktarma tarihi</th>
                      <th>Kayıt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {duplicateWarning.matched_imports.map((match) => (
                      <tr key={match.import_id}>
                        <td>{match.file_name}</td>
                        <td>{match.sheet_name}</td>
                        <td>{formatImportDate(match.finished_at ?? match.started_at)}</td>
                        <td>{match.imported_rows}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="toolbar">
                <Button type="button" variant="secondary" onClick={clearSimulation}>
                  İptal
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setIsDuplicateModalOpen(true);
                    setError(null);
                  }}
                >
                  Yine de içe aktar
                </Button>
                <Button type="button" variant="secondary" disabled>
                  Eski import verisini temizleyip yeniden içe aktar
                </Button>
              </div>
            </section>
          ) : null}

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

          <section className="panel" ref={columnMappingSectionRef}>
            <h2>Kolon Eşleştirme</h2>
            <p className="muted">
              Bazı kolonlar sistem tarafından tanınır ancak standart içe aktarmada kullanılmaz. Bu
              kolonlar “İçe Aktarılamaz” olarak gösterilir.
            </p>
            {systemExportInfoMatches.length > 0 ? (
              <div className="toolbar">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setHideSystemExportColumns((current) => !current)}
                >
                  {hideSystemExportColumns
                    ? `${systemExportInfoMatches.length} içe aktarılmayacak kolon gizlendi · Göster`
                    : "İçe aktarılmayacak kolonları gizle"}
                </Button>
              </div>
            ) : null}
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Kolon</th>
                    <th>Excel Başlığı</th>
                    <th>Algılanan CRM Alanı</th>
                    <th>Durum</th>
                    <th>Manuel Seçim</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleColumnMatches.map((match) => (
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
                            ? isSystemExportInfoMatch(match)
                              ? <SystemExportInfoLabel />
                              : "Yok sayıldı"
                            : "Eşleştirme gerekli"}
                      </td>
                      <td>{getColumnMatchStatusLabel(match)}</td>
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
                          {COLUMN_DEFINITIONS.map((definition) => {
                            const selectedSourceIndex = selectedMappingOwners.get(definition.field);
                            const isSelectedByAnotherColumn =
                              selectedSourceIndex != null && selectedSourceIndex !== match.source_index;

                            return (
                              <option
                                disabled={isSelectedByAnotherColumn}
                                key={definition.field}
                                value={definition.field}
                              >
                                {isSelectedByAnotherColumn
                                  ? `${definition.label} — başka kolonda seçildi`
                                  : definition.label}
                              </option>
                            );
                          })}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {hiddenColumnMatchCount > 0 ? (
              <div className="toolbar">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    setIsColumnMappingExpanded((current) => {
                      if (current) {
                        scrollToImportSection(columnMappingSectionRef.current);
                      }

                      return !current;
                    })
                  }
                >
                  {isColumnMappingExpanded
                    ? "Daha az göster"
                    : `+${hiddenColumnMatchCount} kolon daha göster`}
                </Button>
              </div>
            ) : null}
            <Button type="button" variant="secondary" onClick={rerunSimulationWithMappings}>
              Eşleştirmeyi Güncelle ve Tekrar Simüle Et
            </Button>
          </section>

          <section className="panel" ref={previewSectionRef}>
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
                  {summary.preview_rows.slice(0, previewVisibleRowCount).map((row) => (
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
            {summary.preview_rows.length > INITIAL_VISIBLE_PREVIEW_ROWS ? (
              <div className="toolbar">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const maxPreviewRows = Math.min(summary.preview_rows.length, MAX_VISIBLE_PREVIEW_ROWS);

                    setPreviewVisibleRowCount((current) => {
                      if (current >= maxPreviewRows) {
                        scrollToImportSection(previewSectionRef.current);
                        return INITIAL_VISIBLE_PREVIEW_ROWS;
                      }

                      return maxPreviewRows;
                    });
                  }}
                >
                  {previewVisibleRowCount >= Math.min(summary.preview_rows.length, MAX_VISIBLE_PREVIEW_ROWS)
                    ? "Daha az göster"
                    : `+${Math.min(summary.preview_rows.length, MAX_VISIBLE_PREVIEW_ROWS) - previewVisibleRowCount} daha göster`}
                </Button>
              </div>
            ) : null}
          </section>

          <section className="panel">
            <h2>İçe Aktarma Logu</h2>
            <p>Hatalar, uyarılar ve bilgiler ilk 5 kayıtla gösterilir; fazlası aynı listede açılır.</p>
            <div className="toolbar">
              <Button type="button" variant="secondary" onClick={downloadImportLog}>
                <Download size={16} aria-hidden="true" />
                Logu TXT Olarak İndir
              </Button>
            </div>
            {groupedLogs ? (
              <>
                <CollapsibleLogGroup
                  title="Hatalar"
                  logs={groupedLogs.error}
                  visibleCount={errorsVisibleCount}
                  onVisibleCountChange={setErrorsVisibleCount}
                />
                <CollapsibleLogGroup
                  title="Uyarılar"
                  logs={groupedLogs.warning}
                  visibleCount={warningsVisibleCount}
                  onVisibleCountChange={setWarningsVisibleCount}
                />
                <CollapsibleLogGroup
                  title="Bilgiler"
                  logs={groupedLogs.info}
                  visibleCount={infoVisibleCount}
                  onVisibleCountChange={setInfoVisibleCount}
                />
              </>
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
            <p>Simülasyon hazırsa kayıtlar kullanıcı onayıyla yerel IndexedDB veritabanına yazılır.</p>
            <Button
              type="button"
              disabled={isImporting || !summary || summary.readable_rows === 0}
              onClick={() => void handleImport()}
            >
              {isImporting ? "İçe Aktarılıyor..." : "İçe Aktar"}
            </Button>
            {importResult ? (
              <section className="import-result">
                <h3>İçe Aktarma Tamamlandı</h3>
                <div className="summary-grid">
                  <SummaryMetric label="Oluşturulan öğrenci" value={importResult.created_students} />
                  <SummaryMetric label="Oluşturulan veli" value={importResult.created_guardians} />
                  <SummaryMetric label="Oluşturulan telefon" value={importResult.created_phones} />
                  <SummaryMetric label="Oluşturulan hatırlatma" value={importResult.created_reminders} />
                  <SummaryMetric label="Kaydedilen içe aktarma logu" value={importResult.saved_import_logs} />
                  <SummaryMetric label="Atlanan satır" value={importResult.skipped_rows} />
                </div>
                <p>İçe aktarma öncesi güvenlik yedeği oluşturuldu ve indirilebilir hale getirildi.</p>
                <Button type="button" variant="secondary" onClick={() => navigate("/students")}>
                  Aday Listesine Git
                </Button>
              </section>
            ) : null}
          </section>
        </>
      )}
    </div>
  );
}

function isPriorityColumnMatch(
  match: ColumnMatch,
  manualMappings: Record<number, ImportFieldKey | "ignore" | "">
) {
  const manualMapping = manualMappings[match.source_index];

  return (
    match.status === "mapping_required" ||
    match.status === "manual" ||
    match.status === "auto_fixed" ||
    Boolean(manualMapping) ||
    match.target_field === "student_full_name"
  );
}

function getInitialVisibleColumnMatches(
  matches: ColumnMatch[],
  manualMappings: Record<number, ImportFieldKey | "ignore" | "">
) {
  if (matches.length <= INITIAL_VISIBLE_COLUMN_MATCHES) {
    return matches;
  }

  const visibleIndexes = new Set<number>();

  for (const match of matches) {
    if (isPriorityColumnMatch(match, manualMappings)) {
      visibleIndexes.add(match.source_index);
    }
  }

  for (const match of matches) {
    if (visibleIndexes.size >= INITIAL_VISIBLE_COLUMN_MATCHES) {
      break;
    }

    if (match.status !== "ignored") {
      visibleIndexes.add(match.source_index);
    }
  }

  for (const match of matches) {
    if (visibleIndexes.size >= INITIAL_VISIBLE_COLUMN_MATCHES) {
      break;
    }

    visibleIndexes.add(match.source_index);
  }

  return matches.filter((match) => visibleIndexes.has(match.source_index));
}

function createSelectedMappingOwners(
  matches: ColumnMatch[],
  manualMappings: Record<number, ImportFieldKey | "ignore" | "">
) {
  const owners = new Map<ImportFieldKey, number>();

  for (const match of matches) {
    const selectedField = manualMappings[match.source_index] ?? match.target_field;

    if (!selectedField || selectedField === "ignore" || owners.has(selectedField)) {
      continue;
    }

    owners.set(selectedField, match.source_index);
  }

  return owners;
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

function CollapsibleLogGroup({
  title,
  logs,
  visibleCount,
  onVisibleCountChange
}: {
  title: string;
  logs: ImportSimulationSummary["logs"];
  visibleCount: number;
  onVisibleCountChange: (nextVisibleCount: number) => void;
}) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const boundedVisibleCount = Math.min(visibleCount, logs.length);
  const visibleLogs = logs.slice(0, boundedVisibleCount);
  const isFullyVisible = boundedVisibleCount >= logs.length;
  const nextVisibleCount = getNextImportMessageVisibleCount(boundedVisibleCount, logs.length);
  const nextHiddenLogCount = Math.max(nextVisibleCount - boundedVisibleCount, 0);
  const shouldShowToggle = logs.length > INITIAL_VISIBLE_IMPORT_MESSAGES;

  return (
    <section className="log-group" ref={sectionRef}>
      <h3>
        {title} ({logs.length})
      </h3>
      {visibleLogs.length ? (
        <ul className="log-list">
          {visibleLogs.map((log, index) => (
            <li key={`${title}-${log.message}-${index}`} data-severity={log.severity}>
              <strong>{log.row_number ? `Satır ${log.row_number}: ` : ""}</strong>
              {log.message}
              {log.suggested_action ? (
                <small>Önerilen işlem: {formatLogSuggestedAction(log.suggested_action)}</small>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p>Bu grupta kayıt yok.</p>
      )}
      {shouldShowToggle ? (
        <div className="toolbar">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              if (isFullyVisible) {
                onVisibleCountChange(INITIAL_VISIBLE_IMPORT_MESSAGES);
                scrollToImportSection(sectionRef.current);
                return;
              }

              onVisibleCountChange(nextVisibleCount);
            }}
          >
            {isFullyVisible ? "Daha az göster" : `+${nextHiddenLogCount} daha fazla göster`}
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function scrollToImportSection(section: HTMLElement | null) {
  section?.scrollIntoView?.({ behavior: "smooth", block: "start" });
}

function getNextImportMessageVisibleCount(currentVisibleCount: number, totalCount: number) {
  for (const step of IMPORT_MESSAGE_EXPANSION_STEPS) {
    if (step > currentVisibleCount) {
      return Math.min(step, totalCount);
    }
  }

  return totalCount;
}

function formatLogSuggestedAction(suggestedAction: string) {
  return suggestedAction.replace("Detayları göster bölümünden", "Aynı listedeki");
}

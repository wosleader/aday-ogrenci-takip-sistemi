import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { Check, ChevronsRight, Phone, Trash2, X } from "lucide-react";
import type { AppOutletContext } from "../../app/AppLayout";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { CALL_RESULTS, LIFE_CYCLE_STATUSES } from "../../domain/constants/statuses";
import { deleteStudentWithRelations } from "./services/studentDelete";
import {
  filterStudentListRows,
  readStudentListRows,
  type StudentListFilter,
  type StudentListRow
} from "./services/studentListReader";
import { markPhoneAsContacted, markPhoneAsInvalid } from "./services/studentPhoneStatus";

const PAGE_SIZE = 100;

const FILTER_OPTIONS: Array<{ key: StudentListFilter; label: string }> = [
  { key: "all", label: "Tümü" },
  { key: "missing_phone", label: "Telefon bilgisi eksik" },
  { key: "has_reminder", label: "Tekrar aranacak" },
  { key: "duplicate_phone", label: "Mükerrer telefon" },
  { key: "not_called", label: "Aranmamış" },
  { key: "has_note", label: "Notu olanlar" }
];

function useDebouncedValue(value: string, delayMs = 180): string {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delayMs);

    return () => window.clearTimeout(timeoutId);
  }, [delayMs, value]);

  return debouncedValue;
}

function formatShortDateTime(value?: string | null): string {
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
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function statusLabel(row: StudentListRow): string {
  return (
    CALL_RESULTS[row.last_call_result as keyof typeof CALL_RESULTS] ??
    LIFE_CYCLE_STATUSES[row.lifecycle_status as keyof typeof LIFE_CYCLE_STATUSES] ??
    row.lifecycle_status
  );
}

function statusClass(row: StudentListRow): string {
  if (row.last_call_result === "reached" || row.last_call_result === "registered") {
    return "s-green";
  }

  if (row.last_call_result === "not_reached" || row.last_call_result === "wrong_number") {
    return "s-red";
  }

  if (row.has_reminder || row.last_call_result === "call_later" || row.last_call_result === "appointment") {
    return "s-amber";
  }

  return "s-gray";
}

function phoneMark(isContacted: boolean, isWrong: boolean): string {
  if (isWrong) {
    return "x";
  }

  return isContacted ? "✓" : "";
}

function compactPhone(value?: string | null): string {
  if (!value) {
    return "-";
  }

  return value;
}

function notePreview(note?: string | null, emptyText = "-"): string {
  if (!note?.trim()) {
    return emptyText;
  }

  return note.length > 72 ? `${note.slice(0, 72)}...` : note;
}

function drawerNotePreview(note?: string | null): string {
  if (!note?.trim()) {
    return "Henüz açıklama/geçmiş yok.";
  }

  return note;
}

function maskPhoneForGroup(value: string): string {
  if (value.length < 8) {
    return value;
  }

  return `${value.slice(0, 4)}****${value.slice(-3)}`;
}

function PhoneCell({
  value,
  isContacted,
  isWrong
}: {
  value?: string | null;
  isContacted: boolean;
  isWrong: boolean;
}) {
  const mark = phoneMark(isContacted, isWrong);

  return (
    <span className="phone-cell" title={value || undefined}>
      <span className="phone-cell-number">{compactPhone(value)}</span>
      {mark ? (
        <span className={`phone-cell-mark ${isWrong ? "invalid" : "contacted"}`} title={isWrong ? "Yanlış numara / kullanılmıyor" : "Son görüşülen / iletişim kurulan numara"}>
          {mark}
        </span>
      ) : null}
    </span>
  );
}

function rowClassName(row: StudentListRow, selectedStudentId: number | null): string {
  return row.student_id === selectedStudentId ? "active-row" : "";
}

function getPageCount(totalRows: number): number {
  return Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
}

function sortDuplicateRows(rows: StudentListRow[]): StudentListRow[] {
  return [...rows].sort(
    (left, right) =>
      (left.duplicate_group_key ?? "").localeCompare(right.duplicate_group_key ?? "") ||
      left.student_full_name.localeCompare(right.student_full_name, "tr")
  );
}

type PhoneCardProps = {
  label: string;
  phoneId?: number | null;
  value?: string | null;
  isContacted: boolean;
  isWrong: boolean;
  onContacted: (phoneId: number) => void;
  onInvalid: (phoneId: number) => void;
};

function PhoneCard({ label, phoneId, value, isContacted, isWrong, onContacted, onInvalid }: PhoneCardProps) {
  return (
    <div className={`drawer-phone-card ${isContacted ? "contacted" : ""} ${isWrong ? "invalid" : ""}`}>
      <div>
        <span className="form-label">{label}</span>
        <strong>{value || "Telefon yok"}</strong>
        <small>
          {isContacted ? "Son görüşülen / iletişim kurulan numara" : null}
          {isWrong ? "Yanlış numara / kullanılmıyor" : null}
          {!isContacted && !isWrong ? "Aktif numara" : null}
        </small>
      </div>
      <div className="phone-actions">
        <button
          aria-label="Son görüşülen numara olarak işaretle"
          className={isContacted ? "active" : ""}
          disabled={!phoneId || isWrong}
          onClick={() => phoneId && onContacted(phoneId)}
          title="Son görüşülen / iletişim kurulan numara"
          type="button"
        >
          <Check aria-hidden="true" size={14} />
        </button>
        <button
          aria-label="Yanlış numara veya kullanılmıyor olarak işaretle"
          className={isWrong ? "active invalid" : ""}
          disabled={!phoneId}
          onClick={() => phoneId && onInvalid(phoneId)}
          title="Yanlış numara / kullanılmıyor"
          type="button"
        >
          x
        </button>
      </div>
    </div>
  );
}

export function StudentsPage() {
  const navigate = useNavigate();
  const { globalSearch } = useOutletContext<AppOutletContext>();
  const debouncedQuery = useDebouncedValue(globalSearch);
  const [activeFilter, setActiveFilter] = useState<StudentListFilter>("all");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const rows = useLiveQuery(
    async () => {
      try {
        setLoadError(null);
        return await readStudentListRows();
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Aday listesi okunamadı.");
        return [];
      }
    },
    [],
    undefined
  );
  const campaignOptions = useMemo(() => {
    const names = new Set((rows ?? []).map((row) => row.campaign_name || "Diğer"));
    return ["all", ...Array.from(names).sort((left, right) => left.localeCompare(right, "tr"))];
  }, [rows]);
  const filteredRows = useMemo(() => {
    const bySearchAndStatus = filterStudentListRows(rows ?? [], debouncedQuery, activeFilter);
    const byCampaign =
      campaignFilter === "all"
        ? bySearchAndStatus
        : bySearchAndStatus.filter((row) => (row.campaign_name || "Diğer") === campaignFilter);

    return activeFilter === "duplicate_phone" ? sortDuplicateRows(byCampaign) : byCampaign;
  }, [activeFilter, campaignFilter, debouncedQuery, rows]);
  const duplicateGroupCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const row of filteredRows) {
      if (row.duplicate_group_key) {
        counts.set(row.duplicate_group_key, (counts.get(row.duplicate_group_key) ?? 0) + 1);
      }
    }

    return counts;
  }, [filteredRows]);
  const pageCount = getPageCount(filteredRows.length);
  const visibleRows = useMemo(() => {
    const safePage = Math.min(currentPage, pageCount);
    const startIndex = (safePage - 1) * PAGE_SIZE;
    return filteredRows.slice(startIndex, startIndex + PAGE_SIZE);
  }, [currentPage, filteredRows, pageCount]);
  const selectedRow = useMemo(() => {
    if (!isDrawerOpen) {
      return null;
    }

    return (rows ?? []).find((row) => row.student_id === selectedStudentId) ?? visibleRows[0] ?? null;
  }, [isDrawerOpen, rows, selectedStudentId, visibleRows]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, campaignFilter, debouncedQuery]);

  useEffect(() => {
    if (!selectedStudentId && visibleRows[0]) {
      setSelectedStudentId(visibleRows[0].student_id);
    }
  }, [selectedStudentId, visibleRows]);

  async function updatePhoneStatus(action: "contacted" | "invalid", phoneId: number) {
    try {
      setActionMessage(null);

      if (action === "contacted") {
        const result = await markPhoneAsContacted(phoneId);
        setActionMessage(
          result.phone_status === "contacted"
            ? "Telefon görüşülen numara olarak işaretlendi."
            : "Görüşülen numara işareti kaldırıldı."
        );
      } else {
        const result = await markPhoneAsInvalid(phoneId);
        setActionMessage(
          result.phone_status === "invalid"
            ? "Telefon yanlış numara / kullanılmıyor olarak işaretlendi."
            : "Yanlış numara / kullanılmıyor işareti kaldırıldı."
        );
      }
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Telefon durumu güncellenemedi.");
    }
  }

  async function deleteSelectedStudent(row: StudentListRow) {
    const confirmation = window.prompt(
      `${row.student_full_name} adayını ve ilişkili kayıtlarını silmek için ADAYI SİL yazın.`
    );

    if (confirmation !== "ADAYI SİL") {
      return;
    }

    try {
      const result = await deleteStudentWithRelations(row.student_id);
      setSelectedStudentId(null);
      setActionMessage(
        `${result.deleted_students} aday, ${result.deleted_guardians} veli, ${result.deleted_phones} telefon ve ${result.deleted_reminders} hatırlatma silindi.`
      );
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Aday silinemedi.");
    }
  }

  function openStudentDrawer(studentId?: number) {
    if (studentId) {
      setSelectedStudentId(studentId);
    } else if (!selectedStudentId && visibleRows[0]) {
      setSelectedStudentId(visibleRows[0].student_id);
    }

    setIsDrawerOpen(true);
  }

  if (rows === undefined) {
    return (
      <div className="students-workbench">
        <section className="panel">
          <h2>Adaylar yükleniyor</h2>
          <p>Yerel veritabanındaki aday kayıtları hazırlanıyor.</p>
        </section>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="page">
        <EmptyState
          title="Henüz aday yok"
          description="Henüz aday yok. Excel içe aktar ekranından veri ekleyin."
          action={
            <Button type="button" onClick={() => navigate("/import")}>
              Excel İçe Aktar
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className={`students-workbench ${isDrawerOpen ? "" : "drawer-collapsed"}`}>
      <section className="student-main">
        <div className="student-toolbar">
          <div className="toolbar-left">
            <h2>Aday Listesi</h2>
            <span className="count-badge">{filteredRows.length} aday</span>
          </div>
          <div className="student-filters">
            <label className="campaign-filter">
              <span>Kampanya</span>
              <select value={campaignFilter} onChange={(event) => setCampaignFilter(event.target.value)}>
                {campaignOptions.map((campaignName) => (
                  <option key={campaignName} value={campaignName}>
                    {campaignName === "all" ? "Tüm kampanyalar" : campaignName}
                  </option>
                ))}
              </select>
            </label>
            {FILTER_OPTIONS.map((filter) => (
              <button
                className={`filter-btn ${activeFilter === filter.key ? "active" : ""}`}
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {loadError ? <p className="error-text">{loadError}</p> : null}
        {actionMessage ? <p className="student-action-message">{actionMessage}</p> : null}

        <div className="student-table-wrap">
          <table className="student-table">
            <thead>
              <tr>
                <th>Sınıf</th>
                <th>Öğrenci</th>
                <th>Veli</th>
                <th>Telefon 1</th>
                <th>Telefon 2</th>
                <th>Durum</th>
                <th>Açıklama / Not</th>
                <th>Sonraki adım</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, index) => {
                const previousRow = visibleRows[index - 1];
                const duplicateGroupKey = row.duplicate_group_key ?? "";
                const shouldShowDuplicateHeader =
                  activeFilter === "duplicate_phone" &&
                  duplicateGroupKey &&
                  duplicateGroupKey !== previousRow?.duplicate_group_key;

                return (
                  <Fragment key={row.student_id}>
                    {shouldShowDuplicateHeader ? (
                      <tr className="duplicate-group-row" key={`group-${duplicateGroupKey}`}>
                        <td colSpan={8}>
                          Mükerrer telefon: {maskPhoneForGroup(duplicateGroupKey)} ·{" "}
                          {duplicateGroupCounts.get(duplicateGroupKey) ?? 0} kayıt
                        </td>
                      </tr>
                    ) : null}
                    <tr
                      className={rowClassName(row, selectedStudentId)}
                      key={row.student_id}
                      onClick={() => openStudentDrawer(row.student_id)}
                    >
                      <td className="td-class">{row.current_class || "-"}</td>
                      <td title={row.student_full_name}>
                        <strong className="td-name">{row.student_full_name}</strong>
                        <div className="row-flags">
                          {row.has_missing_phone ? <span>Telefon yok</span> : null}
                          {row.has_duplicate_phone ? <span>Mükerrer</span> : null}
                        </div>
                      </td>
                      <td className="td-hint" title={row.guardian_full_name || undefined}>
                        {row.guardian_full_name || "-"}
                      </td>
                      <td className={`td-phone ${row.phone_1_is_wrong ? "phone-invalid" : ""}`}>
                        <PhoneCell
                          value={row.phone_1}
                          isContacted={row.phone_1_is_contacted}
                          isWrong={row.phone_1_is_wrong}
                        />
                      </td>
                      <td className={`td-phone ${row.phone_2_is_wrong ? "phone-invalid" : ""}`}>
                        <PhoneCell
                          value={row.phone_2}
                          isContacted={row.phone_2_is_contacted}
                          isWrong={row.phone_2_is_wrong}
                        />
                      </td>
                      <td>
                        <span className={`status ${statusClass(row)}`}>{statusLabel(row)}</span>
                      </td>
                      <td className="td-note" title={row.general_note || undefined}>
                        <span>{notePreview(row.general_note)}</span>
                        {row.note_count > 0 ? <em>[{row.note_count}]</em> : null}
                      </td>
                      <td className="td-next">{row.has_reminder ? `↻ ${formatShortDateTime(row.next_reminder_at)}` : "-"}</td>
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="student-kbdbar">
          <span>
            <kbd>N</kbd> Sıradaki
          </span>
          <span>
            <kbd>1</kbd> Ulaşılamadı
          </span>
          <span>
            <kbd>2</kbd> Görüşüldü
          </span>
          <span>
            <kbd>4</kbd> Sonra aranacak
          </span>
          <span>
            <kbd>7</kbd> Yanlış numara
          </span>
          <span>
            <kbd>F</kbd> Ara
          </span>
        </div>

        <div className="student-statusbar">
          <span>IndexedDB · {rows.length} aday</span>
          <span>{PAGE_SIZE} kayıt/sayfa</span>
          <span>Sayfa {Math.min(currentPage, pageCount)} / {pageCount}</span>
          <span>Çevrimdışı mod</span>
          <div className="pagination-controls">
            <button disabled={currentPage <= 1} onClick={() => setCurrentPage((page) => page - 1)} type="button">
              Önceki
            </button>
            <span>
              {Math.min(currentPage, pageCount)} / {pageCount}
            </span>
            <button
              disabled={currentPage >= pageCount}
              onClick={() => setCurrentPage((page) => page + 1)}
              type="button"
            >
              Sonraki
            </button>
          </div>
        </div>
      </section>

      {isDrawerOpen ? (
        <aside className="student-drawer">
        {selectedRow ? (
          <>
            <div className="drawer-header">
              <div className="drawer-header-top">
                <div>
                  <div className="drawer-name">{selectedRow.student_full_name}</div>
                  <div className="drawer-class">
                    Sınıf: {selectedRow.current_class || "-"} · {selectedRow.student_group}
                  </div>
                </div>
                <button className="close-btn" onClick={() => setIsDrawerOpen(false)} title="Kişi kartını kapat" type="button">
                  <X aria-hidden="true" size={15} />
                </button>
              </div>
              <div className="contact-card">
                <div className="veli-label">Veli</div>
                <div className="veli-row">
                  <div className="veli-name">{selectedRow.guardian_full_name || "-"}</div>
                  <span className={`status ${statusClass(selectedRow)}`}>{statusLabel(selectedRow)}</span>
                </div>
                <div className="drawer-campaign">{selectedRow.campaign_name || "Diğer"}</div>
              </div>
            </div>

            <div className="drawer-body">
              <PhoneCard
                label="Telefon 1"
                phoneId={selectedRow.phone_1_id}
                value={selectedRow.phone_1}
                isContacted={selectedRow.phone_1_is_contacted}
                isWrong={selectedRow.phone_1_is_wrong}
                onContacted={(phoneId) => void updatePhoneStatus("contacted", phoneId)}
                onInvalid={(phoneId) => void updatePhoneStatus("invalid", phoneId)}
              />
              <PhoneCard
                label="Telefon 2"
                phoneId={selectedRow.phone_2_id}
                value={selectedRow.phone_2}
                isContacted={selectedRow.phone_2_is_contacted}
                isWrong={selectedRow.phone_2_is_wrong}
                onContacted={(phoneId) => void updatePhoneStatus("contacted", phoneId)}
                onInvalid={(phoneId) => void updatePhoneStatus("invalid", phoneId)}
              />

              <div>
                <label className="form-label">Görüşme durumu</label>
                <select defaultValue={selectedRow.last_call_result}>
                  {Object.entries(CALL_RESULTS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Açıklama / not</label>
                <textarea key={`note-${selectedRow.student_id}`} placeholder="Yeni görüşme notu yazın..." />
              </div>

              <div>
                <label className="form-label">Tekrar arama</label>
                <div className="row2">
                  <input type="date" />
                  <input type="time" defaultValue="11:00" />
                </div>
              </div>

              <button className="save-btn" disabled type="button">
                <ChevronsRight aria-hidden="true" size={16} />
                Kaydet ve sonrakine geç
                <span className="kbd-hint">Sprint 5</span>
              </button>

              <div className="drawer-actions">
                <Button disabled title="Arama ekranı Sprint 5'te aktif olacak" type="button" variant="secondary">
                  <Phone aria-hidden="true" size={16} />
                  Arama ekranı Sprint 5'te aktif olacak
                </Button>
                <Button type="button" variant="secondary" onClick={() => void deleteSelectedStudent(selectedRow)}>
                  <Trash2 aria-hidden="true" size={16} />
                  Adayı sil
                </Button>
              </div>

              <div className="timeline-section">
                <div className="timeline-title">İletişim geçmişi</div>
                {selectedRow.general_note?.trim() ? (
                  <div className="tl-item">
                    <div className="tl-dot amber" />
                    <div>
                      <div className="tl-date">Excel'den aktarılan not</div>
                      <div className="tl-text">{drawerNotePreview(selectedRow.general_note)}</div>
                      <div className="tl-author">
                        Sistem / Import
                        {selectedRow.source_row_number ? ` · Kaynak satır: ${selectedRow.source_row_number}` : ""}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="drawer-empty-state">Henüz açıklama/geçmiş yok.</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="drawer-empty">Detayları görmek için listeden bir aday seçin.</div>
        )}
        </aside>
      ) : (
        <aside className="student-drawer-rail" onClick={() => openStudentDrawer()} title="Aday detayını aç">
          <button aria-label="Aday detayını aç" className="drawer-reopen" type="button">
            ›
          </button>
        </aside>
      )}
    </div>
  );
}

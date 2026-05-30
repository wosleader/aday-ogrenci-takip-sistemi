import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { Bell, Check, ChevronsRight, Copy, MoreVertical, Trash2, X } from "lucide-react";
import type { AppOutletContext } from "../../app/AppLayout";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { CALL_RESULTS, LIFE_CYCLE_STATUSES, type CallResult } from "../../domain/constants/statuses";
import { readCallHistoryForStudent } from "../calls/services/callHistoryReader";
import { writeCallLog } from "../calls/services/callLogWriter";
import { validateCallSave } from "../calls/services/callSaveValidation";
import { saveFilteredExportSnapshot } from "../exports/services/exportSelection";
import {
  createReminderPopupModel,
  dismissReminderAlert,
  readDueReminderAlerts,
  type DueReminderAlert
} from "../reminders/services/reminderAlarmReader";
import {
  persistDismissedReminderAlert,
  persistDismissedReminderAlerts,
  readPersistedDismissedReminderKeys,
  writePersistedDismissedReminderKeys
} from "../reminders/services/reminderDismissalStore";
import { readReminderNotificationSettings } from "../reminders/services/reminderSettings";
import {
  createReminderPopupViewModel,
  DISMISS_FOLLOWING_REMINDERS_LABEL
} from "../reminders/services/reminderPopupViewModel";
import {
  getShortcutBarItems,
  getDefaultOperationShortcuts,
  resolveShortcutAction,
  type ShortcutBarItem,
  type ShortcutActionKey
} from "../shortcuts/services/shortcutRegistry";
import { readActiveOperationShortcuts } from "../shortcuts/services/shortcutSettings";
import { deleteStudentWithRelations } from "./services/studentDelete";
import {
  ALL_STUDENT_GROUPS_FILTER,
  createStudentListNoteSummary,
  createStudentGroupFilterOptions,
  filterRowsByStudentGroup,
  filterStudentListRows,
  getStudentGroupFilterLabel,
  readStudentListRows,
  type StudentGroupFilterValue,
  type StudentListFilter,
  type StudentListPhoneRow,
  type StudentListRow
} from "./services/studentListReader";
import { markPhoneAsContacted, markPhoneAsInvalid } from "./services/studentPhoneStatus";

const PAGE_SIZE = 100;
const SHORTCUT_HELP_STORAGE_KEY = "aots-shortcut-help-expanded";

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

function formatCallHistoryPhoneContext(label?: string | null, number?: string | null): string | null {
  const trimmedLabel = label?.trim();
  const trimmedNumber = number?.trim();

  if (trimmedLabel && trimmedNumber) {
    return `${trimmedLabel}: ${trimmedNumber}`;
  }

  return trimmedLabel || trimmedNumber || null;
}

function drawerNotePreview(note?: string | null): string {
  if (!note?.trim()) {
    return "Henüz açıklama/geçmiş yok.";
  }

  return note;
}

function toDateInputValue(value?: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function toTimeInputValue(value?: string | null): string {
  if (!value) {
    return "11:00";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "11:00";
  }

  return date.toTimeString().slice(0, 5);
}

function mergeReminderDateTime(dateValue: string, timeValue: string): string | null {
  if (!dateValue) {
    return null;
  }

  return new Date(`${dateValue}T${timeValue || "11:00"}:00`).toISOString();
}

function playReminderChime() {
  try {
    const audioWindow = window as Window &
      typeof globalThis & { webkitAudioContext?: typeof AudioContext };
    const AudioContextClass = audioWindow.AudioContext || audioWindow.webkitAudioContext;

    if (!AudioContextClass) {
      return;
    }

    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(660, context.currentTime);
    oscillator.frequency.setValueAtTime(880, context.currentTime + 0.12);
    gain.gain.setValueAtTime(0.001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.35);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.38);
  } catch (error) {
    console.debug("Reminder chime could not play.", error);
  }
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
  isWrong,
  centerEmpty = false
}: {
  value?: string | null;
  isContacted: boolean;
  isWrong: boolean;
  centerEmpty?: boolean;
}) {
  const mark = phoneMark(isContacted, isWrong);
  const isEmpty = centerEmpty && !value?.trim();

  return (
    <span className={`phone-cell ${isEmpty ? "empty-value" : ""}`} title={value || undefined}>
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
  isReadOnly?: boolean;
  statusText?: string | null;
  isSelectedForCall?: boolean;
  onContacted?: (phoneId: number) => void;
  onInvalid?: (phoneId: number) => void;
  onSelectForCall?: (phoneId: number) => void;
};

type OperationToast = {
  id: number;
  message: string;
  type: "success" | "warning" | "error";
};

type ShortcutHelpGroup = {
  title: string;
  itemIds: string[];
};

const SHORTCUT_HELP_GROUPS: ShortcutHelpGroup[] = [
  { title: "Gezinme", itemIds: ["candidate_navigation"] },
  { title: "Arama / Telefon", itemIds: ["focus_search", "mark_phone_1_contacted", "mark_phone_2_contacted"] },
  {
    title: "Sonuç",
    itemIds: ["call_reached", "call_not_reached", "call_wrong_number", "call_appointment", "call_do_not_call"]
  },
  { title: "Kaydet", itemIds: ["save_call"] }
];

function readShortcutHelpExpandedPreference(): boolean {
  try {
    return window.localStorage.getItem(SHORTCUT_HELP_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function writeShortcutHelpExpandedPreference(isExpanded: boolean): void {
  try {
    window.localStorage.setItem(SHORTCUT_HELP_STORAGE_KEY, String(isExpanded));
  } catch {
    // The help bar still works with component state when storage is unavailable.
  }
}

function getCompactShortcutItems(items: ShortcutBarItem[]): ShortcutBarItem[] {
  return ["focus_search", "save_call"]
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is ShortcutBarItem => Boolean(item));
}

function createShortcutHelpGroups(items: ShortcutBarItem[]): Array<{ title: string; items: ShortcutBarItem[] }> {
  const usedIds = new Set<string>();
  const groups = SHORTCUT_HELP_GROUPS.map((group) => {
    const groupItems = group.itemIds
      .map((id) => items.find((item) => item.id === id))
      .filter((item): item is ShortcutBarItem => Boolean(item));

    for (const item of groupItems) {
      usedIds.add(item.id);
    }

    return { title: group.title, items: groupItems };
  }).filter((group) => group.items.length > 0);
  const otherItems = items.filter((item) => !usedIds.has(item.id));

  return otherItems.length > 0 ? [...groups, { title: "Diğer", items: otherItems }] : groups;
}

function PhoneCard({
  label,
  phoneId,
  value,
  isContacted,
  isWrong,
  isReadOnly = false,
  statusText,
  isSelectedForCall = false,
  onContacted,
  onInvalid,
  onSelectForCall
}: PhoneCardProps) {
  const isEffectiveContacted = isContacted || isSelectedForCall;
  const effectiveStatusText = isSelectedForCall ? undefined : statusText;
  const displayStatusText =
    effectiveStatusText ??
    (isEffectiveContacted
      ? "Son görüşülen / iletişim kurulan numara"
      : isWrong
        ? "Yanlış numara / kullanılmıyor"
        : null);
  const [isCopied, setIsCopied] = useState(false);
  const [isCopyControlVisible, setIsCopyControlVisible] = useState(false);
  const hideCopyControlTimeoutRef = useRef<number | null>(null);
  const copySuccessTimeoutRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (hideCopyControlTimeoutRef.current != null) {
        window.clearTimeout(hideCopyControlTimeoutRef.current);
      }

      if (copySuccessTimeoutRef.current != null) {
        window.clearTimeout(copySuccessTimeoutRef.current);
      }
    },
    []
  );

  function clearCopyControlHideTimeout() {
    if (hideCopyControlTimeoutRef.current == null) {
      return;
    }

    window.clearTimeout(hideCopyControlTimeoutRef.current);
    hideCopyControlTimeoutRef.current = null;
  }

  function clearCopySuccessTimeout() {
    if (copySuccessTimeoutRef.current == null) {
      return;
    }

    window.clearTimeout(copySuccessTimeoutRef.current);
    copySuccessTimeoutRef.current = null;
  }

  function finishCopySuccessCycle() {
    setIsCopied(false);
    setIsCopyControlVisible(false);
    copySuccessTimeoutRef.current = null;
  }

  function showCopyControl() {
    clearCopyControlHideTimeout();
    if (!isCopied) {
      clearCopySuccessTimeout();
    }
    setIsCopyControlVisible(true);
  }

  function scheduleCopyControlHide() {
    clearCopyControlHideTimeout();
    hideCopyControlTimeoutRef.current = window.setTimeout(() => {
      setIsCopyControlVisible(false);
      hideCopyControlTimeoutRef.current = null;
    }, 200);
  }

  async function copyPhoneNumber() {
    if (!value) {
      return;
    }

    try {
      const clipboard = navigator.clipboard;
      if (typeof clipboard?.writeText !== "function") {
        return;
      }

      await clipboard.writeText(value);
      clearCopyControlHideTimeout();
      clearCopySuccessTimeout();
      setIsCopyControlVisible(true);
      setIsCopied(true);
      copySuccessTimeoutRef.current = window.setTimeout(finishCopySuccessCycle, 200);
    } catch {
      clearCopySuccessTimeout();
      setIsCopied(false);
    }
  }

  return (
    <div className={`drawer-phone-card ${isEffectiveContacted ? "contacted" : ""} ${isWrong ? "invalid" : ""}`}>
      <div>
        <span className="form-label">{label}</span>
        <strong>
          {value ? (
            <span
              onBlur={(event) => {
                const nextTarget = event.relatedTarget;
                if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
                  return;
                }

                scheduleCopyControlHide();
              }}
              onFocus={showCopyControl}
              onMouseEnter={showCopyControl}
              onMouseLeave={scheduleCopyControlHide}
              style={{ alignItems: "center", display: "inline-flex", gap: 4, lineHeight: 1.2 }}
              tabIndex={0}
            >
              <span style={{ userSelect: "text" }}>{value}</span>
              <span
                aria-hidden={!isCopyControlVisible}
                style={{
                  alignItems: "center",
                  display: "inline-flex",
                  flex: "0 0 18px",
                  height: 18,
                  justifyContent: "center",
                  visibility: isCopyControlVisible ? "visible" : "hidden",
                  width: 18
                }}
              >
                <button
                  aria-label="Telefon numarasını kopyala"
                  onClick={(event) => {
                    event.stopPropagation();
                    void copyPhoneNumber();
                  }}
                  onFocus={showCopyControl}
                  style={{
                    alignItems: "center",
                    background: "transparent",
                    border: "0",
                    color: "currentColor",
                    cursor: "pointer",
                    display: "inline-flex",
                    height: 18,
                    justifyContent: "center",
                    lineHeight: 1,
                    opacity: isCopied ? 1 : 0.7,
                    padding: 0,
                    width: 18
                  }}
                  title={isCopied ? "Kopyalandı" : "Telefon numarasını kopyala"}
                  type="button"
                >
                  {isCopied ? <Check aria-hidden="true" size={11} /> : <Copy aria-hidden="true" size={11} />}
                </button>
              </span>
            </span>
          ) : (
            "Telefon yok"
          )}
        </strong>
        {displayStatusText ? <small>{displayStatusText}</small> : null}
      </div>
      {!isReadOnly && onContacted && onInvalid ? (
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
      ) : null}
      {isReadOnly && onSelectForCall && onInvalid ? (
        <div className="phone-actions">
          <button
            aria-label={isEffectiveContacted ? "Görüşmede kullanılacak" : "Bu numarayla görüşüldü"}
            aria-pressed={isEffectiveContacted}
            className={isEffectiveContacted ? "active" : ""}
            disabled={!phoneId || isWrong}
            onClick={() => phoneId && onSelectForCall(phoneId)}
            title={isEffectiveContacted ? "Görüşmede kullanılacak" : "Bu numarayla görüşüldü"}
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
      ) : null}
    </div>
  );
}

function isLegacyDrawerPhone(row: StudentListRow, phone: StudentListPhoneRow): boolean {
  return Boolean(
    (phone.id != null && (phone.id === row.phone_1_id || phone.id === row.phone_2_id)) ||
      phone.phone_number === row.phone_1 ||
      phone.phone_number === row.phone_2
  );
}

function getReadonlyDrawerPhones(row: StudentListRow, isExpanded: boolean): StudentListPhoneRow[] {
  const sourcePhones = isExpanded ? row.phones : row.visible_phones;

  return sourcePhones.filter((phone) => !isLegacyDrawerPhone(row, phone));
}

function getReadonlyPhoneStatusText(phone: StudentListPhoneRow): string | null {
  if (!phone.is_valid) {
    return "Geçersiz format";
  }

  if (phone.phone_status === "invalid" || phone.is_wrong) {
    return "Yanlış numara / kullanılmıyor";
  }

  if (phone.phone_status === "contacted") {
    return "Son görüşülen / iletişim kurulan numara";
  }

  return null;
}

function getLegacyContactedPhoneId(row: StudentListRow): number | null {
  if (row.phone_1_is_contacted) {
    return row.phone_1_id ?? null;
  }

  if (row.phone_2_is_contacted) {
    return row.phone_2_id ?? null;
  }

  return null;
}

function createCallSaveValidationPhones(row: StudentListRow) {
  if (row.phones.length > 0) {
    return row.phones.map((phone) => ({
      id: phone.id,
      phone_status: phone.phone_status,
      is_wrong: phone.is_wrong || !phone.is_valid
    }));
  }

  return [
    {
      id: row.phone_1_id,
      phone_status: row.phone_1_status,
      is_wrong: row.phone_1_is_wrong
    },
    {
      id: row.phone_2_id,
      phone_status: row.phone_2_status,
      is_wrong: row.phone_2_is_wrong
    }
  ];
}

export function StudentsPage() {
  const navigate = useNavigate();
  const {
    globalSearch,
    focusGlobalSearch,
    pendingOpenStudentId,
    consumePendingOpenStudentId,
    pendingSearchListRequestId,
    consumePendingSearchListRequest
  } =
    useOutletContext<AppOutletContext>();
  const debouncedQuery = useDebouncedValue(globalSearch);
  const [activeFilter, setActiveFilter] = useState<StudentListFilter>("all");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [studentGroupFilter, setStudentGroupFilter] = useState<StudentGroupFilterValue>(ALL_STUDENT_GROUPS_FILTER);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [isExtraPhonesExpanded, setIsExtraPhonesExpanded] = useState(false);
  const [selectedCallPhoneId, setSelectedCallPhoneId] = useState<number | null>(null);
  const [isStudentActionsOpen, setIsStudentActionsOpen] = useState(false);
  const [studentDeleteCandidate, setStudentDeleteCandidate] = useState<StudentListRow | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [callResult, setCallResult] = useState<CallResult>("not_called");
  const [newNote, setNewNote] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [reminderTime, setReminderTime] = useState("11:00");
  const [isSavingCall, setIsSavingCall] = useState(false);
  const [operationToast, setOperationToast] = useState<OperationToast | null>(null);
  const [allowAppointmentWithoutNote, setAllowAppointmentWithoutNote] = useState(false);
  const [pastAppointmentConfirmCount, setPastAppointmentConfirmCount] = useState(0);
  const [dismissedReminderKeys, setDismissedReminderKeys] = useState(() => readPersistedDismissedReminderKeys());
  const [chimedReminderIds, setChimedReminderIds] = useState<number[]>([]);
  const [reminderTick, setReminderTick] = useState(() => Date.now());
  const drawerPhoneListRef = useRef<HTMLDivElement | null>(null);
  const shouldScrollPhoneListAfterCollapseRef = useRef(false);
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
  const reminderSettings = useLiveQuery(() => readReminderNotificationSettings(), [], undefined);
  const dueReminderAlerts = useLiveQuery(
    () => readDueReminderAlerts(new Date(reminderTick).toISOString()),
    [reminderTick],
    []
  );
  const campaignOptions = useMemo(() => {
    const names = new Set((rows ?? []).map((row) => row.campaign_name || "Diğer"));
    return ["all", ...Array.from(names).sort((left, right) => left.localeCompare(right, "tr"))];
  }, [rows]);
  const studentGroupOptions = useMemo(() => createStudentGroupFilterOptions(rows ?? []), [rows]);
  const classLevelOptions = useMemo(
    () => studentGroupOptions.filter((option) => option.group === "class_level"),
    [studentGroupOptions]
  );
  const classSectionOptions = useMemo(
    () => studentGroupOptions.filter((option) => option.group === "section"),
    [studentGroupOptions]
  );
  const unspecifiedClassSectionOptions = useMemo(
    () => studentGroupOptions.filter((option) => option.group === "unspecified"),
    [studentGroupOptions]
  );
  const filteredRows = useMemo(() => {
    const bySearchAndStatus = filterStudentListRows(rows ?? [], debouncedQuery, activeFilter);
    const byCampaign =
      campaignFilter === "all"
        ? bySearchAndStatus
        : bySearchAndStatus.filter((row) => (row.campaign_name || "Diğer") === campaignFilter);
    const byStudentGroup = filterRowsByStudentGroup(byCampaign, studentGroupFilter);

    return activeFilter === "duplicate_phone" ? sortDuplicateRows(byStudentGroup) : byStudentGroup;
  }, [activeFilter, campaignFilter, debouncedQuery, rows, studentGroupFilter]);
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
  const readonlyDrawerPhones = useMemo(
    () => (selectedRow ? getReadonlyDrawerPhones(selectedRow, isExtraPhonesExpanded) : []),
    [isExtraPhonesExpanded, selectedRow]
  );
  const callHistory = useLiveQuery(
    () => (selectedRow ? readCallHistoryForStudent(selectedRow.student_id) : Promise.resolve([])),
    [selectedRow?.student_id],
    []
  );
  const reminderPopup = useMemo(
    () =>
      createReminderPopupModel(
        dueReminderAlerts ?? [],
        dismissedReminderKeys,
        reminderSettings?.popup_enabled ?? true
      ),
    [dismissedReminderKeys, dueReminderAlerts, reminderSettings?.popup_enabled]
  );
  const activeReminderAlert = reminderPopup?.primaryAlert ?? null;
  const reminderPopupView = reminderPopup ? createReminderPopupViewModel(reminderPopup) : null;
  const operationShortcuts = useLiveQuery(
    () => readActiveOperationShortcuts(),
    [],
    getDefaultOperationShortcuts()
  );
  const shortcutBarItems = useMemo(() => getShortcutBarItems(operationShortcuts), [operationShortcuts]);
  const compactShortcutItems = useMemo(() => getCompactShortcutItems(shortcutBarItems), [shortcutBarItems]);
  const shortcutHelpGroups = useMemo(() => createShortcutHelpGroups(shortcutBarItems), [shortcutBarItems]);
  const [isShortcutHelpExpanded, setIsShortcutHelpExpanded] = useState(readShortcutHelpExpandedPreference);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, campaignFilter, debouncedQuery, studentGroupFilter]);

  useEffect(() => {
    saveFilteredExportSnapshot({
      student_ids: filteredRows.map((row) => row.student_id),
      filter_label: `${FILTER_OPTIONS.find((filter) => filter.key === activeFilter)?.label ?? "Tümü"} · ${
        campaignFilter === "all" ? "Tüm kampanyalar" : campaignFilter
      } · Sınıf / Şube: ${
        studentGroupFilter === ALL_STUDENT_GROUPS_FILTER
          ? "Tümü"
          : getStudentGroupFilterLabel(
              studentGroupFilter,
              studentGroupOptions.find((option) => option.value === studentGroupFilter)?.label
            )
      }`
    });
  }, [activeFilter, campaignFilter, filteredRows, studentGroupFilter, studentGroupOptions]);

  useEffect(() => {
    if (!selectedStudentId && visibleRows[0]) {
      setSelectedStudentId(visibleRows[0].student_id);
    }
  }, [selectedStudentId, visibleRows]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setReminderTick(Date.now()), 30_000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!selectedRow) {
      return;
    }

    setCallResult((selectedRow.last_call_result as CallResult) || "not_called");
    setNewNote("");
    setReminderDate(toDateInputValue(selectedRow.next_reminder_at));
    setReminderTime(toTimeInputValue(selectedRow.next_reminder_at));
    setIsExtraPhonesExpanded(false);
    setSelectedCallPhoneId(null);
    shouldScrollPhoneListAfterCollapseRef.current = false;
  }, [selectedRow?.student_id]);

  useEffect(() => {
    if (isExtraPhonesExpanded || !shouldScrollPhoneListAfterCollapseRef.current) {
      return;
    }

    shouldScrollPhoneListAfterCollapseRef.current = false;

    const phoneListElement = drawerPhoneListRef.current;
    if (typeof phoneListElement?.scrollIntoView === "function") {
      phoneListElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [isExtraPhonesExpanded]);

  useEffect(() => {
    if (!reminderPopup || !reminderSettings?.sound_enabled) {
      return;
    }

    const visibleReminderIds = reminderPopup.alerts.map((alert) => alert.reminder_id);
    const hasNewReminder = visibleReminderIds.some((reminderId) => !chimedReminderIds.includes(reminderId));

    if (hasNewReminder) {
      playReminderChime();
      setChimedReminderIds((current) => [...new Set([...current, ...visibleReminderIds])]);
    }
  }, [chimedReminderIds, reminderPopup, reminderSettings?.sound_enabled]);

  useEffect(() => {
    if (!operationToast) {
      return;
    }

    const timeoutId = window.setTimeout(
      () => setOperationToast(null),
      operationToast.type === "success" ? 2600 : 6500
    );

    return () => window.clearTimeout(timeoutId);
  }, [operationToast]);

  useEffect(() => {
    if (pendingOpenStudentId === null) {
      return;
    }

    setSelectedStudentId(pendingOpenStudentId);
    setIsDrawerOpen(true);
    consumePendingOpenStudentId();
  }, [consumePendingOpenStudentId, pendingOpenStudentId]);

  useEffect(() => {
    if (pendingSearchListRequestId === null) {
      return;
    }

    setSelectedStudentId(null);
    setIsDrawerOpen(false);
    setCurrentPage(1);
    consumePendingSearchListRequest();
  }, [consumePendingSearchListRequest, pendingSearchListRequestId]);

  useEffect(() => {
    setIsStudentActionsOpen(false);
  }, [selectedRow?.student_id]);

  useEffect(() => {
    setAllowAppointmentWithoutNote(false);
  }, [selectedRow?.student_id, callResult, newNote, reminderDate, reminderTime]);

  useEffect(() => {
    setPastAppointmentConfirmCount(0);
  }, [selectedRow?.student_id, callResult, reminderDate, reminderTime]);

  function showOperationToast(message: string, type: OperationToast["type"] = "warning") {
    setOperationToast({
      id: Date.now(),
      message,
      type
    });
  }

  useEffect(() => {
    if (!selectedStudentId) {
      return;
    }

    document.querySelector(`[data-student-row-id="${selectedStudentId}"]`)?.scrollIntoView({
      block: "nearest",
      inline: "nearest"
    });
  }, [currentPage, selectedStudentId]);

  function selectCandidateByIndex(nextIndex: number) {
    const nextRow = filteredRows[nextIndex];

    if (!nextRow) {
      return;
    }

    setSelectedStudentId(nextRow.student_id);
    setIsDrawerOpen(true);
    setCurrentPage(Math.floor(nextIndex / PAGE_SIZE) + 1);
  }

  function moveSelectedCandidate(step: number) {
    if (!filteredRows.length) {
      return;
    }

    if (newNote.trim()) {
      const message = "Kaydedilmemiş not var. Kaydetmek için Ctrl+S kullanın veya notu temizleyin.";
      setActionMessage(message);
      showOperationToast(message, "warning");
      return;
    }

    const currentIndex = Math.max(
      0,
      filteredRows.findIndex((row) => row.student_id === selectedStudentId)
    );
    const nextIndex = Math.min(Math.max(currentIndex + step, 0), filteredRows.length - 1);

    selectCandidateByIndex(nextIndex);
  }

  function setCallResultByShortcut(result: CallResult) {
    setCallResult(result);
    setActionMessage(`${CALL_RESULTS[result]} seçildi. Kaydetmek için Ctrl+S kullanın.`);
  }

  function markPhoneByShortcut(slot: "phone_1" | "phone_2") {
    if (!selectedRow) {
      return;
    }

    const phoneId = slot === "phone_1" ? selectedRow.phone_1_id : selectedRow.phone_2_id;
    const isWrong = slot === "phone_1" ? selectedRow.phone_1_is_wrong : selectedRow.phone_2_is_wrong;

    if (!phoneId) {
      const message = slot === "phone_1" ? "Telefon 1 kaydı yok." : "Telefon 2 kaydı yok.";
      setActionMessage(message);
      showOperationToast(message, "warning");
      return;
    }

    if (isWrong) {
      const message = "Yanlış numara / kullanılmıyor işaretli telefon görüşülen numara olarak seçilemez.";
      setActionMessage(message);
      showOperationToast(message, "error");
      return;
    }

    setSelectedCallPhoneId(null);
    void updatePhoneStatus("contacted", phoneId);
  }

  function toggleActivePhoneInvalidByShortcut() {
    if (!selectedRow) {
      return;
    }

    const activePhoneId = selectedRow.phone_1_is_contacted
      ? selectedRow.phone_1_id
      : selectedRow.phone_2_is_contacted
        ? selectedRow.phone_2_id
        : null;

    if (!activePhoneId) {
      const message = "Önce Telefon 1 veya Telefon 2 seçin.";
      setActionMessage(message);
      showOperationToast(message, "warning");
      return;
    }

    void updatePhoneStatus("invalid", activePhoneId);
  }

  async function updatePhoneStatus(action: "contacted" | "invalid", phoneId: number) {
    try {
      setActionMessage(null);

      if (action === "contacted") {
        const result = await markPhoneAsContacted(phoneId);
        const message =
          result.phone_status === "contacted"
            ? "Telefon görüşülen numara olarak işaretlendi."
            : "Görüşülen numara işareti kaldırıldı.";
        setActionMessage(message);
        showOperationToast(message, "success");
      } else {
        const result = await markPhoneAsInvalid(phoneId);
        const message =
          result.phone_status === "invalid"
            ? "Telefon yanlış numara / kullanılmıyor olarak işaretlendi."
            : "Yanlış numara / kullanılmıyor işareti kaldırıldı.";
        setActionMessage(message);
        showOperationToast(message, "success");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Telefon durumu güncellenemedi.";
      setActionMessage(message);
      showOperationToast(message, "error");
    }
  }

  async function confirmDeleteSelectedStudent(row: StudentListRow) {
    try {
      const result = await deleteStudentWithRelations(row.student_id);
      setSelectedStudentId(null);
      setStudentDeleteCandidate(null);
      const message = `${result.deleted_students} aday, ${result.deleted_guardians} veli, ${result.deleted_phones} telefon ve ${result.deleted_reminders} hatırlatma silindi.`;
      setActionMessage(message);
      showOperationToast(message, "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Aday silinemedi.";
      setActionMessage(message);
      showOperationToast(message, "error");
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

  function openReminderStudent(alert: DueReminderAlert) {
    setDismissedReminderKeys((current) => {
      const nextKeys = dismissReminderAlert(current, alert);
      writePersistedDismissedReminderKeys(nextKeys);

      return nextKeys;
    });
    openStudentDrawer(alert.student_id);
  }

  function toggleShortcutHelp() {
    setIsShortcutHelpExpanded((current) => {
      const next = !current;
      writeShortcutHelpExpandedPreference(next);

      return next;
    });
  }

  function dismissActiveReminder() {
    if (!activeReminderAlert) {
      return;
    }

    setDismissedReminderKeys((current) => persistDismissedReminderAlert(current, activeReminderAlert));
  }

  function dismissAllVisibleReminders() {
    if (!reminderPopup) {
      return;
    }

    setDismissedReminderKeys((current) => persistDismissedReminderAlerts(current, reminderPopup.alerts));
  }

  async function saveCallAndGoNext() {
    if (!selectedRow) {
      return;
    }

    if (isSavingCall) {
      return;
    }

    const legacyContactedPhoneId = getLegacyContactedPhoneId(selectedRow);
    const contactedPhoneId = selectedCallPhoneId ?? legacyContactedPhoneId;
    const validation = validateCallSave({
      call_result: callResult,
      note: newNote,
      reminder_date: reminderDate,
      reminder_time: reminderTime,
      contacted_phone_id: contactedPhoneId ?? null,
      allow_appointment_without_note: allowAppointmentWithoutNote,
      past_appointment_confirm_count: pastAppointmentConfirmCount,
      phones: createCallSaveValidationPhones(selectedRow)
    });

    if (!validation.ok) {
      setActionMessage(validation.message);
      showOperationToast(validation.message, validation.severity);

      if (validation.confirmation_required) {
        if (validation.confirmation_type === "past_appointment") {
          setPastAppointmentConfirmCount((current) => current + 1);
        }

        if (validation.confirmation_type === "appointment_note") {
          setAllowAppointmentWithoutNote(true);
        }
      }

      return;
    }

    setIsSavingCall(true);
    setActionMessage(null);

    try {
      const reminderAt = mergeReminderDateTime(reminderDate, reminderTime);

      await writeCallLog({
        student_id: selectedRow.student_id,
        guardian_id: selectedRow.guardian_id ?? null,
        contacted_phone_id: contactedPhoneId ?? null,
        call_result: callResult,
        note: validation.note,
        reminder_at: reminderAt,
        campaign_id: selectedRow.campaign_id ?? null,
        created_by: "agent"
      });

      setNewNote("");
      setSelectedCallPhoneId(null);
      setAllowAppointmentWithoutNote(false);
      setPastAppointmentConfirmCount(0);

      const currentIndex = visibleRows.findIndex((row) => row.student_id === selectedRow.student_id);
      const nextRow = currentIndex >= 0 ? visibleRows[currentIndex + 1] : null;

      if (nextRow) {
        setSelectedStudentId(nextRow.student_id);
        setIsDrawerOpen(true);
        setActionMessage("Görüşme kaydedildi, sıradaki adaya geçildi.");
        showOperationToast("Görüşme kaydedildi, sıradaki adaya geçildi.", "success");
      } else {
        setActionMessage("Görüşme kaydedildi. Liste sonuna geldiniz.");
        showOperationToast("Görüşme kaydedildi. Liste sonuna geldiniz.", "success");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Görüşme kaydı oluşturulamadı.";
      setActionMessage(message);
      showOperationToast(message, "error");
    } finally {
      setIsSavingCall(false);
    }
  }

  useEffect(() => {
    function runShortcutAction(action: ShortcutActionKey) {
      if (action === "escape") {
        if (activeReminderAlert) {
          dismissActiveReminder();
          return;
        }

        if (isDrawerOpen) {
          setIsDrawerOpen(false);
        }

        return;
      }

      if (action === "focus_search") {
        focusGlobalSearch();
        return;
      }

      if (action === "previous_candidate") {
        moveSelectedCandidate(-1);
        return;
      }

      if (action === "next_candidate") {
        moveSelectedCandidate(1);
        return;
      }

      if (action === "mark_phone_1_contacted") {
        markPhoneByShortcut("phone_1");
        return;
      }

      if (action === "mark_phone_2_contacted") {
        markPhoneByShortcut("phone_2");
        return;
      }

      if (action === "toggle_active_phone_invalid") {
        toggleActivePhoneInvalidByShortcut();
        return;
      }

      if (action === "call_reached") {
        setCallResultByShortcut("reached");
        return;
      }

      if (action === "call_not_reached") {
        setCallResultByShortcut("not_reached");
        return;
      }

      if (action === "call_wrong_number") {
        setCallResultByShortcut("wrong_number");
        return;
      }

      if (action === "call_appointment") {
        setCallResultByShortcut("appointment");
        return;
      }

      if (action === "call_do_not_call") {
        setCallResultByShortcut("do_not_call");
        return;
      }

      if (action === "save_call") {
        void saveCallAndGoNext();
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      const action = resolveShortcutAction(event, operationShortcuts);

      if (!action) {
        return;
      }

      event.preventDefault();
      runShortcutAction(action);
    }

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    activeReminderAlert,
    filteredRows,
    focusGlobalSearch,
    isDrawerOpen,
    newNote,
    operationShortcuts,
    selectedRow,
    selectedStudentId,
    visibleRows,
    callResult,
    reminderDate,
    reminderTime,
    isSavingCall
  ]);

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
      {activeReminderAlert ? (
        <section className="reminder-toast" role="status">
          <div className="reminder-toast-icon">
            <Bell aria-hidden="true" size={17} />
          </div>
          <div className="reminder-toast-body">
            <strong>{reminderPopupView?.title}</strong>
            <span>{reminderPopupView?.student_name}</span>
            {reminderPopupView?.guardian_line ? <small>{reminderPopupView.guardian_line}</small> : null}
            <small>{reminderPopupView?.reminder_line}</small>
          </div>
          <div className="reminder-toast-actions">
            <button onClick={() => openReminderStudent(activeReminderAlert)} type="button">
              Adayı Aç
            </button>
            <button onClick={dismissActiveReminder} type="button">
              Bu Bildirimi Kapat
            </button>
            <button onClick={dismissAllVisibleReminders} type="button">
              {DISMISS_FOLLOWING_REMINDERS_LABEL}
            </button>
          </div>
        </section>
      ) : null}
      {operationToast ? (
        <button
          className={`operation-toast ${operationToast.type}`}
          onClick={() => setOperationToast(null)}
          title="Bildirimi kapat"
          type="button"
          aria-live="polite"
        >
          {operationToast.message}
        </button>
      ) : null}
      {studentDeleteCandidate ? (
        <section
          aria-labelledby="student-delete-title"
          aria-modal="true"
          className="delete-confirm-backdrop"
          role="dialog"
        >
          <div className="delete-confirm-modal">
            <h2 id="student-delete-title">Aday silinsin mi?</h2>
            <p>Bu aday ve ilişkili telefon, görüşme geçmişi, hatırlatma/randevu kayıtları silinecek.</p>
            <div className="delete-confirm-actions">
              <button onClick={() => setStudentDeleteCandidate(null)} type="button">
                İptal
              </button>
              <button
                className="danger"
                onClick={() => void confirmDeleteSelectedStudent(studentDeleteCandidate)}
                type="button"
              >
                Sil
              </button>
            </div>
          </div>
        </section>
      ) : null}
      <section className="student-main">
        <div className="student-toolbar">
          <div className="toolbar-left">
            <h2>Aday Listesi</h2>
            <span className="count-badge">{filteredRows.length} aday</span>
          </div>
          <div className="student-filters">
            <div className="student-filter-selects" aria-label="Liste filtreleri">
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
              <label className="campaign-filter student-group-filter">
                <span>Sınıf / Şube</span>
                <select
                  value={studentGroupFilter}
                  onChange={(event) => setStudentGroupFilter(event.target.value as StudentGroupFilterValue)}
                >
                  <option value={ALL_STUDENT_GROUPS_FILTER}>Tüm Sınıf / Şubeler</option>
                  {classLevelOptions.length ? (
                    <optgroup label="Sınıf Seviyeleri">
                      {classLevelOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </optgroup>
                  ) : null}
                  {classSectionOptions.length ? (
                    <optgroup label="Şubeler / Gruplar">
                      {classSectionOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </optgroup>
                  ) : null}
                  {unspecifiedClassSectionOptions.length ? (
                    <optgroup label="Belirtilmemiş">
                      {unspecifiedClassSectionOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </optgroup>
                  ) : null}
                </select>
              </label>
              <label className="campaign-filter status-filter">
                <span>Durum Filtresi</span>
                <select
                  value={activeFilter}
                  onChange={(event) => setActiveFilter(event.target.value as StudentListFilter)}
                >
                  {FILTER_OPTIONS.map((filter) => (
                    <option key={filter.key} value={filter.key}>
                      {filter.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>

        {loadError ? <p className="error-text">{loadError}</p> : null}
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
                const noteSummary = createStudentListNoteSummary(row, activeFilter);
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
                      data-student-row-id={row.student_id}
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
                          centerEmpty
                        />
                      </td>
                      <td>
                        <span className={`status ${statusClass(row)}`}>
                          <span className="status-text">{statusLabel(row)}</span>
                        </span>
                      </td>
                      <td className="td-note" title={noteSummary.title}>
                        <div className={`td-note-inner ${noteSummary.is_empty ? "td-note-empty" : ""}`}>
                          <span className="td-note-summary">{noteSummary.text}</span>
                          {noteSummary.suffix ? <em className="td-note-count">· {noteSummary.suffix}</em> : null}
                        </div>
                      </td>
                      <td className="td-next">
                        {row.has_reminder ? `↻ ${formatShortDateTime(row.next_reminder_at)}` : <span className="td-empty-value">-</span>}
                      </td>
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <div
          aria-label="Kısayol yardım çubuğu"
          className={`student-kbdbar ${isShortcutHelpExpanded ? "is-expanded" : "is-collapsed"}`}
        >
          <div className="student-kbdbar-header">
            <div className="student-kbdbar-summary">
              <strong>
                <span aria-hidden="true">⌨</span> Kısayollar
              </strong>
              {!isShortcutHelpExpanded ? (
                <div className="student-kbdbar-preview" aria-label="Öne çıkan kısayollar">
                  {compactShortcutItems.map((item) => (
                    <span className="student-kbdbar-chip compact" key={item.id}>
                      <kbd>{item.shortcut}</kbd>
                      <span>{item.label}</span>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            {isShortcutHelpExpanded ? (
              <div className="student-kbdbar-groups">
                {shortcutHelpGroups.map((group) => (
                  <div className="student-kbdbar-group" key={group.title}>
                    <span className="student-kbdbar-group-title">{group.title}</span>
                    <div className="student-kbdbar-items">
                      {group.items.map((item) => (
                        <span className="student-kbdbar-chip" key={item.id}>
                          <kbd>{item.shortcut}</kbd>
                          <span>{item.label}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <button className="student-kbdbar-toggle" onClick={toggleShortcutHelp} type="button">
              {isShortcutHelpExpanded ? "Gizle" : "Göster"}
            </button>
          </div>
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
                <div className="drawer-header-actions">
                  <div className="drawer-more-menu">
                    <button
                      aria-expanded={isStudentActionsOpen}
                      aria-label="Aday işlemleri"
                      className="icon-only-btn"
                      onClick={() => setIsStudentActionsOpen((current) => !current)}
                      title="Aday işlemleri"
                      type="button"
                    >
                      <MoreVertical aria-hidden="true" size={15} />
                    </button>
                    {isStudentActionsOpen ? (
                      <div className="drawer-more-popover">
                        <button
                          className="danger"
                          onClick={() => {
                            setIsStudentActionsOpen(false);
                            setStudentDeleteCandidate(selectedRow);
                          }}
                          type="button"
                        >
                          <Trash2 aria-hidden="true" size={14} />
                          Adayı sil
                        </button>
                      </div>
                    ) : null}
                  </div>
                  <button className="close-btn" onClick={() => setIsDrawerOpen(false)} title="Kişi kartını kapat" type="button">
                    <X aria-hidden="true" size={15} />
                  </button>
                </div>
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
              <div ref={drawerPhoneListRef} aria-hidden="true" />
              <PhoneCard
                label="Telefon 1"
                phoneId={selectedRow.phone_1_id}
                value={selectedRow.phone_1}
                isContacted={selectedRow.phone_1_is_contacted}
                isWrong={selectedRow.phone_1_is_wrong}
                onContacted={(phoneId) => {
                  setSelectedCallPhoneId(null);
                  void updatePhoneStatus("contacted", phoneId);
                }}
                onInvalid={(phoneId) => void updatePhoneStatus("invalid", phoneId)}
              />
              <PhoneCard
                label="Telefon 2"
                phoneId={selectedRow.phone_2_id}
                value={selectedRow.phone_2}
                isContacted={selectedRow.phone_2_is_contacted}
                isWrong={selectedRow.phone_2_is_wrong}
                onContacted={(phoneId) => {
                  setSelectedCallPhoneId(null);
                  void updatePhoneStatus("contacted", phoneId);
                }}
                onInvalid={(phoneId) => void updatePhoneStatus("invalid", phoneId)}
              />
              {readonlyDrawerPhones.map((phone) => (
                <PhoneCard
                  key={phone.id ?? phone.normalized_phone_number}
                  label={phone.display_label}
                  phoneId={phone.id}
                  value={phone.phone_number}
                  isContacted={phone.phone_status === "contacted"}
                  isWrong={phone.phone_status === "invalid" || phone.is_wrong || !phone.is_valid}
                  isReadOnly
                  isSelectedForCall={phone.id === selectedCallPhoneId}
                  onSelectForCall={(phoneId) => {
                    const isCurrentlySelected = selectedCallPhoneId === phoneId || phone.phone_status === "contacted";

                    setSelectedCallPhoneId(isCurrentlySelected ? null : phoneId);
                    void updatePhoneStatus("contacted", phoneId);
                  }}
                  onInvalid={(phoneId) => {
                    setSelectedCallPhoneId((currentPhoneId) => (currentPhoneId === phoneId ? null : currentPhoneId));
                    void updatePhoneStatus("invalid", phoneId);
                  }}
                  statusText={getReadonlyPhoneStatusText(phone)}
                />
              ))}
              {selectedRow.hidden_phone_count > 0 ? (
                <Button
                  aria-expanded={isExtraPhonesExpanded}
                  onClick={() => {
                    if (isExtraPhonesExpanded) {
                      shouldScrollPhoneListAfterCollapseRef.current = true;
                      setIsExtraPhonesExpanded(false);
                      return;
                    }

                    setIsExtraPhonesExpanded(true);
                  }}
                  type="button"
                  variant="secondary"
                >
                  {isExtraPhonesExpanded ? "Daha az göster" : `+${selectedRow.hidden_phone_count} numara daha göster`}
                </Button>
              ) : null}

              <div>
                <label className="form-label">Görüşme durumu</label>
                <select value={callResult} onChange={(event) => setCallResult(event.target.value as CallResult)}>
                  {Object.entries(CALL_RESULTS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Açıklama / not</label>
                <textarea
                  key={`note-${selectedRow.student_id}`}
                  onChange={(event) => setNewNote(event.target.value)}
                  placeholder="Yeni görüşme notu yazın..."
                  value={newNote}
                />
              </div>

              <div>
                <label className="form-label">Tekrar arama</label>
                <div className="row2">
                  <input type="date" value={reminderDate} onChange={(event) => setReminderDate(event.target.value)} />
                  <input type="time" value={reminderTime} onChange={(event) => setReminderTime(event.target.value)} />
                </div>
              </div>

              <button className="save-btn" disabled={isSavingCall} onClick={() => void saveCallAndGoNext()} type="button">
                <ChevronsRight aria-hidden="true" size={16} />
                {isSavingCall ? "Kaydediliyor..." : "Kaydet ve sonrakine geç"}
              </button>

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
                ) : null}
                {(callHistory ?? []).map((historyItem) => (
                  <div className="tl-item" key={historyItem.call_log_id}>
                    <div className="tl-dot" />
                    <div>
                      <div className="tl-date">
                        {formatShortDateTime(historyItem.call_time)} · {historyItem.call_result_label}
                      </div>
                      <div className="tl-text">
                        {formatCallHistoryPhoneContext(
                          historyItem.phone_context_label,
                          historyItem.phone_context_number
                        ) ?? "Telefon seçilmedi"}
                      </div>
                      {historyItem.note ? <div className="tl-text">{historyItem.note}</div> : null}
                      {historyItem.reminder_at ? (
                        <div className="tl-author">Tekrar arama: {formatShortDateTime(historyItem.reminder_at)}</div>
                      ) : null}
                      <div className="tl-author">{historyItem.created_by ?? "system"}</div>
                    </div>
                  </div>
                ))}
                {!selectedRow.general_note?.trim() && !(callHistory ?? []).length ? (
                  <p className="drawer-empty-state">Henüz açıklama/geçmiş yok.</p>
                ) : null}
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

import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { Bell, Check, ChevronsRight, Copy, MessageCircle, MoreVertical, Trash2, X } from "lucide-react";
import type { AppOutletContext } from "../../app/AppLayout";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { CALL_RESULTS, LIFE_CYCLE_STATUSES, type CallResult } from "../../domain/constants/statuses";
import {
  getPhoneCallOutcomeLabel,
  PHONE_CALL_OUTCOME_OPTIONS,
  PHONE_CALL_OUTCOME_LABELS,
  type PhoneCallOutcome
} from "../../domain/models/phone";
import { softDeleteCallLogAndRecomputeStudentSummary } from "../calls/services/callLogDeletion";
import { readCallHistoryForStudent, type CallHistoryItem } from "../calls/services/callHistoryReader";
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
import { updatePhoneOutcome } from "./services/studentPhoneOutcome";
import { markPhoneAsContacted, markPhoneAsInvalid } from "./services/studentPhoneStatus";
import { createWhatsAppDraftLog } from "../whatsapp/whatsappDraftLogService";
import { renderWhatsAppTemplate } from "../whatsapp/whatsappTemplateRenderer";
import {
  DEFAULT_WHATSAPP_TEMPLATE_ID,
  getWhatsAppTemplateById,
  WHATSAPP_TEMPLATES
} from "../whatsapp/whatsappTemplates";
import { buildWhatsAppDraftUrl } from "../whatsapp/whatsappUrl";

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
  relationLabel?: string | null;
  sourceColumn?: string | null;
  latestOutcomeLabel?: string | null;
  callOutcome?: PhoneCallOutcome | null;
  callOutcomeUpdatedAt?: string | null;
  isContacted: boolean;
  isWrong: boolean;
  isReadOnly?: boolean;
  statusText?: string | null;
  isSelectedForCall?: boolean;
  onContacted?: (phoneId: number) => void;
  onInvalid?: (phoneId: number) => void;
  onSelectForCall?: (phoneId: number) => void;
  onOutcomeChange?: (phoneId: number, outcome: PhoneCallOutcome) => void;
  onWhatsAppDraft?: () => void;
};

type WhatsAppDraftContext = {
  studentId: number;
  studentName: string;
  phoneId?: number | null;
  phoneNumber: string;
  phoneLabel: string;
  relationLabel?: string | null;
  relationText?: string | null;
  guardianLine?: string | null;
};

type PhoneOutcomeMenuPosition = {
  isConstrained: boolean;
  left: number;
  maxHeight: number;
  top: number;
  width: number;
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

const CALL_PHONE_ACTION_LABEL = "Bu görüşmede kullanılacak telefon";
const CALL_PHONE_ACTION_SELECTED_LABEL = "Bu görüşmede kullanılacak telefon seçili";
const WRONG_PHONE_ACTION_LABEL = "Yanlış / kullanılmayacak numara";

function getPhoneOutcomeChipStyle(outcome: PhoneCallOutcome): { background: string; borderColor: string; color: string } {
  switch (outcome) {
    case "no_answer":
      return { background: "#fef3c7", borderColor: "#f4d98c", color: "#92400e" };
    case "busy":
      return { background: "#ffedd5", borderColor: "#fdba74", color: "#9a3412" };
    case "closed":
    case "wrong_number":
      return { background: "#fee2e2", borderColor: "#fca5a5", color: "#991b1b" };
    case "reached":
      return { background: "#dcfce7", borderColor: "#86efac", color: "#166534" };
    case "unused":
      return { background: "#e5e7eb", borderColor: "#cbd5e1", color: "#374151" };
    case "not_called":
    default:
      return { background: "#f8fafc", borderColor: "#d6d3cc", color: "#475569" };
  }
}

function getPhoneRelationText(relationLabel?: string | null): string | null {
  switch (relationLabel?.trim().toLocaleLowerCase("tr-TR")) {
    case "anne":
      return "Anne telefonu";
    case "baba":
      return "Baba telefonu";
    case "veli":
      return "Veli telefonu";
    case "öğrenci":
    case "ogrenci":
      return "Öğrenci telefonu";
    case "yakın":
    case "yakin":
      return "Yakın telefonu";
    default:
      return null;
  }
}

function findPhoneRow(
  row: StudentListRow,
  phoneId?: number | null,
  phoneNumber?: string | null
): StudentListPhoneRow | null {
  return (
    row.phones.find((phone) => phoneId != null && phone.id === phoneId) ??
    row.phones.find((phone) => Boolean(phoneNumber) && phone.phone_number === phoneNumber) ??
    null
  );
}

type PhoneOutcomeLookup = {
  byPhoneId: Map<number, string>;
  byNormalizedNumber: Map<string, string>;
};

function normalizePhoneOutcomeNumber(value?: string | null): string {
  return value?.replace(/\D/g, "") ?? "";
}

function createLatestPhoneOutcomeLookup(callHistory: CallHistoryItem[]): PhoneOutcomeLookup {
  const byPhoneId = new Map<number, string>();
  const byNormalizedNumber = new Map<string, string>();
  const newestFirst = [...callHistory].sort(
    (left, right) => right.call_time.localeCompare(left.call_time) || right.call_log_id - left.call_log_id
  );

  for (const historyItem of newestFirst) {
    const outcomeLabel = historyItem.call_result_label;
    const phoneId =
      historyItem.contacted_phone_id ?? historyItem.phone_snapshot_phone_id ?? historyItem.phone_id ?? null;

    if (phoneId != null && !byPhoneId.has(phoneId)) {
      byPhoneId.set(phoneId, outcomeLabel);
    }

    const normalizedNumber = normalizePhoneOutcomeNumber(historyItem.phone_context_number);
    if (normalizedNumber && !byNormalizedNumber.has(normalizedNumber)) {
      byNormalizedNumber.set(normalizedNumber, outcomeLabel);
    }
  }

  return { byPhoneId, byNormalizedNumber };
}

function getLatestPhoneOutcomeLabel(
  lookup: PhoneOutcomeLookup,
  phoneId?: number | null,
  phoneNumber?: string | null
): string | null {
  if (phoneId != null) {
    const outcomeById = lookup.byPhoneId.get(phoneId);

    if (outcomeById) {
      return outcomeById;
    }
  }

  const normalizedNumber = normalizePhoneOutcomeNumber(phoneNumber);

  return normalizedNumber ? lookup.byNormalizedNumber.get(normalizedNumber) ?? null : null;
}

function createWhatsAppGuardianLine(row: StudentListRow, relationLabel?: string | null): string | null {
  const normalizedRelation = relationLabel?.trim().toLocaleLowerCase("tr-TR");

  if (normalizedRelation === "anne" && row.mother_full_name) {
    return `Anne: ${row.mother_full_name}`;
  }

  if (normalizedRelation === "baba" && row.father_full_name) {
    return `Baba: ${row.father_full_name}`;
  }

  if (row.guardian_full_name) {
    return `Veli: ${row.guardian_full_name}`;
  }

  if (row.mother_full_name) {
    return `Anne: ${row.mother_full_name}`;
  }

  if (row.father_full_name) {
    return `Baba: ${row.father_full_name}`;
  }

  return null;
}

function createWhatsAppDraftContext(
  row: StudentListRow,
  phone: {
    phoneId?: number | null;
    phoneNumber?: string | null;
    phoneLabel: string;
    relationLabel?: string | null;
  }
): WhatsAppDraftContext | null {
  if (!phone.phoneNumber?.trim()) {
    return null;
  }

  return {
    studentId: row.student_id,
    studentName: row.student_full_name,
    phoneId: phone.phoneId ?? null,
    phoneNumber: phone.phoneNumber.trim(),
    phoneLabel: phone.phoneLabel,
    relationLabel: phone.relationLabel ?? null,
    relationText: getPhoneRelationText(phone.relationLabel),
    guardianLine: createWhatsAppGuardianLine(row, phone.relationLabel)
  };
}

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
  relationLabel,
  sourceColumn,
  latestOutcomeLabel,
  callOutcome,
  callOutcomeUpdatedAt,
  isContacted,
  isWrong,
  isReadOnly = false,
  statusText,
  isSelectedForCall = false,
  onContacted,
  onInvalid,
  onSelectForCall,
  onOutcomeChange,
  onWhatsAppDraft
}: PhoneCardProps) {
  const relationText = getPhoneRelationText(relationLabel);
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
  const [isOutcomeMenuOpen, setIsOutcomeMenuOpen] = useState(false);
  const [outcomeMenuPlacement, setOutcomeMenuPlacement] = useState<"top" | "bottom">("bottom");
  const [outcomeMenuPosition, setOutcomeMenuPosition] = useState<PhoneOutcomeMenuPosition | null>(null);
  const hideCopyControlTimeoutRef = useRef<number | null>(null);
  const copySuccessTimeoutRef = useRef<number | null>(null);
  const outcomeChipRef = useRef<HTMLButtonElement | null>(null);
  const outcomeMenuRef = useRef<HTMLDivElement | null>(null);
  const currentOutcome = callOutcome ?? "not_called";
  const currentOutcomeLabel = getPhoneCallOutcomeLabel(currentOutcome);
  const outcomeChipStyle = getPhoneOutcomeChipStyle(currentOutcome);
  const outcomeTitle = callOutcomeUpdatedAt
    ? `Telefon durumu: ${currentOutcomeLabel}. Güncellendi: ${formatShortDateTime(callOutcomeUpdatedAt)}`
    : `Telefon durumu: ${currentOutcomeLabel}`;

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

  function getMeasuredOutcomeMenuHeight(): number | undefined {
    const menu = outcomeMenuRef.current;

    if (!menu) {
      return undefined;
    }

    const measuredHeight = menu.getBoundingClientRect().height || menu.scrollHeight;
    return measuredHeight > 0 ? measuredHeight : undefined;
  }

  function chooseOutcomeMenuPlacement(measuredMenuHeight?: number) {
    const triggerRect = outcomeChipRef.current?.getBoundingClientRect();

    if (!triggerRect) {
      setOutcomeMenuPlacement("bottom");
      setOutcomeMenuPosition(null);
      return;
    }

    const safeMargin = 8;
    const menuGap = 6;
    const menuWidth = 156;
    const estimatedMenuHeight = 252;
    const naturalMenuHeight = Math.min(estimatedMenuHeight, measuredMenuHeight ?? estimatedMenuHeight);
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
    const spaceBelow = Math.max(0, viewportHeight - triggerRect.bottom - safeMargin - menuGap);
    const spaceAbove = Math.max(0, triggerRect.top - safeMargin - menuGap);
    const nextPlacement =
      spaceBelow >= estimatedMenuHeight
        ? "bottom"
        : spaceAbove >= estimatedMenuHeight
          ? "top"
          : spaceAbove > spaceBelow
            ? "top"
            : "bottom";
    const availableSpace = nextPlacement === "top" ? spaceAbove : spaceBelow;
    const fallbackSpace = Math.max(48, viewportHeight - safeMargin * 2);
    const maxHeight = Math.min(naturalMenuHeight, availableSpace > 0 ? availableSpace : fallbackSpace);
    const isConstrained = maxHeight < naturalMenuHeight;
    const preferredTop =
      nextPlacement === "top"
        ? triggerRect.top - menuGap - maxHeight
        : triggerRect.bottom + menuGap;
    const top = Math.max(
      safeMargin,
      Math.min(preferredTop, Math.max(safeMargin, viewportHeight - safeMargin - maxHeight))
    );
    const left = Math.max(
      safeMargin,
      Math.min(triggerRect.right - menuWidth, Math.max(safeMargin, viewportWidth - safeMargin - menuWidth))
    );

    setOutcomeMenuPlacement(nextPlacement);
    setOutcomeMenuPosition({
      isConstrained,
      left,
      maxHeight,
      top,
      width: menuWidth
    });
  }

  function toggleOutcomeMenu() {
    if (!isOutcomeMenuOpen) {
      chooseOutcomeMenuPlacement();
    }

    setIsOutcomeMenuOpen((isOpen) => !isOpen);
  }

  useEffect(() => {
    if (!isOutcomeMenuOpen) {
      return;
    }

    function closeOnOutsidePointer(event: MouseEvent) {
      const target = event.target;

      if (
        target instanceof Node &&
        (outcomeChipRef.current?.contains(target) || outcomeMenuRef.current?.contains(target))
      ) {
        return;
      }

      setIsOutcomeMenuOpen(false);
    }

    function updatePlacement() {
      chooseOutcomeMenuPlacement(getMeasuredOutcomeMenuHeight());
    }

    updatePlacement();
    document.addEventListener("mousedown", closeOnOutsidePointer);
    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsidePointer);
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
    };
  }, [isOutcomeMenuOpen]);

  useLayoutEffect(() => {
    if (!isOutcomeMenuOpen || !outcomeMenuRef.current) {
      return;
    }

    chooseOutcomeMenuPlacement(getMeasuredOutcomeMenuHeight());
  }, [isOutcomeMenuOpen, outcomeMenuPlacement, outcomeMenuPosition?.maxHeight]);

  const phoneActions =
    !isReadOnly && onContacted && onInvalid ? (
      <div className="phone-actions phone-card-action-row" style={{ display: "flex", flex: "0 0 auto", gap: 5 }}>
        <button
          aria-label={isContacted ? CALL_PHONE_ACTION_SELECTED_LABEL : CALL_PHONE_ACTION_LABEL}
          className={isContacted ? "active" : ""}
          disabled={!phoneId || isWrong}
          onClick={() => phoneId && onContacted(phoneId)}
          title={isContacted ? CALL_PHONE_ACTION_SELECTED_LABEL : CALL_PHONE_ACTION_LABEL}
          type="button"
        >
          <Check aria-hidden="true" size={14} />
        </button>
        <button
          aria-label={WRONG_PHONE_ACTION_LABEL}
          className={isWrong ? "active invalid" : ""}
          disabled={!phoneId}
          onClick={() => phoneId && onInvalid(phoneId)}
          title={WRONG_PHONE_ACTION_LABEL}
          type="button"
        >
          x
        </button>
      </div>
    ) : isReadOnly && onSelectForCall && onInvalid ? (
      <div className="phone-actions phone-card-action-row" style={{ display: "flex", flex: "0 0 auto", gap: 5 }}>
        <button
          aria-label={isEffectiveContacted ? CALL_PHONE_ACTION_SELECTED_LABEL : CALL_PHONE_ACTION_LABEL}
          aria-pressed={isEffectiveContacted}
          className={isEffectiveContacted ? "active" : ""}
          disabled={!phoneId || isWrong}
          onClick={() => phoneId && onSelectForCall(phoneId)}
          title={isEffectiveContacted ? CALL_PHONE_ACTION_SELECTED_LABEL : CALL_PHONE_ACTION_LABEL}
          type="button"
        >
          <Check aria-hidden="true" size={14} />
        </button>
        <button
          aria-label={WRONG_PHONE_ACTION_LABEL}
          className={isWrong ? "active invalid" : ""}
          disabled={!phoneId}
          onClick={() => phoneId && onInvalid(phoneId)}
          title={WRONG_PHONE_ACTION_LABEL}
          type="button"
        >
          x
        </button>
      </div>
    ) : null;

  const whatsAppAction =
    value && onWhatsAppDraft ? (
      <button
        aria-label={`${label} WhatsApp taslak mesajı`}
        onClick={onWhatsAppDraft}
        style={{
          alignItems: "center",
          background: "#ecfdf5",
          border: "1px solid #bbf7d0",
          borderRadius: 999,
          color: "#047857",
          cursor: "pointer",
          display: "inline-flex",
          flex: "0 0 auto",
          fontSize: 11,
          fontWeight: 700,
          gap: 5,
          height: 24,
          lineHeight: 1,
          padding: "0 8px"
        }}
        title="WhatsApp taslak mesajı hazırla"
        type="button"
      >
        <MessageCircle aria-hidden="true" size={12} />
        WhatsApp
      </button>
    ) : null;

  const outcomeControl =
    value && phoneId && onOutcomeChange ? (
      <span
        className="phone-outcome-control"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setIsOutcomeMenuOpen(false);
          }
        }}
        style={{ flex: "0 0 auto", position: "relative" }}
      >
        <button
          ref={outcomeChipRef}
          aria-expanded={isOutcomeMenuOpen}
          aria-haspopup="menu"
          aria-label={`Telefon durumu: ${currentOutcomeLabel}`}
          onClick={toggleOutcomeMenu}
          style={{
            alignItems: "center",
            background: outcomeChipStyle.background,
            border: `1px solid ${outcomeChipStyle.borderColor}`,
            borderRadius: 999,
            boxSizing: "border-box",
            color: outcomeChipStyle.color,
            cursor: "pointer",
            display: "inline-flex",
            fontSize: 11,
            fontWeight: 700,
            gap: 4,
            height: 24,
            lineHeight: 1,
            padding: "0 8px",
            whiteSpace: "nowrap"
          }}
          title={outcomeTitle}
          type="button"
        >
          {currentOutcomeLabel}
          <span aria-hidden="true" style={{ fontSize: 9, lineHeight: 1 }}>
            ▾
          </span>
        </button>
        {isOutcomeMenuOpen && outcomeMenuPosition && typeof document !== "undefined"
          ? createPortal(
              <div
                ref={outcomeMenuRef}
                className={`phone-outcome-menu phone-outcome-menu-${outcomeMenuPlacement}`}
                data-placement={outcomeMenuPlacement}
                role="menu"
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setIsOutcomeMenuOpen(false);
                    outcomeChipRef.current?.focus();
                  }
                }}
                style={
                  {
                    background: "#fff",
                    border: "1px solid #ddd6c8",
                    borderRadius: 8,
                    boxShadow: "0 18px 36px rgba(15, 23, 42, 0.18)",
                    left: outcomeMenuPosition.left,
                    maxHeight: outcomeMenuPosition.maxHeight,
                    overflowY: outcomeMenuPosition.isConstrained ? "auto" : "visible",
                    padding: 4,
                    position: "fixed",
                    top: outcomeMenuPosition.top,
                    width: outcomeMenuPosition.width,
                    zIndex: 2000
                  } as CSSProperties
                }
              >
                {PHONE_CALL_OUTCOME_OPTIONS.map((outcome) => {
                  const labelText = PHONE_CALL_OUTCOME_LABELS[outcome];

                  return (
                    <button
                      key={outcome}
                      aria-checked={outcome === currentOutcome}
                      onClick={() => {
                        onOutcomeChange(phoneId, outcome);
                        setIsOutcomeMenuOpen(false);
                      }}
                      role="menuitemradio"
                      style={{
                        alignItems: "center",
                        background: outcome === currentOutcome ? "#f4f1ea" : "transparent",
                        border: "0",
                        borderRadius: 6,
                        color: "#374151",
                        cursor: "pointer",
                        display: "flex",
                        fontSize: 12,
                        justifyContent: "space-between",
                        padding: "7px 8px",
                        textAlign: "left",
                        width: "100%"
                      }}
                      type="button"
                    >
                      <span>{labelText}</span>
                      {outcome === currentOutcome ? <Check aria-hidden="true" size={12} /> : null}
                    </button>
                  );
                })}
              </div>,
              document.body
            )
          : null}
      </span>
    ) : null;

  return (
    <div
      className={`drawer-phone-card ${isEffectiveContacted ? "contacted" : ""} ${isWrong ? "invalid" : ""}`}
      style={{ display: "block", position: "relative", zIndex: isOutcomeMenuOpen ? 30 : undefined }}
    >
      <div style={{ display: "grid", gap: 6 }}>
        <div
          className="phone-card-header-row"
          style={{
            alignItems: "flex-start",
            display: "flex",
            gap: 8,
            justifyContent: "space-between",
            minWidth: 0,
            position: "relative"
          }}
        >
          <span
            className="form-label"
            style={{ alignItems: "center", display: "flex", flex: "1 1 auto", flexWrap: "wrap", gap: 6, minWidth: 0 }}
          >
            <span>{label}</span>
            {relationText ? (
            <span
              style={{
                background: "#f4f1ea",
                border: "1px solid #ddd6c8",
                borderRadius: 999,
                color: "#6f6658",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 0,
                lineHeight: "16px",
                padding: "0 6px",
                textTransform: "none"
              }}
              title={sourceColumn?.trim() ? `Excel kaynağı: ${sourceColumn.trim()}` : undefined}
            >
              {relationText}
            </span>
            ) : null}
          </span>
        </div>
        <div
          className="phone-card-body-row"
          style={{ alignItems: "center", display: "flex", gap: 10, justifyContent: "space-between", minWidth: 0 }}
        >
          <strong style={{ flex: "1 1 auto", minWidth: 0 }}>
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
                style={{ alignItems: "center", display: "inline-flex", gap: 4, lineHeight: 1.2, maxWidth: "100%" }}
                tabIndex={0}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", userSelect: "text", whiteSpace: "nowrap" }}>
                  {value}
                </span>
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
          {phoneActions}
        </div>
        <div
          className="phone-card-footer-row"
          style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between", minWidth: 0 }}
        >
          <span style={{ flex: "1 1 auto", minWidth: 0 }}>
            {value ? (
              <small style={{ color: "#64748b", marginTop: 0 }}>Son sonuç: {latestOutcomeLabel?.trim() || "Yok"}</small>
            ) : null}
            {displayStatusText ? <small>{displayStatusText}</small> : null}
          </span>
          <span style={{ alignItems: "center", display: "inline-flex", flex: "0 0 auto", gap: 6 }}>
            {whatsAppAction}
            {outcomeControl}
          </span>
        </div>
      </div>
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
    clearGlobalSearch,
    pendingOpenStudentId,
    consumePendingOpenStudentId,
    pendingSearchListRequestId,
    consumePendingSearchListRequest
  } =
    useOutletContext<AppOutletContext>();
  const debouncedQuery = useDebouncedValue(globalSearch);
  const [activeFilter, setActiveFilter] = useState<StudentListFilter>("all");
  const [duplicateGroupFilterKey, setDuplicateGroupFilterKey] = useState<string | null>(null);
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [studentGroupFilter, setStudentGroupFilter] = useState<StudentGroupFilterValue>(ALL_STUDENT_GROUPS_FILTER);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [isExtraPhonesExpanded, setIsExtraPhonesExpanded] = useState(false);
  const [selectedCallPhoneId, setSelectedCallPhoneId] = useState<number | null>(null);
  const [isStudentActionsOpen, setIsStudentActionsOpen] = useState(false);
  const [studentDeleteCandidate, setStudentDeleteCandidate] = useState<StudentListRow | null>(null);
  const [callLogDeleteCandidate, setCallLogDeleteCandidate] = useState<CallHistoryItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [callResult, setCallResult] = useState<CallResult>("not_called");
  const [newNote, setNewNote] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [reminderTime, setReminderTime] = useState("11:00");
  const [isSavingCall, setIsSavingCall] = useState(false);
  const [isDeletingCallLog, setIsDeletingCallLog] = useState(false);
  const [operationToast, setOperationToast] = useState<OperationToast | null>(null);
  const [whatsAppDraftContext, setWhatsAppDraftContext] = useState<WhatsAppDraftContext | null>(null);
  const [selectedWhatsAppTemplateId, setSelectedWhatsAppTemplateId] = useState(DEFAULT_WHATSAPP_TEMPLATE_ID);
  const [whatsAppDraftMessage, setWhatsAppDraftMessage] = useState<string | null>(null);
  const [isWhatsAppDraftBusy, setIsWhatsAppDraftBusy] = useState(false);
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
    const byDuplicateGroup =
      activeFilter === "duplicate_phone" && duplicateGroupFilterKey
        ? byStudentGroup.filter((row) => row.duplicate_phone_keys.includes(duplicateGroupFilterKey))
        : byStudentGroup;

    return activeFilter === "duplicate_phone" ? sortDuplicateRows(byDuplicateGroup) : byDuplicateGroup;
  }, [activeFilter, campaignFilter, debouncedQuery, duplicateGroupFilterKey, rows, studentGroupFilter]);
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
  const phone1Row = selectedRow ? findPhoneRow(selectedRow, selectedRow.phone_1_id, selectedRow.phone_1) : null;
  const phone2Row = selectedRow ? findPhoneRow(selectedRow, selectedRow.phone_2_id, selectedRow.phone_2) : null;
  const callHistory = useLiveQuery(
    () => (selectedRow ? readCallHistoryForStudent(selectedRow.student_id) : Promise.resolve([])),
    [selectedRow?.student_id],
    []
  );
  const latestPhoneOutcomeLookup = useMemo(
    () => createLatestPhoneOutcomeLookup(callHistory ?? []),
    [callHistory]
  );
  const selectedWhatsAppTemplate = useMemo(
    () => getWhatsAppTemplateById(selectedWhatsAppTemplateId),
    [selectedWhatsAppTemplateId]
  );
  const whatsAppMessagePreview = useMemo(() => {
    if (!whatsAppDraftContext) {
      return "";
    }

    return renderWhatsAppTemplate(selectedWhatsAppTemplate, {
      veli_unvani: "Sayın Veli",
      ogrenci_adi: whatsAppDraftContext.studentName,
      telefon: whatsAppDraftContext.phoneNumber
    });
  }, [selectedWhatsAppTemplate, whatsAppDraftContext]);
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
  const canResetStatusFilter = activeFilter !== "all" || Boolean(duplicateGroupFilterKey);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, campaignFilter, debouncedQuery, duplicateGroupFilterKey, studentGroupFilter]);

  useEffect(() => {
    if (activeFilter !== "duplicate_phone") {
      setDuplicateGroupFilterKey(null);
    }
  }, [activeFilter]);

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
    setCallLogDeleteCandidate(null);
    setWhatsAppDraftContext(null);
    setWhatsAppDraftMessage(null);
    setSelectedWhatsAppTemplateId(DEFAULT_WHATSAPP_TEMPLATE_ID);
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

  function resetStatusFilter() {
    setActiveFilter("all");
    setDuplicateGroupFilterKey(null);
    setCurrentPage(1);
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

  async function handlePhoneOutcomeChange(phoneId: number, outcome: PhoneCallOutcome) {
    try {
      setActionMessage(null);
      await updatePhoneOutcome(phoneId, outcome);
      const message = `Telefon durumu ${getPhoneCallOutcomeLabel(outcome)} olarak kaydedildi.`;
      setActionMessage(message);
      showOperationToast(message, "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Telefon durumu kaydedilemedi.";
      setActionMessage(message);
      showOperationToast(message, "error");
    }
  }

  function openWhatsAppDraft(context: WhatsAppDraftContext | null) {
    if (!context) {
      const message = "WhatsApp taslağı için telefon numarası bulunamadı.";
      setWhatsAppDraftMessage(message);
      showOperationToast(message, "warning");
      return;
    }

    setWhatsAppDraftContext(context);
    setSelectedWhatsAppTemplateId(DEFAULT_WHATSAPP_TEMPLATE_ID);
    setWhatsAppDraftMessage(null);
  }

  async function logWhatsAppDraftAction(status: "draft_opened" | "copied" | "manually_marked_sent") {
    if (!whatsAppDraftContext) {
      return;
    }

    await createWhatsAppDraftLog({
      student_id: whatsAppDraftContext.studentId,
      phone_id: whatsAppDraftContext.phoneId ?? null,
      phone_number: whatsAppDraftContext.phoneNumber,
      template_id: selectedWhatsAppTemplate.id,
      template_title: selectedWhatsAppTemplate.title,
      message_preview: whatsAppMessagePreview,
      status,
      created_by_optional: "agent"
    });
  }

  async function copyWhatsAppDraftMessage() {
    if (!whatsAppDraftContext || isWhatsAppDraftBusy) {
      return;
    }

    setIsWhatsAppDraftBusy(true);
    setWhatsAppDraftMessage(null);

    try {
      const clipboard = navigator.clipboard;
      if (typeof clipboard?.writeText !== "function") {
        setWhatsAppDraftMessage("Kopyalama bu tarayıcıda desteklenmiyor. Metni önizlemeden elle seçebilirsiniz.");
        return;
      }

      await clipboard.writeText(whatsAppMessagePreview);
      await logWhatsAppDraftAction("copied");
      setWhatsAppDraftMessage("Mesaj kopyalandı.");
    } catch (error) {
      setWhatsAppDraftMessage(error instanceof Error ? error.message : "Mesaj kopyalanamadı.");
    } finally {
      setIsWhatsAppDraftBusy(false);
    }
  }

  async function openWhatsAppDraftUrl() {
    if (!whatsAppDraftContext || isWhatsAppDraftBusy) {
      return;
    }

    setIsWhatsAppDraftBusy(true);
    setWhatsAppDraftMessage(null);

    try {
      const draftUrl = buildWhatsAppDraftUrl(whatsAppDraftContext.phoneNumber, whatsAppMessagePreview);
      const openedWindow = window.open(draftUrl, "_blank", "noopener,noreferrer");

      await logWhatsAppDraftAction("draft_opened");

      if (!openedWindow) {
        setWhatsAppDraftMessage(
          "WhatsApp taslağı açılmadıysa tarayıcı engellemiş olabilir. Mesajı kopyalayarak manuel kullanabilirsiniz."
        );
        return;
      }

      setWhatsAppDraftMessage("WhatsApp taslağı açıldı. Gönderme işlemi WhatsApp içinde manuel yapılır.");
    } catch (error) {
      setWhatsAppDraftMessage(error instanceof Error ? error.message : "WhatsApp taslağı açılamadı.");
    } finally {
      setIsWhatsAppDraftBusy(false);
    }
  }

  async function markWhatsAppDraftAsSent() {
    if (!whatsAppDraftContext || isWhatsAppDraftBusy) {
      return;
    }

    setIsWhatsAppDraftBusy(true);
    setWhatsAppDraftMessage(null);

    try {
      await logWhatsAppDraftAction("manually_marked_sent");
      setWhatsAppDraftMessage("Manuel gönderildi olarak işaretlendi.");
    } catch (error) {
      setWhatsAppDraftMessage(error instanceof Error ? error.message : "WhatsApp durumu kaydedilemedi.");
    } finally {
      setIsWhatsAppDraftBusy(false);
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

  async function confirmDeleteCallLog(historyItem: CallHistoryItem) {
    if (isDeletingCallLog) {
      return;
    }

    setIsDeletingCallLog(true);
    setActionMessage(null);

    try {
      await softDeleteCallLogAndRecomputeStudentSummary(historyItem.call_log_id);
      setCallLogDeleteCandidate(null);
      const message = "İletişim kaydı silindi. Son görüşme bilgisi kalan kayıtlara göre güncellendi.";
      setActionMessage(message);
      showOperationToast(message, "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "İletişim kaydı silinemedi.";
      setActionMessage(message);
      showOperationToast(message, "error");
    } finally {
      setIsDeletingCallLog(false);
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
      {callLogDeleteCandidate ? (
        <section
          aria-labelledby="call-log-delete-title"
          aria-modal="true"
          className="delete-confirm-backdrop"
          role="dialog"
        >
          <div className="delete-confirm-modal">
            <h2 id="call-log-delete-title">İletişim kaydı silinsin mi?</h2>
            <p>
              Bu iletişim kaydı silindi olarak işaretlenecek. İşlem öğrenci son görüşme bilgisini kalan kayıtlara göre
              günceller.
            </p>
            <div className="delete-confirm-actions">
              <button disabled={isDeletingCallLog} onClick={() => setCallLogDeleteCandidate(null)} type="button">
                İptal
              </button>
              <button
                className="danger"
                disabled={isDeletingCallLog}
                onClick={() => void confirmDeleteCallLog(callLogDeleteCandidate)}
                type="button"
              >
                {isDeletingCallLog ? "Siliniyor..." : "Sil"}
              </button>
            </div>
          </div>
        </section>
      ) : null}
      {whatsAppDraftContext ? (
        <section
          aria-labelledby="whatsapp-draft-title"
          aria-modal="true"
          className="delete-confirm-backdrop"
          role="dialog"
        >
          <div className="delete-confirm-modal" style={{ maxWidth: 620 }}>
            <h2 id="whatsapp-draft-title">WhatsApp Taslak Mesajı</h2>
            <p style={{ marginBottom: 12 }}>
              Bu ekran sadece WhatsApp mesaj taslağı hazırlar. Gönderme işlemi WhatsApp içinde manuel yapılır.
            </p>
            <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
              <div style={{ color: "#475569", display: "grid", fontSize: 13, gap: 4 }}>
                <strong style={{ color: "#1f2937" }}>{whatsAppDraftContext.studentName}</strong>
                <span>
                  {whatsAppDraftContext.phoneLabel}: {whatsAppDraftContext.phoneNumber}
                  {whatsAppDraftContext.relationText ? ` · ${whatsAppDraftContext.relationText}` : ""}
                </span>
                {whatsAppDraftContext.guardianLine ? <span>{whatsAppDraftContext.guardianLine}</span> : null}
              </div>
              <label style={{ display: "grid", gap: 6 }}>
                <span className="form-label">Şablon</span>
                <select
                  value={selectedWhatsAppTemplateId}
                  onChange={(event) => {
                    setSelectedWhatsAppTemplateId(event.target.value);
                    setWhatsAppDraftMessage(null);
                  }}
                >
                  {WHATSAPP_TEMPLATES.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.title}
                    </option>
                  ))}
                </select>
              </label>
              <small style={{ color: "#64748b" }}>{selectedWhatsAppTemplate.description}</small>
              <label style={{ display: "grid", gap: 6 }}>
                <span className="form-label">Mesaj önizleme</span>
                <textarea
                  readOnly
                  style={{ minHeight: 220, resize: "vertical", whiteSpace: "pre-wrap" }}
                  value={whatsAppMessagePreview}
                />
              </label>
              {whatsAppDraftMessage ? (
                <div aria-live="polite" style={{ color: "#475569", fontSize: 13 }}>
                  {whatsAppDraftMessage}
                </div>
              ) : null}
            </div>
            <div className="delete-confirm-actions">
              <button
                disabled={isWhatsAppDraftBusy}
                onClick={() => {
                  setWhatsAppDraftContext(null);
                  setWhatsAppDraftMessage(null);
                }}
                type="button"
              >
                Kapat
              </button>
              <button disabled={isWhatsAppDraftBusy} onClick={() => void copyWhatsAppDraftMessage()} type="button">
                Mesajı Kopyala
              </button>
              <button disabled={isWhatsAppDraftBusy} onClick={() => void markWhatsAppDraftAsSent()} type="button">
                Gönderildi olarak işaretle
              </button>
              <button
                className="danger"
                disabled={isWhatsAppDraftBusy}
                onClick={() => void openWhatsAppDraftUrl()}
                style={{ background: "#047857", borderColor: "#047857" }}
                type="button"
              >
                WhatsApp'ta Aç
              </button>
            </div>
          </div>
        </section>
      ) : null}
      <section className="student-main">
        <div className="student-toolbar">
          <div className="toolbar-left" style={{ flex: "0 0 170px", width: 170 }}>
            <h2>Aday Listesi</h2>
            <span className="count-badge" style={{ boxSizing: "border-box", width: 76, textAlign: "center" }}>
              {filteredRows.length} aday
            </span>
          </div>
          <div className="student-filters">
            <div
              className="student-filter-selects"
              aria-label="Liste filtreleri"
              style={{ alignItems: "center", columnGap: 6, flexWrap: "nowrap" }}
            >
              <label className="campaign-filter" style={{ boxSizing: "border-box", width: 200 }}>
                <span>Kampanya</span>
                <select
                  style={{ boxSizing: "border-box", width: 124 }}
                  value={campaignFilter}
                  onChange={(event) => setCampaignFilter(event.target.value)}
                >
                  {campaignOptions.map((campaignName) => (
                    <option key={campaignName} value={campaignName}>
                      {campaignName === "all" ? "Tüm kampanyalar" : campaignName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="campaign-filter student-group-filter" style={{ boxSizing: "border-box", width: 220 }}>
                <span>Sınıf / Şube</span>
                <select
                  style={{ boxSizing: "border-box", width: 142 }}
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
              <label className="campaign-filter status-filter" style={{ boxSizing: "border-box", width: 236 }}>
                <span>Durum Filtresi</span>
                <select
                  style={{ boxSizing: "border-box", width: 144 }}
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
              <button
                aria-label="Filtreyi sıfırla"
                disabled={!canResetStatusFilter}
                onClick={resetStatusFilter}
                style={{
                  alignSelf: "center",
                  background: canResetStatusFilter ? "rgba(245, 158, 11, 0.07)" : "var(--aots-surface)",
                  border: "1px solid var(--aots-border)",
                  borderRadius: "var(--aots-radius)",
                  boxSizing: "border-box",
                  color: canResetStatusFilter ? "var(--aots-amber)" : "var(--aots-muted)",
                  cursor: canResetStatusFilter ? "pointer" : "default",
                  flex: "0 0 62px",
                  fontFamily: "var(--sans)",
                  fontSize: 11,
                  fontWeight: canResetStatusFilter ? 600 : 400,
                  height: 28,
                  lineHeight: 1,
                  minWidth: 62,
                  opacity: canResetStatusFilter ? 0.92 : 0.48,
                  padding: "4px 7px",
                  whiteSpace: "nowrap"
                }}
                type="button"
              >
                Sıfırla
              </button>
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
                  <div className="drawer-class" style={{ alignItems: "center", display: "inline-flex", flexWrap: "wrap", gap: 8 }}>
                    <span>
                      Sınıf: {selectedRow.current_class || "-"} · {selectedRow.student_group}
                    </span>
                    {selectedRow.has_duplicate_phone && selectedRow.duplicate_group_key ? (
                      <button
                        onClick={() => {
                          clearGlobalSearch?.();
                          setActiveFilter("duplicate_phone");
                          setDuplicateGroupFilterKey(selectedRow.duplicate_group_key ?? null);
                          setCurrentPage(1);
                        }}
                        style={{
                          background: "var(--aots-amber-bg)",
                          border: "0",
                          borderRadius: 999,
                          color: "var(--aots-amber)",
                          cursor: "pointer",
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 7px",
                          verticalAlign: "middle"
                        }}
                        title="Aynı mükerrer telefon grubunu listele"
                        type="button"
                      >
                        Mükerrer
                      </button>
                    ) : null}
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
                <span className="form-label">Veli Bilgileri</span>
                <div className="veli-row">
                  <div className="veli-name">
                    {selectedRow.guardian_full_name ? <div>Veli Ad Soyad: {selectedRow.guardian_full_name}</div> : null}
                    {selectedRow.mother_full_name ? <div>Anne Adı: {selectedRow.mother_full_name}</div> : null}
                    {selectedRow.father_full_name ? <div>Baba Adı: {selectedRow.father_full_name}</div> : null}
                  </div>
                  <span className={`status ${statusClass(selectedRow)}`}>{statusLabel(selectedRow)}</span>
                </div>
                <div className="drawer-campaign">{selectedRow.campaign_name || "Diğer"}</div>
                {selectedRow.neighborhood || selectedRow.district ? (
                  <div className="drawer-campaign">
                    Mahalle / İlçe: {[selectedRow.neighborhood, selectedRow.district].filter(Boolean).join(" / ")}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="drawer-body">
              <div ref={drawerPhoneListRef} aria-hidden="true" />
              <PhoneCard
                label={phone1Row?.reference_label || "Telefon 1"}
                phoneId={selectedRow.phone_1_id}
                value={selectedRow.phone_1}
                relationLabel={phone1Row?.relation_label}
                sourceColumn={phone1Row?.source_column}
                latestOutcomeLabel={getLatestPhoneOutcomeLabel(
                  latestPhoneOutcomeLookup,
                  selectedRow.phone_1_id,
                  selectedRow.phone_1
                )}
                callOutcome={phone1Row?.call_outcome}
                callOutcomeUpdatedAt={phone1Row?.call_outcome_updated_at}
                isContacted={selectedRow.phone_1_is_contacted}
                isWrong={selectedRow.phone_1_is_wrong}
                onContacted={(phoneId) => {
                  setSelectedCallPhoneId(null);
                  void updatePhoneStatus("contacted", phoneId);
                }}
                onInvalid={(phoneId) => void updatePhoneStatus("invalid", phoneId)}
                onOutcomeChange={(phoneId, outcome) => void handlePhoneOutcomeChange(phoneId, outcome)}
                onWhatsAppDraft={() =>
                  openWhatsAppDraft(
                    createWhatsAppDraftContext(selectedRow, {
                      phoneId: selectedRow.phone_1_id,
                      phoneNumber: selectedRow.phone_1,
                      phoneLabel: phone1Row?.reference_label || "Telefon 1",
                      relationLabel: phone1Row?.relation_label
                    })
                  )
                }
              />
              <PhoneCard
                label={phone2Row?.reference_label || "Telefon 2"}
                phoneId={selectedRow.phone_2_id}
                value={selectedRow.phone_2}
                relationLabel={phone2Row?.relation_label}
                sourceColumn={phone2Row?.source_column}
                latestOutcomeLabel={getLatestPhoneOutcomeLabel(
                  latestPhoneOutcomeLookup,
                  selectedRow.phone_2_id,
                  selectedRow.phone_2
                )}
                callOutcome={phone2Row?.call_outcome}
                callOutcomeUpdatedAt={phone2Row?.call_outcome_updated_at}
                isContacted={selectedRow.phone_2_is_contacted}
                isWrong={selectedRow.phone_2_is_wrong}
                onContacted={(phoneId) => {
                  setSelectedCallPhoneId(null);
                  void updatePhoneStatus("contacted", phoneId);
                }}
                onInvalid={(phoneId) => void updatePhoneStatus("invalid", phoneId)}
                onOutcomeChange={(phoneId, outcome) => void handlePhoneOutcomeChange(phoneId, outcome)}
                onWhatsAppDraft={() =>
                  openWhatsAppDraft(
                    createWhatsAppDraftContext(selectedRow, {
                      phoneId: selectedRow.phone_2_id,
                      phoneNumber: selectedRow.phone_2,
                      phoneLabel: phone2Row?.reference_label || "Telefon 2",
                      relationLabel: phone2Row?.relation_label
                    })
                  )
                }
              />
              {readonlyDrawerPhones.map((phone) => (
                <PhoneCard
                  key={phone.id ?? phone.normalized_phone_number}
                  label={phone.reference_label}
                  phoneId={phone.id}
                  value={phone.phone_number}
                  relationLabel={phone.relation_label}
                  sourceColumn={phone.source_column}
                  latestOutcomeLabel={getLatestPhoneOutcomeLabel(
                    latestPhoneOutcomeLookup,
                    phone.id,
                    phone.phone_number
                  )}
                  callOutcome={phone.call_outcome}
                  callOutcomeUpdatedAt={phone.call_outcome_updated_at}
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
                  onOutcomeChange={(phoneId, outcome) => void handlePhoneOutcomeChange(phoneId, outcome)}
                  statusText={getReadonlyPhoneStatusText(phone)}
                  onWhatsAppDraft={() =>
                    openWhatsAppDraft(
                      createWhatsAppDraftContext(selectedRow, {
                        phoneId: phone.id,
                        phoneNumber: phone.phone_number,
                        phoneLabel: phone.reference_label,
                        relationLabel: phone.relation_label
                      })
                    )
                  }
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
                      <div
                        className="tl-date"
                        style={{ alignItems: "center", display: "flex", gap: 6, justifyContent: "space-between" }}
                      >
                        <span>
                          {formatShortDateTime(historyItem.call_time)} · {historyItem.call_result_label}
                        </span>
                        <button
                          aria-label="İletişim kaydını sil"
                          onClick={() => setCallLogDeleteCandidate(historyItem)}
                          style={{
                            alignItems: "center",
                            background: "transparent",
                            border: "0",
                            color: "#9f4338",
                            cursor: "pointer",
                            display: "inline-flex",
                            height: 20,
                            justifyContent: "center",
                            opacity: 0.72,
                            padding: 0,
                            width: 20
                          }}
                          title="İletişim kaydını sil"
                          type="button"
                        >
                          <Trash2 aria-hidden="true" size={12} />
                        </button>
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

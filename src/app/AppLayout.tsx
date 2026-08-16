import {
  Bell,
  CalendarClock,
  ClipboardList,
  FileDown,
  FileSpreadsheet,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Users,
  Wifi,
  WifiOff
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import type { LucideIcon } from "lucide-react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  clearDismissedReminderBadge,
  clearDismissedReminderSummaries,
  getVisibleDismissedReminderSummaries,
  readDismissedReminderSummaries,
  readDismissedReminderBadge,
  removeDismissedReminderSummary,
  REMINDER_DISMISSAL_BADGE_EVENT
} from "../features/reminders/services/reminderDismissalStore";
import { OperationalAlertHost } from "../features/reminders/OperationalAlertHost";
import {
  getDefaultOperationShortcuts,
  getShortcutDisplayTextForAction,
  isEditableShortcutTarget,
  resolveShortcutAction
} from "../features/shortcuts/services/shortcutRegistry";
import { readActiveOperationShortcuts } from "../features/shortcuts/services/shortcutSettings";
import { readStudentListRows, type StudentListRow } from "../features/students/services/studentListReader";
import { normalizeText } from "../utils/normalizeText";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  shortcut?: string;
  disabled?: boolean;
};

export type AppOutletContext = {
  globalSearch: string;
  focusGlobalSearch: () => void;
  clearGlobalSearch?: () => void;
  openStudentById: (studentId: number) => void;
  pendingOpenStudentId: number | null;
  consumePendingOpenStudentId: () => void;
  pendingSearchListRequestId: number | null;
  consumePendingSearchListRequest: () => void;
};

const navSections: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "Arama",
    items: [
      { to: "/students", label: "Aday listesi", icon: Users, shortcut: "L" }
    ]
  },
  {
    title: "Planlama",
    items: [
      { to: "/reminders", label: "Hatırlatmalar", icon: CalendarClock, shortcut: "H" }
    ]
  },
  {
    title: "Sistem",
    items: [
      { to: "/import", label: "İçe aktarma", icon: FileSpreadsheet },
      { to: "/export", label: "Excel dışa aktar", icon: FileDown },
      { to: "/settings", label: "Ayarlar", icon: Settings },
      { to: "/reports", label: "Raporlar", icon: LayoutDashboard }
    ]
  },
  {
    title: "Pilot Takibi",
    items: [
      { to: "/progress", label: "Proje İlerlemesi", icon: ClipboardList }
    ]
  }
];

function useDebouncedValue(value: string, delayMs = 180): string {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delayMs);

    return () => window.clearTimeout(timeoutId);
  }, [delayMs, value]);

  return debouncedValue;
}

function searchGlobalStudentRows(rows: StudentListRow[], query: string): StudentListRow[] {
  const normalizedQuery = normalizeText(query);

  if (normalizedQuery.length < 2) {
    return [];
  }

  return rows
    .filter((row) =>
      createGlobalSearchBlob(row).includes(normalizedQuery)
    )
    .slice(0, 9);
}

function createGlobalSearchBlob(row: StudentListRow): string {
  return normalizeText([
    row.student_full_name,
    row.guardian_full_name,
    row.phone_1,
    row.phone_2,
    row.search_blob
  ].filter(Boolean).join(" "));
}

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [hasDismissedReminderBadge, setHasDismissedReminderBadge] = useState(() => readDismissedReminderBadge());
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [dismissedReminderSummaries, setDismissedReminderSummaries] = useState(() => readDismissedReminderSummaries());
  const [pendingOpenStudentId, setPendingOpenStudentId] = useState<number | null>(null);
  const [pendingSearchListRequestId, setPendingSearchListRequestId] = useState<number | null>(null);
  const [activeGlobalSearchIndex, setActiveGlobalSearchIndex] = useState(0);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const globalSearchRef = useRef<HTMLInputElement | null>(null);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const globalSearchRefWrap = useRef<HTMLDivElement | null>(null);
  const debouncedGlobalSearch = useDebouncedValue(globalSearch);
  const studentRows = useLiveQuery(() => readStudentListRows(), [], []);
  const operationShortcuts = useLiveQuery(
    () => readActiveOperationShortcuts(),
    [],
    getDefaultOperationShortcuts()
  );
  const searchShortcutLabel = getShortcutDisplayTextForAction(operationShortcuts, "focus_search") || "F";
  const notificationSummaries = useMemo(
    () => getVisibleDismissedReminderSummaries(dismissedReminderSummaries),
    [dismissedReminderSummaries]
  );
  const globalSearchResults = useMemo(
    () => searchGlobalStudentRows(studentRows ?? [], debouncedGlobalSearch),
    [debouncedGlobalSearch, studentRows]
  );
  const visibleGlobalSearchResults = globalSearchResults.slice(0, 8);
  const hasMoreGlobalSearchResults = globalSearchResults.length > 8;
  const isStudentsRoute = location.pathname === "/students" || location.pathname.startsWith("/students/");
  const canShowGlobalSearchDropdown = !isStudentsRoute;

  function focusGlobalSearch() {
    globalSearchRef.current?.focus();
    globalSearchRef.current?.select();
  }

  function clearGlobalSearch() {
    setGlobalSearch("");
    setIsGlobalSearchOpen(false);
    setActiveGlobalSearchIndex(0);
  }

  useEffect(() => {
    function refreshNotifications() {
      setHasDismissedReminderBadge(readDismissedReminderBadge());
      setDismissedReminderSummaries(readDismissedReminderSummaries());
    }

    window.addEventListener(REMINDER_DISMISSAL_BADGE_EVENT, refreshNotifications);
    window.addEventListener("storage", refreshNotifications);

    return () => {
      window.removeEventListener(REMINDER_DISMISSAL_BADGE_EVENT, refreshNotifications);
      window.removeEventListener("storage", refreshNotifications);
    };
  }, []);

  useEffect(() => {
    if (!isNotificationPanelOpen) {
      return;
    }

    function closeNotificationPanelOnOutsideClick(event: PointerEvent) {
      const target = event.target;

      if (target instanceof Node && notificationRef.current?.contains(target)) {
        return;
      }

      setIsNotificationPanelOpen(false);
    }

    function closeNotificationPanelOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsNotificationPanelOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeNotificationPanelOnOutsideClick);
    document.addEventListener("keydown", closeNotificationPanelOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeNotificationPanelOnOutsideClick);
      document.removeEventListener("keydown", closeNotificationPanelOnEscape);
    };
  }, [isNotificationPanelOpen]);

  useEffect(() => {
    function updateOnlineStatus() {
      setIsOnline(navigator.onLine);
    }

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  useEffect(() => {
    setActiveGlobalSearchIndex(0);
    if (!canShowGlobalSearchDropdown || normalizeText(globalSearch).length < 2) {
      setIsGlobalSearchOpen(false);
    }
  }, [canShowGlobalSearchDropdown, globalSearch]);

  useEffect(() => {
    if (!isGlobalSearchOpen) {
      return;
    }

    function closeGlobalSearchOnOutsideClick(event: PointerEvent) {
      const target = event.target;

      if (target instanceof Node && globalSearchRefWrap.current?.contains(target)) {
        return;
      }

      setIsGlobalSearchOpen(false);
    }

    document.addEventListener("pointerdown", closeGlobalSearchOnOutsideClick);

    return () => document.removeEventListener("pointerdown", closeGlobalSearchOnOutsideClick);
  }, [isGlobalSearchOpen]);

  useEffect(() => {
    function onGlobalShortcut(event: KeyboardEvent) {
      if (resolveShortcutAction(event, operationShortcuts) !== "focus_search") {
        return;
      }

      event.preventDefault();
      focusGlobalSearch();
    }

    window.addEventListener("keydown", onGlobalShortcut);

    return () => window.removeEventListener("keydown", onGlobalShortcut);
  }, [operationShortcuts]);

  useEffect(() => {
    function onSidebarShortcut(event: KeyboardEvent) {
      if (event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey) {
        return;
      }

      if (isEditableShortcutTarget(event.target) || resolveShortcutAction(event, operationShortcuts)) {
        return;
      }

      const key = event.key.toLowerCase();
      const targetPath = key === "l" ? "/students" : key === "h" ? "/reminders" : null;

      if (!targetPath || location.pathname === targetPath) {
        return;
      }

      event.preventDefault();
      navigate(targetPath);
    }

    window.addEventListener("keydown", onSidebarShortcut);

    return () => window.removeEventListener("keydown", onSidebarShortcut);
  }, [location.pathname, navigate, operationShortcuts]);

  function formatReminderDateTime(value: string): string {
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

  function openNotifications() {
    setIsNotificationPanelOpen((current) => !current);
    clearDismissedReminderBadge();
    setHasDismissedReminderBadge(false);
    setDismissedReminderSummaries(readDismissedReminderSummaries());
  }

  const consumePendingOpenStudentId = useCallback(() => {
    setPendingOpenStudentId(null);
  }, []);

  const consumePendingSearchListRequest = useCallback(() => {
    setPendingSearchListRequestId(null);
  }, []);

  const openStudentById = useCallback((studentId: number) => {
    setPendingOpenStudentId(studentId);
    navigate("/students");
  }, [navigate]);

  function removeNotificationSummary(dismissalKey: string) {
    const nextSummaries = removeDismissedReminderSummary(dismissalKey);
    setDismissedReminderSummaries(nextSummaries);
    setHasDismissedReminderBadge(readDismissedReminderBadge());
  }

  function clearNotificationHistory() {
    clearDismissedReminderSummaries();
    setDismissedReminderSummaries([]);
    setHasDismissedReminderBadge(false);
  }

  function openStudentFromNotification(studentId: number) {
    openStudentById(studentId);
    setIsNotificationPanelOpen(false);
  }

  function openStudentFromGlobalSearch(row: StudentListRow) {
    openStudentById(row.student_id);
    setIsGlobalSearchOpen(false);
  }

  function showMoreGlobalSearchResults() {
    setPendingOpenStudentId(null);
    setPendingSearchListRequestId(Date.now());
    setIsGlobalSearchOpen(false);
    navigate("/students");
  }

  function handleGlobalSearchKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (!isGlobalSearchOpen) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setIsGlobalSearchOpen(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveGlobalSearchIndex((current) => Math.min(current + 1, Math.max(visibleGlobalSearchResults.length - 1, 0)));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveGlobalSearchIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      const selectedResult = visibleGlobalSearchResults[activeGlobalSearchIndex];

      if (!selectedResult) {
        return;
      }

      event.preventDefault();
      openStudentFromGlobalSearch(selectedResult);
    }
  }

  return (
    <div className="app-shell">
      <OperationalAlertHost openStudentById={openStudentById} />
      <header className="topbar">
        <button
          className="topbar-icon-btn sidebar-toggle"
          onClick={() => setIsSidebarCollapsed((current) => !current)}
          title={isSidebarCollapsed ? "Menüyü aç" : "Menüyü daralt"}
          type="button"
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen aria-hidden="true" size={17} />
          ) : (
            <PanelLeftClose aria-hidden="true" size={17} />
          )}
        </button>
        <Link className="topbar-brand" to="/students">
          <span className="topbar-logo">
            AÖ
            <br />
            TS
          </span>
          <span>
            <strong>Aday Öğrenci Takip</strong>
            <small>YKS/LGS Hazırlık CRM</small>
          </span>
        </Link>

        <div className="topbar-search" ref={globalSearchRefWrap}>
          <Search aria-hidden="true" size={16} />
          <input
            aria-label="Genel arama"
            onChange={(event) => {
              setGlobalSearch(event.target.value);
              setIsGlobalSearchOpen(canShowGlobalSearchDropdown && normalizeText(event.target.value).length >= 2);
            }}
            onFocus={() => setIsGlobalSearchOpen(canShowGlobalSearchDropdown && normalizeText(globalSearch).length >= 2)}
            onKeyDown={handleGlobalSearchKeyDown}
            placeholder={`Aday, veli veya telefon ara... (${searchShortcutLabel})`}
            ref={globalSearchRef}
            type="search"
            value={globalSearch}
          />
          {canShowGlobalSearchDropdown && isGlobalSearchOpen ? (
            <div className="global-search-popover" role="listbox" aria-label="Global aday arama sonuÃ§larÄ±">
              {visibleGlobalSearchResults.length ? (
                <>
                  {visibleGlobalSearchResults.map((row, index) => (
                    <button
                      aria-selected={index === activeGlobalSearchIndex}
                      className={`global-search-result ${index === activeGlobalSearchIndex ? "active" : ""}`}
                      key={row.student_id}
                      onClick={() => openStudentFromGlobalSearch(row)}
                      onMouseEnter={() => setActiveGlobalSearchIndex(index)}
                      role="option"
                      type="button"
                    >
                      <strong>{row.student_full_name}</strong>
                      <small>
                        {row.guardian_full_name || "-"} - {row.phone_1 || "-"} / {row.phone_2 || "-"}
                      </small>
                    </button>
                  ))}
                  {hasMoreGlobalSearchResults ? (
                    <button className="global-search-more" onClick={showMoreGlobalSearchResults} type="button">
                      Daha fazla gör
                    </button>
                  ) : null}
                </>
              ) : (
                <p>SonuÃ§ bulunamadÄ±.</p>
              )}
            </div>
          ) : null}
        </div>

        <div className="topbar-right">
          <span
            className={`connection-indicator ${isOnline ? "online" : "offline"}`}
            title={
              isOnline
                ? "Bağlantı durumu\nİnternet var. Program kullanılabilir."
                : "Bağlantı durumu\nİnternet yok. Program yine çalışır. Kayıtlar bu bilgisayarda saklanır."
            }
            aria-label={
              isOnline
                ? "Bağlantı durumu: İnternet var. Program kullanılabilir."
                : "Bağlantı durumu: İnternet yok. Program yine çalışır. Kayıtlar bu bilgisayarda saklanır."
            }
          >
            {isOnline ? <Wifi aria-hidden="true" size={16} /> : <WifiOff aria-hidden="true" size={16} />}
            <span aria-hidden="true" />
          </span>
          <div className="topbar-notifications" ref={notificationRef}>
          <button
            className={`topbar-icon-btn ${hasDismissedReminderBadge ? "has-alert" : ""}`}
            onClick={openNotifications}
            type="button"
            aria-expanded={isNotificationPanelOpen}
            aria-label="Bildirimler"
            title={hasDismissedReminderBadge ? "Kapatılmış hatırlatma bildirimi var" : "Bildirimler"}
          >
            <Bell aria-hidden="true" size={17} />
          </button>
          {isNotificationPanelOpen ? (
            <div className="notification-popover" role="dialog" aria-label="Kapatılmış hatırlatmalar">
              <strong>Kapatılmış hatırlatmalar</strong>
              {dismissedReminderSummaries.length ? (
                <>
                <div className="notification-list">
                  {notificationSummaries.visibleSummaries.map((summary) => (
                    <div className="notification-item" key={summary.dismissal_key}>
                      <div className="notification-item-header">
                        <button
                          className="notification-student-link"
                          onClick={() => openStudentFromNotification(summary.student_id)}
                          type="button"
                        >
                          {summary.student_full_name}
                        </button>
                        <button
                          aria-label="Bildirimi panelden kaldÄ±r"
                          className="notification-remove-btn"
                          onClick={() => removeNotificationSummary(summary.dismissal_key)}
                          title="Bildirimi panelden kaldÄ±r"
                          type="button"
                        >
                          x
                        </button>
                      </div>
                      {summary.guardian_full_name ? <small>Veli: {summary.guardian_full_name}</small> : null}
                      <small>{summary.title ?? "Hatırlatma"}: {formatReminderDateTime(summary.due_at ?? summary.reminder_at)}</small>
                      <em>Bildirim kapatıldı</em>
                    </div>
                  ))}
                </div>
                {notificationSummaries.hiddenCount > 0 ? <p>Son 10 bildirim gÃ¶steriliyor.</p> : null}
                <button className="notification-clear-btn" onClick={clearNotificationHistory} type="button">
                  Hepsini temizle
                </button>
                </>
              ) : (
                <p>Şu anda kapatılmış hatırlatma bildirimi yok.</p>
              )}
            </div>
          ) : null}
          </div>
          <span className="avatar" title="Ajan 1">
            A1
          </span>
        </div>
      </header>

      <div className={`app-body ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <aside className="sidebar">
          <nav className="nav-list" aria-label="Ana menü">
            {navSections.map((section) => (
              <div className="nav-section-group" key={section.title}>
                <div className="nav-section">{section.title}</div>
                {section.items.map((item) => {
                  const Icon = item.icon;

                  if (item.disabled) {
                    return (
                      <span
                        aria-disabled="true"
                        className="nav-link nav-link-disabled"
                        key={`${section.title}-${item.label}`}
                      >
                        <Icon aria-hidden="true" size={17} />
                        <span className="nav-label">{item.label}</span>
                      </span>
                    );
                  }

                  return (
                    <NavLink end key={`${section.title}-${item.label}`} to={item.to} className="nav-link" title={item.label}>
                      <Icon aria-hidden="true" size={17} />
                      <span className="nav-label">{item.label}</span>
                      {item.shortcut ? <kbd>{item.shortcut}</kbd> : null}
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="sidebar-footer">
            <span className="avatar">A1</span>
            <span>
              <strong>Ajan 1</strong>
              <small>Arama personeli</small>
            </span>
          </div>
        </aside>

        <main className="content">
          <Outlet
            context={{
              globalSearch,
              focusGlobalSearch,
              clearGlobalSearch,
              openStudentById,
              pendingOpenStudentId,
              consumePendingOpenStudentId,
              pendingSearchListRequestId,
              consumePendingSearchListRequest
            } satisfies AppOutletContext}
          />
        </main>
      </div>
    </div>
  );
}

import {
  Bell,
  CalendarClock,
  FileDown,
  FileSpreadsheet,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  PhoneCall,
  Search,
  Settings,
  Upload,
  Users
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  clearDismissedReminderBadge,
  clearDismissedReminderSummaries,
  getVisibleDismissedReminderSummaries,
  readDismissedReminderSummaries,
  readDismissedReminderBadge,
  removeDismissedReminderSummary,
  REMINDER_DISMISSAL_BADGE_EVENT
} from "../features/reminders/services/reminderDismissalStore";
import {
  getDefaultOperationShortcuts,
  getShortcutDisplayTextForAction
} from "../features/shortcuts/services/shortcutRegistry";
import { readActiveOperationShortcuts } from "../features/shortcuts/services/shortcutSettings";

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
  pendingOpenStudentId: number | null;
  consumePendingOpenStudentId: () => void;
};

const navSections: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "Arama",
    items: [
      { to: "/students", label: "Aday listesi", icon: Users, shortcut: "L" },
      { to: "/call", label: "Arama ekranı", icon: PhoneCall, shortcut: "A" }
    ]
  },
  {
    title: "Planlama",
    items: [
      { to: "/reminders", label: "Hatırlatmalar", icon: CalendarClock, shortcut: "H", disabled: true }
    ]
  },
  {
    title: "Sistem",
    items: [
      { to: "/import", label: "İçe aktarma", icon: FileSpreadsheet },
      { to: "/export", label: "Excel dışa aktar", icon: FileDown },
      { to: "/settings", label: "Ayarlar", icon: Settings },
      { to: "/reports", label: "Raporlar", icon: LayoutDashboard, disabled: true }
    ]
  }
];

export function AppLayout() {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [hasDismissedReminderBadge, setHasDismissedReminderBadge] = useState(() => readDismissedReminderBadge());
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [dismissedReminderSummaries, setDismissedReminderSummaries] = useState(() => readDismissedReminderSummaries());
  const [pendingOpenStudentId, setPendingOpenStudentId] = useState<number | null>(null);
  const globalSearchRef = useRef<HTMLInputElement | null>(null);
  const notificationRef = useRef<HTMLDivElement | null>(null);
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

  function focusGlobalSearch() {
    globalSearchRef.current?.focus();
    globalSearchRef.current?.select();
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
    setPendingOpenStudentId(studentId);
    setIsNotificationPanelOpen(false);
    navigate("/students");
  }

  return (
    <div className="app-shell">
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

        <div className="topbar-search">
          <Search aria-hidden="true" size={16} />
          <input
            aria-label="Genel arama"
            onChange={(event) => setGlobalSearch(event.target.value)}
            placeholder={`İsim, telefon veya not ara... (${searchShortcutLabel})`}
            ref={globalSearchRef}
            type="search"
            value={globalSearch}
          />
        </div>

        <div className="topbar-right">
          <span className="topbar-pill">Çevrimdışı</span>
          <Link className="topbar-btn" to="/import">
            <Upload aria-hidden="true" size={15} />
            Excel içe aktar
          </Link>
          <Link className="topbar-btn primary" to="/export">
            <FileDown aria-hidden="true" size={15} />
            Dışa aktar
          </Link>
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
                      <small>Hatırlatma: {formatReminderDateTime(summary.reminder_at)}</small>
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
              pendingOpenStudentId,
              consumePendingOpenStudentId
            } satisfies AppOutletContext}
          />
        </main>
      </div>
    </div>
  );
}

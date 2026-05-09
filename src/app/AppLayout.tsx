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
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  shortcut?: string;
  disabled?: boolean;
};

export type AppOutletContext = {
  globalSearch: string;
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");

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
            placeholder="İsim, telefon veya not ara... (F)"
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
          <button className="topbar-icon-btn" type="button" aria-label="Bildirimler">
            <Bell aria-hidden="true" size={17} />
          </button>
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
          <Outlet context={{ globalSearch } satisfies AppOutletContext} />
        </main>
      </div>
    </div>
  );
}

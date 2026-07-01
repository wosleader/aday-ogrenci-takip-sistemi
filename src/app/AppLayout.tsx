import { FileDown, FileSpreadsheet, PhoneCall, Settings, Users, LayoutTemplate } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/import", label: "Excel İçe Aktar", icon: FileSpreadsheet },
  { to: "/students", label: "Aday Listesi", icon: Users },
  { to: "/call", label: "Arama Ekranı", icon: PhoneCall },
  { to: "/export", label: "Detaylı Export", icon: FileDown },
  { to: "/settings", label: "Ayarlar", icon: Settings },
  { to: "/demo-ui", label: "UI Demo", icon: LayoutTemplate }
];

export function AppLayout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">AT</span>
          <div>
            <strong>Aday Takip</strong>
            <small>Offline CRM</small>
          </div>
        </div>

        <nav className="nav-list" aria-label="Ana menü">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} className="nav-link">
                <Icon aria-hidden="true" size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

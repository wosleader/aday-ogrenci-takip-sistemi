import { useLiveQuery } from "dexie-react-hooks";
import { PageHeader } from "../../components/PageHeader";
import { DEFAULT_SHORTCUTS } from "../../domain/constants/shortcuts";
import { db } from "../../db/db";

export function SettingsPage() {
  const shortcuts = useLiveQuery(() => db.keyboard_shortcuts.toArray(), []);

  return (
    <div className="page">
      <PageHeader
        title="Ayarlar"
        description="Varsayılan ayarlar ve klavye kısayolları yerel veritabanından okunacak şekilde hazırlanıyor."
      />

      <section className="panel">
        <h2>Varsayılan Kritik Kısayollar</h2>
        <div className="shortcut-grid">
          {(shortcuts ?? DEFAULT_SHORTCUTS).map((shortcut) => (
            <div className="shortcut-row" key={shortcut.action_key}>
              <span>{shortcut.label}</span>
              <kbd>{shortcut.shortcut}</kbd>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

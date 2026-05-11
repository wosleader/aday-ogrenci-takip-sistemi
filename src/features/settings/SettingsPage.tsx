import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState } from "react";
import { Button } from "../../components/Button";
import { PageHeader } from "../../components/PageHeader";
import { downloadTextFile } from "../imports/services/logExport";
import {
  readReminderNotificationSettings,
  updateReminderNotificationSettings
} from "../reminders/services/reminderSettings";
import {
  getDefaultOperationShortcuts,
  getShortcutDisplayText,
  shortcutFromKeyboardEvent,
  type ShortcutActionKey
} from "../shortcuts/services/shortcutRegistry";
import {
  readActiveOperationShortcuts,
  resetShortcutToDefault,
  updateShortcutForAction
} from "../shortcuts/services/shortcutSettings";
import {
  clearCandidateData,
  createDataCleanupBackup,
  DELETE_ALL_STUDENTS_CONFIRMATION,
  type CandidateDataCleanupResult
} from "./services/dataManagement";

type SettingsTab = "general" | "shortcuts" | "reminders" | "data";

const SETTINGS_TABS: Array<{ key: SettingsTab; label: string }> = [
  { key: "general", label: "Genel" },
  { key: "shortcuts", label: "Klavye Kısayolları" },
  { key: "reminders", label: "Hatırlatmalar" },
  { key: "data", label: "Veri Yönetimi" }
];

export function SettingsPage() {
  const reminderSettings = useLiveQuery(() => readReminderNotificationSettings(), []);
  const shortcuts = useLiveQuery(() => readActiveOperationShortcuts(), [], getDefaultOperationShortcuts());
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [editingShortcut, setEditingShortcut] = useState<ShortcutActionKey | null>(null);
  const [shortcutMessage, setShortcutMessage] = useState<string | null>(null);
  const [shortcutMessageType, setShortcutMessageType] = useState<"info" | "success" | "error">("info");
  const [confirmationText, setConfirmationText] = useState("");
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<CandidateDataCleanupResult | null>(null);
  const [dataManagementMessage, setDataManagementMessage] = useState<string | null>(null);
  const [reminderSettingsMessage, setReminderSettingsMessage] = useState<string | null>(null);

  async function downloadManualBackup() {
    const backup = await createDataCleanupBackup();
    downloadTextFile(backup.file_name, backup.json);
    setDataManagementMessage("Tam Sistem Yedeği indirildi.");
  }

  async function clearAllCandidateData() {
    setIsCleaning(true);
    setDataManagementMessage(null);
    setCleanupResult(null);

    try {
      const result = await clearCandidateData(confirmationText);
      downloadTextFile(result.backup.file_name, result.backup.json);
      setCleanupResult(result);
      setConfirmationText("");
      setDataManagementMessage("Tüm aday verileri temizlendi. İşlem öncesi Tam Sistem Yedeği indirildi.");
    } catch (error) {
      setDataManagementMessage(error instanceof Error ? error.message : "Veri temizleme tamamlanamadı.");
    } finally {
      setIsCleaning(false);
    }
  }

  async function updateReminderSetting(key: "popup_enabled" | "sound_enabled", value: boolean) {
    await updateReminderNotificationSettings({
      popup_enabled: reminderSettings?.popup_enabled ?? true,
      sound_enabled: reminderSettings?.sound_enabled ?? true,
      [key]: value
    });
    setReminderSettingsMessage("Hatırlatma ayarları kaydedildi.");
  }

  useEffect(() => {
    if (!editingShortcut) {
      return;
    }

    const actionKey = editingShortcut;

    function onKeyDown(event: KeyboardEvent) {
      event.preventDefault();

      const nextShortcut = shortcutFromKeyboardEvent(event);

      void updateShortcutForAction(actionKey, nextShortcut)
        .then((result) => {
          setShortcutMessage(`${result.shortcut.label} kısayolu güncellendi: ${getShortcutDisplayText(result.shortcut)}`);
          setShortcutMessageType("success");
          setEditingShortcut(null);
        })
        .catch((error) => {
          setShortcutMessage(error instanceof Error ? error.message : "Kısayol güncellenemedi.");
          setShortcutMessageType("error");
        });
    }

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editingShortcut]);

  async function resetShortcut(actionKey: ShortcutActionKey) {
    try {
      const result = await resetShortcutToDefault(actionKey);
      setShortcutMessage(`${result.shortcut.label} varsayılan kısayola döndü: ${getShortcutDisplayText(result.shortcut)}`);
      setShortcutMessageType("success");
      setEditingShortcut(null);
    } catch (error) {
      setShortcutMessage(error instanceof Error ? error.message : "Varsayılan kısayol geri yüklenemedi.");
      setShortcutMessageType("error");
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="Ayarlar"
        description="Varsayılan ayarlar ve klavye kısayolları yerel veritabanından okunacak şekilde hazırlanıyor."
      />

      <div className="settings-tabs" role="tablist" aria-label="Ayar bölümleri">
        {SETTINGS_TABS.map((tab) => (
          <button
            aria-selected={activeTab === tab.key}
            className={`settings-tab ${activeTab === tab.key ? "active" : ""}`}
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            role="tab"
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "general" ? (
        <section className="panel">
          <h2>Genel</h2>
          <p>
            Bu bölüm uygulamanın genel çalışma tercihleri için ayrıldı. Arama operasyonu kısayolları, hatırlatma
            bildirimleri ve veri yönetimi ayarları üstteki sekmelerden yönetilir.
          </p>
          <p className="muted-text">
            Sistem yerel-first çalışır; aday, görüşme ve export verileri cihazdaki IndexedDB veritabanından okunur.
          </p>
        </section>
      ) : null}

      {activeTab === "shortcuts" ? (
      <section className="panel">
        <h2>Klavye Kısayolları</h2>
        <div className="shortcut-help">
          <span>Arama operasyonunda kullanılan kısayolları buradan değiştirebilirsiniz.</span>
          <span>3 tuşu kritik işlemlerde kullanılamaz.</span>
          <span>Aynı kısayol birden fazla işleme atanamaz.</span>
        </div>
        {shortcutMessage ? <p className={`shortcut-message ${shortcutMessageType}`}>{shortcutMessage}</p> : null}
        <div className="shortcut-grid">
          {shortcuts.map((shortcut) => (
            <div className={`shortcut-row ${editingShortcut === shortcut.action_key ? "editing" : ""}`} key={shortcut.action_key}>
              <span className="shortcut-name">{shortcut.label}</span>
              <kbd>{getShortcutDisplayText(shortcut)}</kbd>
              <div className="shortcut-actions">
                {editingShortcut === shortcut.action_key ? (
                  <button type="button" onClick={() => setEditingShortcut(null)}>
                    Vazgeç
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingShortcut(shortcut.action_key);
                      setShortcutMessage(`${shortcut.label} için yeni kısayola basın. İptal etmek için Vazgeç düğmesini kullanın.`);
                      setShortcutMessageType("info");
                    }}
                  >
                    Değiştir
                  </button>
                )}
                <button type="button" onClick={() => void resetShortcut(shortcut.action_key)}>
                  Varsayılana döndür
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className="muted-text">3 tuşu kritik varsayılan kısayollarda kullanılmıyor. Yön tuşları kullanıcıya Türkçe ve anlaşılır şekilde gösterilir.</p>
      </section>
      ) : null}

      {activeTab === "data" ? (
      <section className="panel data-management-panel">
        <h2>Veri Yönetimi</h2>
        <p>
          Aday verilerini temizlemeden önce otomatik Tam Sistem Yedeği alınır. Ayarlar, kampanyalar ve kısayollar korunur.
        </p>
        <p className="muted-text">Yedek dosyası teknik olarak JSON formatında saklanır.</p>

        <div className="toolbar">
          <Button type="button" variant="secondary" onClick={() => void downloadManualBackup()}>
            Tam Sistem Yedeği Al
          </Button>
          <Button type="button" variant="secondary" disabled>
            Sistem Yedeğinden Geri Yükle
          </Button>
          <Button type="button" variant="secondary" disabled>
            İçe aktarma geçmişi
          </Button>
        </div>

        <div className="danger-zone">
          <h3>Tüm aday verilerini temizle</h3>
          <p>
            Bu işlem adayları, velileri, telefonları, hatırlatmaları, aday ilişkili randevuları, import kayıtlarını,
            import loglarını, mükerrer kontrol kayıtlarını ve aday/import audit loglarını temizler.
          </p>
          <label className="inline-field">
            Onay metni
            <input
              className="danger-confirm-input"
              value={confirmationText}
              onChange={(event) => setConfirmationText(event.target.value)}
              placeholder={DELETE_ALL_STUDENTS_CONFIRMATION}
              type="text"
            />
          </label>
          <Button
            type="button"
            disabled={isCleaning || confirmationText !== DELETE_ALL_STUDENTS_CONFIRMATION}
            onClick={() => void clearAllCandidateData()}
          >
            {isCleaning ? "Temizleniyor..." : "Tüm aday verilerini temizle"}
          </Button>
        </div>

        {dataManagementMessage ? <p className="muted-text">{dataManagementMessage}</p> : null}
        {cleanupResult ? (
          <div className="summary-grid">
            <div className="summary-metric">
              <span>Öğrenci</span>
              <strong>{cleanupResult.deleted_students}</strong>
            </div>
            <div className="summary-metric">
              <span>Veli</span>
              <strong>{cleanupResult.deleted_guardians}</strong>
            </div>
            <div className="summary-metric">
              <span>Telefon</span>
              <strong>{cleanupResult.deleted_phones}</strong>
            </div>
            <div className="summary-metric">
              <span>Hatırlatma</span>
              <strong>{cleanupResult.deleted_reminders}</strong>
            </div>
            <div className="summary-metric">
              <span>Import log</span>
              <strong>{cleanupResult.deleted_import_logs}</strong>
            </div>
          </div>
        ) : null}
      </section>
      ) : null}

      {activeTab === "reminders" ? (
      <section className="panel">
        <h2>Bildirimler / Hatırlatmalar</h2>
        <p>Uygulama açıkken zamanı gelen tekrar arama hatırlatmaları için ekran içi uyarıları yönetir.</p>
        <label className="toggle-row">
          <span>
            <strong>Reminder popup uyarıları</strong>
            <small>Zamanı gelen hatırlatmaları ekran içinde göster.</small>
          </span>
          <input
            checked={reminderSettings?.popup_enabled ?? true}
            onChange={(event) => void updateReminderSetting("popup_enabled", event.target.checked)}
            type="checkbox"
          />
        </label>
        <label className="toggle-row">
          <span>
            <strong>Reminder sesli uyarı</strong>
            <small>Popup çıktığında kısa ve yumuşak bir ses çal.</small>
          </span>
          <input
            checked={reminderSettings?.sound_enabled ?? true}
            onChange={(event) => void updateReminderSetting("sound_enabled", event.target.checked)}
            type="checkbox"
          />
        </label>
        {reminderSettingsMessage ? <p className="muted-text">{reminderSettingsMessage}</p> : null}
      </section>
      ) : null}
    </div>
  );
}

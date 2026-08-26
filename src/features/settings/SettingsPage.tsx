import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useRef, useState } from "react";
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
  RESTORE_SYSTEM_BACKUP_CONFIRMATION,
  analyzeSystemBackupFileText,
  restoreSystemBackup,
  type CandidateDataCleanupResult,
  type SystemBackupAnalysis,
  type SystemRestoreResult
} from "./services/dataManagement";
import {
  StudentGroupCleanupMaintenance,
  type StudentGroupCleanupBackupGateState
} from "./StudentGroupCleanupMaintenance";
import { StudentSearchReindexMaintenance } from "./StudentSearchReindexMaintenance";

type SettingsTab = "general" | "shortcuts" | "reminders" | "data" | "maintenance";
type DataManagementNotice = {
  type: "success" | "error";
  title: string;
  message: string;
};

const SETTINGS_TABS: Array<{ key: SettingsTab; label: string }> = [
  { key: "general", label: "Genel" },
  { key: "shortcuts", label: "Klavye Kısayolları" },
  { key: "reminders", label: "Hatırlatmalar" },
  { key: "data", label: "Veri Yönetimi" },
  { key: "maintenance", label: "Veri Sağlığı / Bakım" }
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
  const [isRestoring, setIsRestoring] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<CandidateDataCleanupResult | null>(null);
  const [restoreAnalysis, setRestoreAnalysis] = useState<SystemBackupAnalysis | null>(null);
  const [restoreConfirmationText, setRestoreConfirmationText] = useState("");
  const [restoreResult, setRestoreResult] = useState<SystemRestoreResult | null>(null);
  const restoreFileInputRef = useRef<HTMLInputElement | null>(null);
  const [dataManagementMessage, setDataManagementMessage] = useState<string | null>(null);
  const [dataManagementNotice, setDataManagementNotice] = useState<DataManagementNotice | null>(null);
  const [reminderSettingsMessage, setReminderSettingsMessage] = useState<string | null>(null);
  const [cleanupBackupGateState, setCleanupBackupGateState] = useState<StudentGroupCleanupBackupGateState>("locked");
  const [cleanupBackupGateError, setCleanupBackupGateError] = useState<string | null>(null);
  const [isPreparingCleanupBackup, setIsPreparingCleanupBackup] = useState(false);
  const cleanupBackupPreparationRef = useRef(false);
  const [maintenanceResetKey, setMaintenanceResetKey] = useState(0);

  async function downloadManualBackup() {
    const backup = await createDataCleanupBackup();
    downloadTextFile(backup.file_name, backup.json);
    setDataManagementMessage("Tam Sistem Yedeği için indirme isteği başlatıldı.");
  }

  async function prepareCleanupBackup() {
    if (isPreparingCleanupBackup || cleanupBackupPreparationRef.current || cleanupBackupGateState === "confirmed") {
      return;
    }

    cleanupBackupPreparationRef.current = true;
    setIsPreparingCleanupBackup(true);
    setCleanupBackupGateError(null);

    try {
      const backup = await createDataCleanupBackup();
      downloadTextFile(backup.file_name, backup.json);
      setCleanupBackupGateState("download_initiated");
    } catch (error) {
      setCleanupBackupGateState("locked");
      setCleanupBackupGateError(error instanceof Error ? error.message : "Tam Sistem Yedeği hazırlanamadı.");
    } finally {
      cleanupBackupPreparationRef.current = false;
      setIsPreparingCleanupBackup(false);
    }
  }

  function confirmCleanupBackupSaved() {
    if (cleanupBackupGateState === "download_initiated") {
      setCleanupBackupGateState("confirmed");
      setCleanupBackupGateError(null);
    }
  }

  async function clearAllCandidateData() {
    setIsCleaning(true);
    setDataManagementMessage(null);
    setDataManagementNotice(null);
    setCleanupResult(null);

    try {
      const result = await clearCandidateData(confirmationText);
      downloadTextFile(result.backup.file_name, result.backup.json);
      setCleanupResult(result);
      setConfirmationText("");
      setDataManagementMessage("Tüm aday verileri temizlendi. İşlem öncesi Tam Sistem Yedeği için indirme isteği başlatıldı.");
    } catch (error) {
      setDataManagementMessage(error instanceof Error ? error.message : "Veri temizleme tamamlanamadı.");
    } finally {
      setIsCleaning(false);
    }
  }

  async function analyzeRestoreFile(file?: File | null) {
    if (!file) {
      return;
    }

    setDataManagementMessage(null);
    setDataManagementNotice(null);
    setRestoreAnalysis(null);
    setRestoreResult(null);
    setRestoreConfirmationText("");

    try {
      const analysis = analyzeSystemBackupFileText(await file.text());
      setRestoreAnalysis(analysis);
      setDataManagementMessage("Sistem yedeği analiz edildi. Geri yüklemeden önce özeti kontrol edin.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Yedek dosyası okunamadı.";
      setDataManagementMessage(message);
      setDataManagementNotice({
        type: "error",
        title: "Tam Sistem Yedeği okunamadı",
        message: `${message} Lütfen Ayarlar > Veri Yönetimi bölümünden alınmış doğru yedek dosyasını seçin.`
      });
    } finally {
      if (restoreFileInputRef.current) {
        restoreFileInputRef.current.value = "";
      }
    }
  }

  async function restoreAnalyzedBackup() {
    if (!restoreAnalysis) {
      setDataManagementMessage("Önce bir Tam Sistem Yedeği dosyası seçin.");
      return;
    }

    setIsRestoring(true);
    setDataManagementMessage(null);
    setRestoreResult(null);

    try {
      const result = await restoreSystemBackup(restoreAnalysis.snapshot, restoreConfirmationText);
      setRestoreResult(result);
      setRestoreConfirmationText("");
      setCleanupBackupGateState("locked");
      setCleanupBackupGateError(null);
      setMaintenanceResetKey((current) => current + 1);
      setDataManagementMessage("Sistem yedeği geri yüklendi.");
      setDataManagementNotice({
        type: "success",
        title: "Geri yükleme tamamlandı",
        message: "Tam Sistem Yedeği başarıyla geri yüklendi. Adaylar, hatırlatmalar ve kayıtlar sisteme geri alındı."
      });
    } catch (error) {
      setDataManagementMessage(error instanceof Error ? error.message : "Geri yükleme tamamlanamadı.");
    } finally {
      setIsRestoring(false);
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

      {dataManagementNotice ? (
        <div className="data-management-notice-backdrop" role="presentation">
          <section
            aria-labelledby="data-management-notice-title"
            aria-modal="true"
            className={`data-management-notice ${dataManagementNotice.type}`}
            role="alertdialog"
          >
            <h2 id="data-management-notice-title">{dataManagementNotice.title}</h2>
            <p>{dataManagementNotice.message}</p>
            <Button type="button" onClick={() => setDataManagementNotice(null)}>
              Tamam
            </Button>
          </section>
        </div>
      ) : null}

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
        <section className="shortcut-navigation-help" aria-label="Sol menü kısayolları">
          <div>
            <h3>Sol menü kısayolları</h3>
            <p>Sol menüdeki sayfalara hızlı geçiş için kullanılır.</p>
          </div>
          <div className="shortcut-navigation-list">
            <span>
              <kbd>L</kbd>
              Aday Listesi
            </span>
            <span>
              <kbd>H</kbd>
              Hatırlatmalar
            </span>
          </div>
        </section>
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
                    className="shortcut-change-button"
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
                <button className="shortcut-reset-button" type="button" onClick={() => void resetShortcut(shortcut.action_key)}>
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
        <p className="muted-text">Tam Sistem Yedeği, programdaki verileri eksiksiz geri yüklemek için kullanılır.</p>

        <div className="toolbar">
          <Button type="button" variant="secondary" onClick={() => void downloadManualBackup()}>
            Tam Sistem Yedeği Al
          </Button>
          <Button type="button" variant="secondary" onClick={() => restoreFileInputRef.current?.click()}>
            Sistem Yedeğinden Geri Yükle
          </Button>
          <input
            ref={restoreFileInputRef}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(event) => void analyzeRestoreFile(event.target.files?.[0])}
          />
          <Button type="button" variant="secondary" disabled>
            İçe aktarma geçmişi
          </Button>
        </div>

        {restoreAnalysis ? (
          <div className="danger-zone">
            <h3>Sistem yedeğinden geri yükle</h3>
            <p>
              Bu işlem mevcut sistem verilerinin yerine yedekteki verileri yükler. İşlem başlamadan önce özeti kontrol edin.
            </p>
            <div className="summary-grid">
              <div className="summary-metric">
                <span>Aday</span>
                <strong>{restoreAnalysis.preview.counts.students}</strong>
              </div>
              <div className="summary-metric">
                <span>Veli</span>
                <strong>{restoreAnalysis.preview.counts.guardians}</strong>
              </div>
              <div className="summary-metric">
                <span>Telefon</span>
                <strong>{restoreAnalysis.preview.counts.phones}</strong>
              </div>
              <div className="summary-metric">
                <span>Görüşme kaydı</span>
                <strong>{restoreAnalysis.preview.counts.call_logs}</strong>
              </div>
              <div className="summary-metric">
                <span>Hatırlatma</span>
                <strong>{restoreAnalysis.preview.counts.reminders}</strong>
              </div>
              <div className="summary-metric">
                <span>Randevu</span>
                <strong>{restoreAnalysis.preview.counts.appointments}</strong>
              </div>
              <div className="summary-metric">
                <span>Ayar</span>
                <strong>{restoreAnalysis.preview.counts.settings}</strong>
              </div>
              <div className="summary-metric">
                <span>Klavye kısayolu</span>
                <strong>{restoreAnalysis.preview.counts.keyboard_shortcuts}</strong>
              </div>
              <div className="summary-metric">
                <span>Yedek tarihi</span>
                <strong>{new Date(restoreAnalysis.preview.metadata.created_at).toLocaleString("tr-TR")}</strong>
              </div>
              <div className="summary-metric">
                <span>Yedek sürümü</span>
                <strong>{restoreAnalysis.preview.metadata.backup_version}</strong>
              </div>
            </div>
            <label className="inline-field">
              Geri yükleme onayı
              <input
                className="danger-confirm-input"
                value={restoreConfirmationText}
                onChange={(event) => setRestoreConfirmationText(event.target.value)}
                placeholder={RESTORE_SYSTEM_BACKUP_CONFIRMATION}
                type="text"
              />
            </label>
            <Button
              type="button"
              disabled={isRestoring || restoreConfirmationText !== RESTORE_SYSTEM_BACKUP_CONFIRMATION}
              onClick={() => void restoreAnalyzedBackup()}
            >
              {isRestoring ? "Geri yükleniyor..." : "Sistem yedeğini geri yükle"}
            </Button>
          </div>
        ) : null}

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
        {restoreResult ? (
          <div className="summary-grid">
            <div className="summary-metric">
              <span>Geri yüklenen aday</span>
              <strong>{restoreResult.restored_counts.students}</strong>
            </div>
            <div className="summary-metric">
              <span>Geri yüklenen veli</span>
              <strong>{restoreResult.restored_counts.guardians}</strong>
            </div>
            <div className="summary-metric">
              <span>Geri yüklenen telefon</span>
              <strong>{restoreResult.restored_counts.phones}</strong>
            </div>
            <div className="summary-metric">
              <span>Geri yüklenen görüşme</span>
              <strong>{restoreResult.restored_counts.call_logs}</strong>
            </div>
          </div>
        ) : null}
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
              <span>İçe aktarma logu</span>
              <strong>{cleanupResult.deleted_import_logs}</strong>
            </div>
          </div>
        ) : null}
      </section>
      ) : null}

      {activeTab === "maintenance" ? (
        <>
          <StudentSearchReindexMaintenance
            backupGateError={cleanupBackupGateError}
            backupGateState={cleanupBackupGateState}
            isPreparingBackup={isPreparingCleanupBackup}
            onConfirmBackupSaved={confirmCleanupBackupSaved}
            onPrepareBackup={() => void prepareCleanupBackup()}
            resetKey={maintenanceResetKey}
          />
          <StudentGroupCleanupMaintenance
            backupGateError={cleanupBackupGateError}
            backupGateState={cleanupBackupGateState}
            isPreparingBackup={isPreparingCleanupBackup}
            onConfirmBackupSaved={confirmCleanupBackupSaved}
            onPrepareBackup={() => void prepareCleanupBackup()}
          />
        </>
      ) : null}

      {activeTab === "reminders" ? (
      <section className="panel">
        <h2>Bildirimler / Hatırlatmalar</h2>
        <p>Uygulama açıkken zamanı gelen tekrar arama hatırlatmaları için ekran içi uyarıları yönetir.</p>
        <label className="toggle-row">
          <span>
            <strong>Ekran içi hatırlatma uyarıları</strong>
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
            <strong>Hatırlatma sesi</strong>
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

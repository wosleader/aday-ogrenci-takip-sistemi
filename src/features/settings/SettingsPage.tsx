import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { Button } from "../../components/Button";
import { PageHeader } from "../../components/PageHeader";
import { DEFAULT_SHORTCUTS } from "../../domain/constants/shortcuts";
import { db } from "../../db/db";
import { downloadTextFile } from "../imports/services/logExport";
import {
  clearCandidateData,
  createDataCleanupBackup,
  DELETE_ALL_STUDENTS_CONFIRMATION,
  type CandidateDataCleanupResult
} from "./services/dataManagement";

export function SettingsPage() {
  const shortcuts = useLiveQuery(() => db.keyboard_shortcuts.toArray(), []);
  const [confirmationText, setConfirmationText] = useState("");
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<CandidateDataCleanupResult | null>(null);
  const [dataManagementMessage, setDataManagementMessage] = useState<string | null>(null);

  async function downloadManualBackup() {
    const backup = await createDataCleanupBackup();
    downloadTextFile(backup.file_name, backup.json);
    setDataManagementMessage("JSON yedek indirildi.");
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
      setDataManagementMessage("Tüm aday verileri temizlendi. İşlem öncesi yedek indirildi.");
    } catch (error) {
      setDataManagementMessage(error instanceof Error ? error.message : "Veri temizleme tamamlanamadı.");
    } finally {
      setIsCleaning(false);
    }
  }

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

      <section className="panel data-management-panel">
        <h2>Veri Yönetimi</h2>
        <p>Aday verilerini temizlemeden önce otomatik JSON yedek alınır. Ayarlar, kampanyalar ve kısayollar korunur.</p>

        <div className="toolbar">
          <Button type="button" variant="secondary" onClick={() => void downloadManualBackup()}>
            Yedek al
          </Button>
          <Button type="button" variant="secondary" disabled>
            Yedekten geri yükle
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
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { Button } from "../../components/Button";
import {
  reindexActiveStudentSearchText,
  type StudentSearchReindexResult
} from "../students/services/studentSearchReindex";
import type { StudentGroupCleanupBackupGateState } from "./StudentGroupCleanupMaintenance";

type StudentSearchReindexMaintenanceProps = {
  backupGateError: string | null;
  backupGateState: StudentGroupCleanupBackupGateState;
  isPreparingBackup: boolean;
  onConfirmBackupSaved: () => void;
  onPrepareBackup: () => void;
  resetKey: number;
};

type Feedback = { type: "error"; message: string };

export function StudentSearchReindexMaintenance({
  backupGateError,
  backupGateState,
  isPreparingBackup,
  onConfirmBackupSaved,
  onPrepareBackup,
  resetKey
}: StudentSearchReindexMaintenanceProps) {
  const [isOperationConfirmed, setIsOperationConfirmed] = useState(false);
  const [isBackupFlowInitiated, setIsBackupFlowInitiated] = useState(false);
  const [isReindexing, setIsReindexing] = useState(false);
  const [result, setResult] = useState<StudentSearchReindexResult | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const reindexSubmissionRef = useRef(false);

  useEffect(() => {
    setIsOperationConfirmed(false);
    setIsBackupFlowInitiated(false);
    setIsReindexing(false);
    setResult(null);
    setFeedback(null);
    reindexSubmissionRef.current = false;
  }, [resetKey]);

  async function runReindex() {
    if (
      backupGateState !== "confirmed" ||
      !isOperationConfirmed ||
      isReindexing ||
      reindexSubmissionRef.current
    ) {
      return;
    }

    reindexSubmissionRef.current = true;
    setIsReindexing(true);
    setResult(null);
    setFeedback(null);

    try {
      setResult(await reindexActiveStudentSearchText());
    } catch {
      setFeedback({
        type: "error",
        message: "İşlem tamamlanamadı. Arama indeksi güncellemesi uygulanmadı."
      });
    } finally {
      reindexSubmissionRef.current = false;
      setIsReindexing(false);
      setIsOperationConfirmed(false);
    }
  }

  const canRun = backupGateState === "confirmed" && isOperationConfirmed && !isReindexing;

  function prepareBackup() {
    setIsBackupFlowInitiated(true);
    onPrepareBackup();
  }

  return (
    <section className="panel student-search-reindex-maintenance" aria-labelledby="student-search-reindex-title">
      <header className="student-search-reindex-header">
        <div>
          <h2 id="student-search-reindex-title">Arama İndeksini Yeniden Oluştur</h2>
          <p>Bu işlem yalnız bu tarayıcı profilindeki aktif adayların arama metnini yeniden oluşturur.</p>
        </div>
      </header>

      <div className="student-search-reindex-notes">
        <p>Profil, kategori, kampanya, not ve ilişki bilgileri değiştirilmez.</p>
        <p>Bu işlem kayıt verilerini düzeltmez; yalnız arama indeksini yeniden oluşturur.</p>
        <p>Yedekleme ve indeks yenileme sırasında aynı uygulamanın başka sekmelerinde aday verisi değişikliği yapmayın.</p>
      </div>

      <section className="student-search-reindex-backup-gate" aria-label="Tam Sistem Yedeği onayı">
        <h3>İşlem öncesi Tam Sistem Yedeği</h3>
        <p>
          Uygulama yalnız indirme isteğinin başlatıldığını bilebilir. Yedek dosyasının diskte saklandığını teknik olarak
          doğrulayamaz.
        </p>
        {backupGateState === "locked" ? (
          <Button
            aria-label="Arama indeksi için Tam Sistem Yedeği Al"
            disabled={isPreparingBackup || isReindexing}
            type="button"
            variant="secondary"
            onClick={prepareBackup}
          >
            {isPreparingBackup ? "Yedek hazırlanıyor..." : "Tam Sistem Yedeği Al"}
          </Button>
        ) : null}
        {backupGateState === "download_initiated" && isBackupFlowInitiated ? (
          <label className="student-search-reindex-confirmation">
            <input
              checked={false}
              disabled={isReindexing}
              onChange={(event) => event.target.checked && onConfirmBackupSaved()}
              type="checkbox"
            />
            <span>Yedek dosyasını sakladığımı doğruluyorum.</span>
          </label>
        ) : null}
        {backupGateError && isBackupFlowInitiated ? (
          <p className="student-search-reindex-feedback error" role="alert">{backupGateError}</p>
        ) : null}
        {backupGateState === "confirmed" ? (
          <p className="student-search-reindex-backup-confirmed" role="status">
            Bu Ayarlar oturumunda Tam Sistem Yedeği için saklama onayı alındı. Arama indeksi için ikinci bir yedek
            almanız gerekmez.
          </p>
        ) : null}
      </section>

      {backupGateState === "confirmed" ? (
        <label className="student-search-reindex-confirmation">
          <input
            checked={isOperationConfirmed}
            disabled={isReindexing}
            onChange={(event) => setIsOperationConfirmed(event.target.checked)}
            type="checkbox"
          />
          <span>Arama indeksini bu tarayıcı profili için yeniden oluşturmak istediğimi onaylıyorum.</span>
        </label>
      ) : null}

      <div className="student-search-reindex-actions">
        <Button disabled={!canRun} type="button" onClick={() => void runReindex()}>
          {isReindexing ? "Arama indeksi yenileniyor..." : "Arama İndeksini Yeniden Oluştur"}
        </Button>
      </div>

      {feedback ? <p className="student-search-reindex-feedback error" role="alert">{feedback.message}</p> : null}
      {result ? (
        <section className="student-search-reindex-result" role="status">
          <p>Arama indeksi bu tarayıcı profili için güncellendi.</p>
          <dl>
            <div>
              <dt>Taranan aktif aday</dt>
              <dd>{result.scanned_students}</dd>
            </div>
            <div>
              <dt>Güncellenen arama metni</dt>
              <dd>{result.updated_students}</dd>
            </div>
          </dl>
          {result.updated_students === 0 ? <p>Arama indeksi zaten güncel.</p> : null}
        </section>
      ) : null}
    </section>
  );
}

import { useLiveQuery } from "dexie-react-hooks";
import { useMemo, useRef, useState } from "react";
import { Button } from "../../components/Button";
import {
  correctStudentGroupCleanupCandidate,
  StudentGroupCleanupCorrectionError,
  type StudentGroupCleanupTargetMode
} from "../students/services/studentGroupCleanupCorrection";
import {
  readHardcodedStudentGroupCleanupCandidates,
  type StudentGroupCleanupCandidate,
  type StudentGroupCleanupRiskLevel
} from "../students/services/studentCleanupCandidates";

export type StudentGroupCleanupBackupGateState = "locked" | "download_initiated" | "confirmed";

type StudentGroupCleanupMaintenanceProps = {
  backupGateError: string | null;
  backupGateState: StudentGroupCleanupBackupGateState;
  isPreparingBackup: boolean;
  onConfirmBackupSaved: () => void;
  onPrepareBackup: () => void;
};

type CandidateFilter = "all" | StudentGroupCleanupRiskLevel;
type Feedback = { type: "success" | "error"; message: string };
type CandidateReview = {
  candidate: StudentGroupCleanupCandidate;
  targetMode: StudentGroupCleanupTargetMode;
  targetStudentGroup: string;
  correctionReason: string;
  isCorrectionConfirmed: boolean;
  isBackupGateVisible: boolean;
  inlineError: string | null;
};

const FILTERS: Array<{ value: CandidateFilter; label: string }> = [
  { value: "all", label: "Tümü" },
  { value: "high_confidence", label: "Yüksek olasılıklı" },
  { value: "needs_review", label: "İnceleme gerekli" }
];

function riskLabel(riskLevel: StudentGroupCleanupRiskLevel): string {
  return riskLevel === "high_confidence" ? "Yüksek olasılıklı" : "İnceleme gerekli";
}

function formatValue(value?: string | number | null): string {
  return value == null || value === "" ? "-" : String(value);
}

function formatDateTime(value: string): string {
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

function sourceLabel(candidate: StudentGroupCleanupCandidate): string | null {
  const values = [candidate.source_file_name, candidate.source_sheet_name, candidate.source_row_number ? `Satır ${candidate.source_row_number}` : null]
    .filter(Boolean)
    .map(String);

  return values.length ? values.join(" · ") : null;
}

function createReview(candidate: StudentGroupCleanupCandidate): CandidateReview {
  return {
    candidate,
    targetMode: "verified_value",
    targetStudentGroup: "",
    correctionReason: "",
    isCorrectionConfirmed: false,
    isBackupGateVisible: false,
    inlineError: null
  };
}

export function StudentGroupCleanupMaintenance({
  backupGateError,
  backupGateState,
  isPreparingBackup,
  onConfirmBackupSaved,
  onPrepareBackup
}: StudentGroupCleanupMaintenanceProps) {
  const candidates = useLiveQuery(() => readHardcodedStudentGroupCleanupCandidates(), [], []);
  const [activeFilter, setActiveFilter] = useState<CandidateFilter>("all");
  const [review, setReview] = useState<CandidateReview | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const correctionSubmissionRef = useRef(false);
  const counts = useMemo(
    () => ({
      all: candidates.length,
      high_confidence: candidates.filter((candidate) => candidate.risk_level === "high_confidence").length,
      needs_review: candidates.filter((candidate) => candidate.risk_level === "needs_review").length
    }),
    [candidates]
  );
  const filteredCandidates = useMemo(
    () => candidates.filter((candidate) => activeFilter === "all" || candidate.risk_level === activeFilter),
    [activeFilter, candidates]
  );

  function closeReview() {
    if (!isSubmitting && !isPreparingBackup) {
      setReview(null);
    }
  }

  function openReview(candidate: StudentGroupCleanupCandidate) {
    setFeedback((current) => (current?.type === "success" ? null : current));
    setReview(createReview(candidate));
  }

  function updateReview(updates: Partial<CandidateReview>) {
    setReview((current) => (current ? { ...current, ...updates } : current));
  }

  async function submitCorrection() {
    if (!review || isSubmitting || correctionSubmissionRef.current) {
      return;
    }

    const correctionReason = review.correctionReason.trim();
    const targetStudentGroup = review.targetStudentGroup.trim();

    if (review.targetMode === "verified_value" && !targetStudentGroup) {
      updateReview({ inlineError: "Doğrulanmış öğrenci grubu boş olamaz." });
      return;
    }

    if (!correctionReason) {
      updateReview({ inlineError: "Düzeltme nedeni boş olamaz." });
      return;
    }

    if (!review.isCorrectionConfirmed) {
      updateReview({ inlineError: "Düzeltme işlemi için açık onay gereklidir." });
      return;
    }

    if (backupGateState !== "confirmed") {
      updateReview({ inlineError: null, isBackupGateVisible: true });
      return;
    }

    correctionSubmissionRef.current = true;
    setIsSubmitting(true);
    updateReview({ inlineError: null });

    try {
      await correctStudentGroupCleanupCandidate({
        student_id: review.candidate.id,
        expected_updated_at: review.candidate.updated_at,
        target_mode: review.targetMode,
        target_student_group: review.targetMode === "verified_value" ? targetStudentGroup : undefined,
        correction_reason: correctionReason,
        performed_by: "agent"
      });
      setReview(null);
      setFeedback({ type: "success", message: "Öğrenci grubu düzeltildi. Aday listesi güncellendi." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Öğrenci grubu düzeltilemedi.";

      if (
        error instanceof StudentGroupCleanupCorrectionError &&
        ["student_missing", "student_deleted", "student_stale", "not_cleanup_candidate"].includes(error.code)
      ) {
        setReview(null);
        setFeedback({ type: "error", message: `${message} Liste güncellendi; gerekiyorsa kaydı yeniden inceleyin.` });
      } else {
        updateReview({ inlineError: message });
      }
    } finally {
      correctionSubmissionRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <section className="panel student-group-cleanup-maintenance" aria-labelledby="student-group-cleanup-title">
      <header className="student-group-cleanup-header">
        <div>
          <h2 id="student-group-cleanup-title">Veri Sağlığı / Bakım</h2>
          <p>
            Eski öğrenci grubu fallback değerinden etkilenmiş olabilecek kayıtları tek tek inceleyin ve doğrulanmış
            bilgiyle düzeltin.
          </p>
        </div>
        <div className="student-group-cleanup-counts" aria-label="Cleanup aday sayıları">
          <span>Toplam: {counts.all}</span>
          <span>Yüksek olasılıklı: {counts.high_confidence}</span>
          <span>İnceleme gerekli: {counts.needs_review}</span>
        </div>
      </header>

      {feedback ? (
        <p className={`student-group-cleanup-feedback ${feedback.type}`} role={feedback.type === "error" ? "alert" : "status"}>
          {feedback.message}
        </p>
      ) : null}

      <div className="student-group-cleanup-filters" aria-label="Cleanup aday filtreleri">
        {FILTERS.map((filter) => (
          <button
            aria-pressed={activeFilter === filter.value}
            className={`student-group-cleanup-filter ${activeFilter === filter.value ? "active" : ""}`}
            key={filter.value}
            onClick={() => setActiveFilter(filter.value)}
            type="button"
          >
            {filter.label} ({counts[filter.value]})
          </button>
        ))}
      </div>

      {filteredCandidates.length ? (
        <div className="student-group-cleanup-list">
          {filteredCandidates.map((candidate) => {
            const source = sourceLabel(candidate);

            return (
              <article className="student-group-cleanup-card" key={candidate.id}>
                <div className="student-group-cleanup-card-header">
                  <div>
                    <h3>{candidate.full_name}</h3>
                    <span className={`student-group-cleanup-risk ${candidate.risk_level}`}>{riskLabel(candidate.risk_level)}</span>
                  </div>
                  <Button type="button" variant="secondary" onClick={() => openReview(candidate)}>
                    Öğrenci grubunu düzelt
                  </Button>
                </div>
                <dl className="student-group-cleanup-context">
                  <div>
                    <dt>Sınıf</dt>
                    <dd>{formatValue(candidate.current_class)}</dd>
                  </div>
                  <div>
                    <dt>Mevcut öğrenci grubu</dt>
                    <dd>{formatValue(candidate.student_group)}</dd>
                  </div>
                  <div>
                    <dt>Kategori</dt>
                    <dd>{formatValue(candidate.category)}</dd>
                  </div>
                  <div>
                    <dt>Oluşturulma</dt>
                    <dd>{formatDateTime(candidate.created_at)}</dd>
                  </div>
                  <div>
                    <dt>Güncellenme</dt>
                    <dd>{formatDateTime(candidate.updated_at)}</dd>
                  </div>
                  {source ? (
                    <div className="student-group-cleanup-context-wide">
                      <dt>Kaynak</dt>
                      <dd>{source}</dd>
                    </div>
                  ) : null}
                  <div className="student-group-cleanup-context-wide">
                    <dt>İnceleme nedeni</dt>
                    <dd>{candidate.reason}</dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="student-group-cleanup-empty">Bu filtre için cleanup adayı bulunmadı.</p>
      )}

      {review ? (
        <section className="student-group-cleanup-modal-backdrop" role="presentation">
          <section
            aria-labelledby="student-group-cleanup-review-title"
            aria-modal="true"
            className="student-group-cleanup-modal"
            role="dialog"
          >
            <header>
              <h2 id="student-group-cleanup-review-title">Öğrenci grubunu düzelt</h2>
              <p>Bu kayıt için yalnız doğrulanmış bilgiyi kullanın. Sınıf veya kategori üzerinden değer türetilmez.</p>
            </header>

            <dl className="student-group-cleanup-review-context">
              <div>
                <dt>Aday</dt>
                <dd>{review.candidate.full_name}</dd>
              </div>
              <div>
                <dt>Sınıf</dt>
                <dd>{formatValue(review.candidate.current_class)}</dd>
              </div>
              <div>
                <dt>Mevcut öğrenci grubu</dt>
                <dd>{review.candidate.student_group}</dd>
              </div>
              <div>
                <dt>Kategori</dt>
                <dd>{review.candidate.category}</dd>
              </div>
              <div>
                <dt>Risk</dt>
                <dd>{riskLabel(review.candidate.risk_level)}</dd>
              </div>
              <div>
                <dt>İnceleme nedeni</dt>
                <dd>{review.candidate.reason}</dd>
              </div>
              <div>
                <dt>Oluşturulma</dt>
                <dd>{formatDateTime(review.candidate.created_at)}</dd>
              </div>
              <div>
                <dt>Güncellenme</dt>
                <dd>{formatDateTime(review.candidate.updated_at)}</dd>
              </div>
              {sourceLabel(review.candidate) ? (
                <div>
                  <dt>Kaynak</dt>
                  <dd>{sourceLabel(review.candidate)}</dd>
                </div>
              ) : null}
            </dl>

            <fieldset className="student-group-cleanup-target-mode">
              <legend>Yeni öğrenci grubu</legend>
              <label>
                <input
                  checked={review.targetMode === "verified_value"}
                  disabled={isSubmitting || isPreparingBackup}
                  name="student-group-cleanup-target-mode"
                  onChange={() => updateReview({ inlineError: null, targetMode: "verified_value" })}
                  type="radio"
                />
                <span>
                  <strong>Doğrulanmış değer</strong>
                  <small>Kaynak veriden doğrulanmış gerçek öğrenci grubunu yazın.</small>
                </span>
              </label>
              <label>
                <input
                  checked={review.targetMode === "unspecified"}
                  disabled={isSubmitting || isPreparingBackup}
                  name="student-group-cleanup-target-mode"
                  onChange={() => updateReview({ inlineError: null, targetMode: "unspecified" })}
                  type="radio"
                />
                <span>
                  <strong>Belirtilmemiş</strong>
                  <small>Kaynakta öğrenci grubu yoksa veya boşsa kaydı boş değerle düzeltir.</small>
                </span>
              </label>
            </fieldset>

            {review.targetMode === "verified_value" ? (
              <label className="student-group-cleanup-field">
                Doğrulanmış öğrenci grubu
                <input
                  disabled={isSubmitting || isPreparingBackup}
                  onChange={(event) => updateReview({ inlineError: null, targetStudentGroup: event.target.value })}
                  placeholder="Örn. 8. Sınıf LGS Hazırlık"
                  type="text"
                  value={review.targetStudentGroup}
                />
              </label>
            ) : null}

            <label className="student-group-cleanup-field">
              Düzeltme nedeni
              <textarea
                disabled={isSubmitting || isPreparingBackup}
                onChange={(event) => updateReview({ inlineError: null, correctionReason: event.target.value })}
                placeholder="Kaynak Excel ile doğrulandı."
                value={review.correctionReason}
              />
            </label>

            <label className="student-group-cleanup-confirmation">
              <input
                checked={review.isCorrectionConfirmed}
                disabled={isSubmitting || isPreparingBackup}
                onChange={(event) => updateReview({ inlineError: null, isCorrectionConfirmed: event.target.checked })}
                type="checkbox"
              />
              <span>Bu kaydın öğrenci grubunu seçtiğim değerle düzeltmek istediğimi onaylıyorum.</span>
            </label>

            {review.isBackupGateVisible ? (
              <section className="student-group-cleanup-backup-gate" aria-label="Tam Sistem Yedeği onayı">
                <h3>Düzeltme öncesi Tam Sistem Yedeği</h3>
                <p>
                  İlk düzeltmeden önce yedek gereklidir. Uygulama dosyanın diskte saklandığını doğrulayamaz; indirme
                  isteğinden sonra saklama onayı sizden alınır.
                </p>
                {backupGateState === "locked" ? (
                  <Button disabled={isPreparingBackup} type="button" variant="secondary" onClick={onPrepareBackup}>
                    {isPreparingBackup ? "Yedek hazırlanıyor..." : "Tam Sistem Yedeği Al"}
                  </Button>
                ) : null}
                {backupGateState === "download_initiated" ? (
                  <label className="student-group-cleanup-confirmation">
                    <input checked={false} onChange={(event) => event.target.checked && onConfirmBackupSaved()} type="checkbox" />
                    <span>Yedek dosyasını sakladığımı doğruluyorum.</span>
                  </label>
                ) : null}
                {backupGateState === "confirmed" ? (
                  <p className="student-group-cleanup-backup-confirmed" role="status">
                    Yedek onayı bu Ayarlar oturumu için alındı. Düzeltmeyi uygulamak için tekrar onaylayın.
                  </p>
                ) : null}
                {backupGateError ? <p className="student-group-cleanup-feedback error" role="alert">{backupGateError}</p> : null}
              </section>
            ) : null}

            {review.inlineError ? <p className="student-group-cleanup-feedback error" role="alert">{review.inlineError}</p> : null}

            <div className="student-group-cleanup-modal-actions">
              <Button disabled={isSubmitting || isPreparingBackup} type="button" variant="secondary" onClick={closeReview}>
                Vazgeç
              </Button>
              <Button disabled={isSubmitting || isPreparingBackup} type="button" onClick={() => void submitCorrection()}>
                {isSubmitting ? "Düzeltiliyor..." : "Düzeltmeyi uygula"}
              </Button>
            </div>
          </section>
        </section>
      ) : null}
    </section>
  );
}

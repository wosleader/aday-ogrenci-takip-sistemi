import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { db } from "../../src/db/db";
import type { StudentRecord } from "../../src/domain/models/student";
import { SettingsPage } from "../../src/features/settings/SettingsPage";
import {
  createDataCleanupBackup,
  RESTORE_SYSTEM_BACKUP_CONFIRMATION
} from "../../src/features/settings/services/dataManagement";
import { HARDCODED_STUDENT_GROUP_FALLBACK } from "../../src/features/students/services/studentCleanupCandidates";
import { createSearchText, normalizeText } from "../../src/utils/normalizeText";
import * as dataManagement from "../../src/features/settings/services/dataManagement";

const { downloadTextFileMock, reindexActiveStudentSearchTextMock } = vi.hoisted(() => ({
  downloadTextFileMock: vi.fn(),
  reindexActiveStudentSearchTextMock: vi.fn()
}));

vi.mock("../../src/features/imports/services/logExport", () => ({
  downloadTextFile: downloadTextFileMock
}));

vi.mock("../../src/features/students/services/studentSearchReindex", () => ({
  reindexActiveStudentSearchText: reindexActiveStudentSearchTextMock
}));

const backupSavedLabel = "Yedek dosyasını sakladığımı doğruluyorum.";
const operationConfirmationLabel = "Arama indeksini bu tarayıcı profili için yeniden oluşturmak istediğimi onaylıyorum.";
const reindexActionLabel = "Arama İndeksini Yeniden Oluştur";
const backupActionLabel = "Arama indeksi için Tam Sistem Yedeği Al";
const sharedBackupStatus =
  "Bu Ayarlar oturumunda Tam Sistem Yedeği için saklama onayı alındı. Arama indeksi için ikinci bir yedek almanız gerekmez.";

async function seedCleanupCandidate() {
  const fullName = "Paylaşılan Yedek Adayı";
  const candidate: StudentRecord = {
    uuid: crypto.randomUUID(),
    student_full_name: fullName,
    normalized_student_name: normalizeText(fullName),
    search_text: createSearchText([fullName, "8", HARDCODED_STUDENT_GROUP_FALLBACK]),
    current_class: "8",
    student_group: HARDCODED_STUDENT_GROUP_FALLBACK,
    category: "YKS",
    campaign_id: null,
    lifecycle_status: "candidate",
    last_call_result: "not_called",
    source_file_name: "legacy.xlsx",
    source_sheet_name: "Adaylar",
    source_row_number: 7,
    sync_status: "local",
    created_at: "2026-08-18T10:00:00.000Z",
    updated_at: "2026-08-18T10:00:00.000Z",
    deleted_at: null
  };

  await db.students.add(candidate);
}

async function renderMaintenance() {
  const user = userEvent.setup();
  const result = render(<SettingsPage />);

  await user.click(screen.getByRole("tab", { name: "Veri Sağlığı / Bakım" }));
  await screen.findByRole("heading", { name: "Arama İndeksini Yeniden Oluştur" });

  return { user, ...result };
}

async function confirmBackupGate(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: backupActionLabel }));
  await user.click(await screen.findByLabelText(backupSavedLabel));
}

async function confirmAndRun(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByLabelText(operationConfirmationLabel));
  await user.click(screen.getByRole("button", { name: reindexActionLabel }));
}

function getRestoreFileInput(): HTMLInputElement {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]');
  expect(input).not.toBeNull();
  return input as HTMLInputElement;
}

describe("StudentSearchReindexMaintenance", () => {
  beforeEach(async () => {
    downloadTextFileMock.mockReset();
    downloadTextFileMock.mockImplementation(() => undefined);
    reindexActiveStudentSearchTextMock.mockReset();
    await db.delete();
    await db.open();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await db.delete();
  });

  it("renders the profile-scoped maintenance section with the reindex action locked", async () => {
    await renderMaintenance();

    expect(screen.getByText("Bu işlem yalnız bu tarayıcı profilindeki aktif adayların arama metnini yeniden oluşturur.")).toBeInTheDocument();
    expect(screen.getByText("Bu işlem kayıt verilerini düzeltmez; yalnız arama indeksini yeniden oluşturur.")).toBeInTheDocument();
    expect(screen.getByText(/başka sekmelerinde aday verisi değişikliği yapmayın/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: reindexActionLabel })).toBeDisabled();
    expect(screen.queryByLabelText(operationConfirmationLabel)).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /onay/i })).not.toBeInTheDocument();
    expect(reindexActiveStudentSearchTextMock).not.toHaveBeenCalled();
  });

  it("uses the existing backup service and requires saved-file attestation before operation confirmation", async () => {
    const createBackupSpy = vi.spyOn(dataManagement, "createDataCleanupBackup");
    const { user } = await renderMaintenance();

    await user.click(screen.getByRole("button", { name: backupActionLabel }));

    expect(createBackupSpy).toHaveBeenCalledTimes(1);
    expect(downloadTextFileMock).toHaveBeenCalledTimes(1);
    expect(await screen.findByLabelText(backupSavedLabel)).toBeInTheDocument();
    expect(screen.queryByLabelText(operationConfirmationLabel)).not.toBeInTheDocument();

    await user.click(screen.getByLabelText(backupSavedLabel));

    expect(await screen.findByLabelText(operationConfirmationLabel)).not.toBeChecked();
    expect(screen.getByRole("button", { name: reindexActionLabel })).toBeDisabled();
  });

  it("keeps the gate locked and visible when backup download initiation fails", async () => {
    downloadTextFileMock.mockImplementationOnce(() => {
      throw new Error("İndirme isteği başlatılamadı.");
    });
    const { user } = await renderMaintenance();

    await user.click(screen.getByRole("button", { name: backupActionLabel }));

    expect(await screen.findByRole("alert")).toHaveTextContent("İndirme isteği başlatılamadı.");
    expect(screen.queryByLabelText(backupSavedLabel)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(operationConfirmationLabel)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: reindexActionLabel })).toBeDisabled();
  });

  it("unlocks reindex only after cleanup-side saved-file attestation in the shared Settings session", async () => {
    await seedCleanupCandidate();
    const { user } = await renderMaintenance();

    expect(screen.getByRole("button", { name: reindexActionLabel })).toBeDisabled();
    expect(screen.queryByText(sharedBackupStatus)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(operationConfirmationLabel)).not.toBeInTheDocument();

    const card = (await screen.findByText("Paylaşılan Yedek Adayı")).closest("article");
    expect(card).not.toBeNull();
    await user.click(within(card as HTMLElement).getByRole("button", { name: "Öğrenci grubunu düzelt" }));
    const dialog = await screen.findByRole("dialog", { name: "Öğrenci grubunu düzelt" });

    await user.type(within(dialog).getByLabelText("Doğrulanmış öğrenci grubu"), "8. Sınıf LGS Hazırlık");
    await user.type(within(dialog).getByLabelText("Düzeltme nedeni"), "Kaynak Excel ile doğrulandı.");
    await user.click(within(dialog).getByLabelText(/Bu kaydın öğrenci grubunu/));
    await user.click(within(dialog).getByRole("button", { name: "Düzeltmeyi uygula" }));

    await user.click(within(dialog).getByRole("button", { name: "Tam Sistem Yedeği Al" }));
    await screen.findByLabelText(backupSavedLabel);

    expect(screen.queryByText(sharedBackupStatus)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(operationConfirmationLabel)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: reindexActionLabel })).toBeDisabled();
    expect(reindexActiveStudentSearchTextMock).not.toHaveBeenCalled();

    await user.click(within(dialog).getByLabelText(backupSavedLabel));

    expect(await screen.findByText(sharedBackupStatus)).toHaveAttribute("role", "status");
    expect(await screen.findByLabelText(operationConfirmationLabel)).not.toBeChecked();
    expect(screen.getByRole("button", { name: reindexActionLabel })).toBeDisabled();
    expect(reindexActiveStudentSearchTextMock).not.toHaveBeenCalled();
  });

  it("invokes the reindex service exactly once and shows profile-scoped success counters", async () => {
    let resolveReindex: ((value: { scanned_students: number; updated_students: number }) => void) | undefined;
    reindexActiveStudentSearchTextMock.mockImplementationOnce(
      () => new Promise((resolve) => {
        resolveReindex = resolve;
      })
    );
    const { user } = await renderMaintenance();

    await confirmBackupGate(user);
    await user.click(screen.getByLabelText(operationConfirmationLabel));
    const action = screen.getByRole("button", { name: reindexActionLabel });
    fireEvent.click(action);
    fireEvent.click(action);

    expect(reindexActiveStudentSearchTextMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Arama indeksi yenileniyor..." })).toBeDisabled();

    resolveReindex?.({ scanned_students: 10, updated_students: 7 });

    expect(await screen.findByText("Arama indeksi bu tarayıcı profili için güncellendi.")).toBeInTheDocument();
    expect(screen.getByText("Taranan aktif aday")).toBeInTheDocument();
    expect(screen.getByText("Güncellenen arama metni")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByLabelText(operationConfirmationLabel)).not.toBeChecked();
  });

  it("shows zero updates as informational success and requires fresh confirmation for the next run", async () => {
    reindexActiveStudentSearchTextMock.mockResolvedValue({ scanned_students: 10, updated_students: 0 });
    const { user } = await renderMaintenance();

    await confirmBackupGate(user);
    await confirmAndRun(user);

    expect(await screen.findByText("Arama indeksi zaten güncel.")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByLabelText(operationConfirmationLabel)).not.toBeChecked();
    expect(screen.getByRole("button", { name: reindexActionLabel })).toBeDisabled();

    await confirmAndRun(user);
    await waitFor(() => expect(reindexActiveStudentSearchTextMock).toHaveBeenCalledTimes(2));
  });

  it("keeps the surface open without success counters when reindex fails", async () => {
    reindexActiveStudentSearchTextMock.mockRejectedValueOnce(new Error("write failed"));
    const { user } = await renderMaintenance();

    await confirmBackupGate(user);
    await confirmAndRun(user);

    expect(await screen.findByRole("alert")).toHaveTextContent("İşlem tamamlanamadı. Arama indeksi güncellemesi uygulanmadı.");
    expect(screen.queryByText("Taranan aktif aday")).not.toBeInTheDocument();
    expect(screen.queryByText("Güncellenen arama metni")).not.toBeInTheDocument();
    expect(screen.getByLabelText(operationConfirmationLabel)).not.toBeChecked();
    expect(screen.getByRole("heading", { name: "Arama İndeksini Yeniden Oluştur" })).toBeInTheDocument();
  });

  it("resets the backup gate on Settings remount", async () => {
    const first = await renderMaintenance();

    await confirmBackupGate(first.user);
    first.unmount();

    await renderMaintenance();

    expect(screen.queryByLabelText(backupSavedLabel)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(operationConfirmationLabel)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: reindexActionLabel })).toBeDisabled();
  });

  it("resets the shared backup gate after a successful full system restore", async () => {
    const backup = await createDataCleanupBackup();
    const { user } = await renderMaintenance();

    await confirmBackupGate(user);
    await user.click(screen.getByRole("tab", { name: "Veri Yönetimi" }));
    fireEvent.change(getRestoreFileInput(), {
      target: { files: [new File([backup.json], "backup.json", { type: "application/json" })] }
    });
    await screen.findByText("Sistem yedeği analiz edildi. Geri yüklemeden önce özeti kontrol edin.");
    await user.type(screen.getByPlaceholderText(RESTORE_SYSTEM_BACKUP_CONFIRMATION), RESTORE_SYSTEM_BACKUP_CONFIRMATION);
    await user.click(screen.getByRole("button", { name: "Sistem yedeğini geri yükle" }));
    await screen.findByRole("alertdialog", { name: "Geri yükleme tamamlandı" });
    await user.click(screen.getByRole("button", { name: "Tamam" }));

    await user.click(screen.getByRole("tab", { name: "Veri Sağlığı / Bakım" }));
    await screen.findByRole("heading", { name: "Arama İndeksini Yeniden Oluştur" });

    expect(screen.queryByLabelText(backupSavedLabel)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(operationConfirmationLabel)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: reindexActionLabel })).toBeDisabled();
  });
});

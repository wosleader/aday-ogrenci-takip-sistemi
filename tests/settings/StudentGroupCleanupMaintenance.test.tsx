import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../../src/db/db";
import type { StudentRecord } from "../../src/domain/models/student";
import { SettingsPage } from "../../src/features/settings/SettingsPage";
import {
  createDataCleanupBackup,
  RESTORE_SYSTEM_BACKUP_CONFIRMATION
} from "../../src/features/settings/services/dataManagement";
import { HARDCODED_STUDENT_GROUP_FALLBACK } from "../../src/features/students/services/studentCleanupCandidates";
import * as studentGroupCleanupCorrection from "../../src/features/students/services/studentGroupCleanupCorrection";
import { createSearchText, normalizeText } from "../../src/utils/normalizeText";

const { downloadTextFileMock } = vi.hoisted(() => ({ downloadTextFileMock: vi.fn() }));

vi.mock("../../src/features/imports/services/logExport", () => ({
  downloadTextFile: downloadTextFileMock
}));

const timestamp = "2026-08-18T10:00:00.000Z";

function student(overrides: Partial<StudentRecord> = {}): StudentRecord {
  const fullName = overrides.student_full_name ?? "Ayşe Yılmaz";

  return {
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
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    ...overrides
  };
}

async function seedCandidate(overrides: Partial<StudentRecord> = {}) {
  return db.students.add(student(overrides));
}

async function renderMaintenance() {
  const user = userEvent.setup();
  const result = render(<SettingsPage />);

  await user.click(screen.getByRole("tab", { name: "Veri Sağlığı / Bakım" }));
  await screen.findByRole("heading", { name: "Veri Sağlığı / Bakım" });

  return { user, ...result };
}

async function openReview(user: ReturnType<typeof userEvent.setup>, fullName: string) {
  const card = (await screen.findByText(fullName)).closest("article");
  expect(card).not.toBeNull();

  await user.click(within(card as HTMLElement).getByRole("button", { name: "Öğrenci grubunu düzelt" }));

  return screen.findByRole("dialog", { name: "Öğrenci grubunu düzelt" });
}

function getRestoreFileInput(): HTMLInputElement {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]');
  expect(input).not.toBeNull();
  return input as HTMLInputElement;
}

async function fillConfirmedCorrection(
  user: ReturnType<typeof userEvent.setup>,
  dialog: HTMLElement,
  target = "8. Sınıf LGS Hazırlık"
) {
  await user.type(within(dialog).getByLabelText("Doğrulanmış öğrenci grubu"), target);
  await user.type(within(dialog).getByLabelText("Düzeltme nedeni"), "Kaynak Excel ile doğrulandı.");
  await user.click(within(dialog).getByLabelText(/Bu kaydın öğrenci grubunu/));
}

async function confirmBackupGate(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Tam Sistem Yedeği Al" }));
  await screen.findByLabelText("Yedek dosyasını sakladığımı doğruluyorum.");
  await user.click(screen.getByLabelText("Yedek dosyasını sakladığımı doğruluyorum."));
}

describe("StudentGroupCleanupMaintenance", () => {
  beforeEach(async () => {
    downloadTextFileMock.mockReset();
    downloadTextFileMock.mockImplementation(() => undefined);
    await db.delete();
    await db.open();
  });

  afterEach(async () => {
    await db.delete();
  });

  it("renders safe candidate filters and excludes compatible 11th grade records", async () => {
    await seedCandidate({ student_full_name: "Ayşe Yılmaz", current_class: "8" });
    await seedCandidate({ student_full_name: "Mezun Aday", current_class: "Mezun", category: "Diger" });
    await seedCandidate({ student_full_name: "On Birinci Sınıf", current_class: "11" });
    const { user } = await renderMaintenance();
    await screen.findByText("Ayşe Yılmaz");

    const counts = screen.getByLabelText("Cleanup aday sayıları");
    expect(within(counts).getByText("Toplam: 2")).toBeInTheDocument();
    expect(within(counts).getByText("Yüksek olasılıklı: 1")).toBeInTheDocument();
    expect(within(counts).getByText("İnceleme gerekli: 1")).toBeInTheDocument();
    expect(await screen.findByText("Ayşe Yılmaz")).toBeInTheDocument();
    expect(screen.getByText("Mezun Aday")).toBeInTheDocument();
    expect(screen.queryByText("On Birinci Sınıf")).not.toBeInTheDocument();
    expect(screen.queryByText(/Kesin hatalı/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Toplu düzelt/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Yüksek olasılıklı (1)" }));
    expect(screen.getByText("Ayşe Yılmaz")).toBeInTheDocument();
    expect(screen.queryByText("Mezun Aday")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "İnceleme gerekli (1)" }));
    expect(screen.getByText("Mezun Aday")).toBeInTheDocument();
    expect(screen.queryByText("Ayşe Yılmaz")).not.toBeInTheDocument();
  });

  it("shows read-only context and keeps target choices explicit without auto-writing", async () => {
    const studentId = await seedCandidate();
    const { user } = await renderMaintenance();
    const dialog = await openReview(user, "Ayşe Yılmaz");

    expect(within(dialog).getByText("legacy.xlsx · Adaylar · Satır 7")).toBeInTheDocument();
    expect(within(dialog).getByText("YKS")).toBeInTheDocument();
    expect(within(dialog).queryByRole("combobox", { name: /Kategori/i })).not.toBeInTheDocument();
    expect(within(dialog).getByRole("radio", { name: /Doğrulanmış değer/i })).toBeChecked();
    expect(within(dialog).getByText("Oluşturulma")).toBeInTheDocument();
    expect(within(dialog).getByText("Güncellenme")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("radio", { name: /Belirtilmemiş/i }));

    expect(within(dialog).queryByLabelText("Doğrulanmış öğrenci grubu")).not.toBeInTheDocument();
    expect((await db.students.get(studentId))?.student_group).toBe(HARDCODED_STUDENT_GROUP_FALLBACK);
    expect(await db.audit_logs.count()).toBe(0);
  });

  it("blocks the first correction until backup initiation and saved confirmation, then refreshes candidates", async () => {
    const firstId = await seedCandidate({ student_full_name: "Ayşe Yılmaz" });
    const secondId = await seedCandidate({ student_full_name: "Elif Kaya", current_class: "9" });
    const { user } = await renderMaintenance();
    const firstDialog = await openReview(user, "Ayşe Yılmaz");

    await fillConfirmedCorrection(user, firstDialog);
    await user.click(within(firstDialog).getByRole("button", { name: "Düzeltmeyi uygula" }));

    expect(await screen.findByRole("heading", { name: "Düzeltme öncesi Tam Sistem Yedeği" })).toBeInTheDocument();
    expect(
      within(firstDialog).getByText(
        "İlk düzeltmeden önce yedek gereklidir. Uygulama dosyanın diskte saklandığını doğrulayamaz; indirme isteğinden sonra saklama onayı sizden alınır."
      )
    ).toBeInTheDocument();
    expect(within(firstDialog).queryByText("Yedek dosyası indirildi.")).not.toBeInTheDocument();
    expect((await db.students.get(firstId))?.student_group).toBe(HARDCODED_STUDENT_GROUP_FALLBACK);
    expect(await db.audit_logs.count()).toBe(0);
    expect(within(firstDialog).getByLabelText("Doğrulanmış öğrenci grubu")).toHaveValue("8. Sınıf LGS Hazırlık");
    expect(within(firstDialog).getByLabelText("Düzeltme nedeni")).toHaveValue("Kaynak Excel ile doğrulandı.");

    await confirmBackupGate(user);
    expect(downloadTextFileMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Yedek onayı bu Ayarlar oturumu için alındı/)).toBeInTheDocument();

    await user.click(within(firstDialog).getByRole("button", { name: "Düzeltmeyi uygula" }));

    await waitFor(async () => {
      expect((await db.students.get(firstId))?.student_group).toBe("8. Sınıf LGS Hazırlık");
      expect(await db.audit_logs.count()).toBe(1);
    });
    expect(screen.queryByRole("dialog", { name: "Öğrenci grubunu düzelt" })).not.toBeInTheDocument();
    expect(screen.getByText("Öğrenci grubu düzeltildi. Aday listesi güncellendi.")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Ayşe Yılmaz")).not.toBeInTheDocument());

    const secondDialog = await openReview(user, "Elif Kaya");
    expect(screen.queryByText("Öğrenci grubu düzeltildi. Aday listesi güncellendi.")).not.toBeInTheDocument();
    await fillConfirmedCorrection(user, secondDialog, "9. Sınıf LGS Hazırlık");
    await user.click(within(secondDialog).getByRole("button", { name: "Düzeltmeyi uygula" }));

    await waitFor(async () => {
      expect((await db.students.get(secondId))?.student_group).toBe("9. Sınıf LGS Hazırlık");
    });
    expect(downloadTextFileMock).toHaveBeenCalledTimes(1);
  });

  it("keeps the gate locked when download initiation fails", async () => {
    const studentId = await seedCandidate();
    downloadTextFileMock.mockImplementationOnce(() => {
      throw new Error("İndirme isteği başlatılamadı.");
    });
    const { user } = await renderMaintenance();
    const dialog = await openReview(user, "Ayşe Yılmaz");

    await fillConfirmedCorrection(user, dialog);
    await user.click(within(dialog).getByRole("button", { name: "Düzeltmeyi uygula" }));
    await user.click(screen.getByRole("button", { name: "Tam Sistem Yedeği Al" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("İndirme isteği başlatılamadı.");
    expect(screen.queryByLabelText("Yedek dosyasını sakladığımı doğruluyorum.")).not.toBeInTheDocument();
    expect((await db.students.get(studentId))?.student_group).toBe(HARDCODED_STUDENT_GROUP_FALLBACK);
    expect(await db.audit_logs.count()).toBe(0);
  });

  it("submits an explicit unspecified target without a verified value", async () => {
    const studentId = await seedCandidate();
    const correctionSpy = vi.spyOn(studentGroupCleanupCorrection, "correctStudentGroupCleanupCandidate");
    const { user } = await renderMaintenance();
    const dialog = await openReview(user, "Ayşe Yılmaz");

    await user.click(within(dialog).getByRole("radio", { name: /Belirtilmemiş/i }));
    await user.type(within(dialog).getByLabelText("Düzeltme nedeni"), "Kaynakta öğrenci grubu yok.");
    await user.click(within(dialog).getByLabelText(/Bu kaydın öğrenci grubunu/));
    await user.click(within(dialog).getByRole("button", { name: "Düzeltmeyi uygula" }));
    await confirmBackupGate(user);
    await user.click(within(dialog).getByRole("button", { name: "Düzeltmeyi uygula" }));

    await waitFor(() => expect(correctionSpy).toHaveBeenCalledTimes(1));
    expect(correctionSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        student_id: studentId,
        target_mode: "unspecified",
        target_student_group: undefined
      })
    );
    expect((await db.students.get(studentId))?.student_group).toBe("");
    correctionSpy.mockRestore();
  });

  it("requires a new backup gate after a successful restore in the same Settings mount", async () => {
    await seedCandidate({ student_full_name: "Ayşe Yılmaz" });
    await seedCandidate({ student_full_name: "Elif Kaya", current_class: "9" });
    const backup = await createDataCleanupBackup();
    const { user } = await renderMaintenance();
    const firstDialog = await openReview(user, "Ayşe Yılmaz");

    await fillConfirmedCorrection(user, firstDialog);
    await user.click(within(firstDialog).getByRole("button", { name: "Düzeltmeyi uygula" }));
    await confirmBackupGate(user);
    await user.click(within(firstDialog).getByRole("button", { name: "Düzeltmeyi uygula" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Öğrenci grubunu düzelt" })).not.toBeInTheDocument());

    const secondDialog = await openReview(user, "Elif Kaya");
    await fillConfirmedCorrection(user, secondDialog, "9. Sınıf LGS Hazırlık");
    await user.click(within(secondDialog).getByRole("button", { name: "Düzeltmeyi uygula" }));
    await waitFor(async () => expect(await db.audit_logs.count()).toBe(2));
    expect(downloadTextFileMock).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("tab", { name: "Veri Yönetimi" }));
    fireEvent.change(getRestoreFileInput(), {
      target: {
        files: [new File([backup.json], "backup.json", { type: "application/json" })]
      }
    });
    await screen.findByText("Sistem yedeği analiz edildi. Geri yüklemeden önce özeti kontrol edin.");
    await user.type(screen.getByPlaceholderText(RESTORE_SYSTEM_BACKUP_CONFIRMATION), RESTORE_SYSTEM_BACKUP_CONFIRMATION);
    await user.click(screen.getByRole("button", { name: "Sistem yedeğini geri yükle" }));
    await screen.findByRole("alertdialog", { name: "Geri yükleme tamamlandı" });
    await user.click(screen.getByRole("button", { name: "Tamam" }));

    await user.click(screen.getByRole("tab", { name: "Veri Sağlığı / Bakım" }));
    const restoredDialog = await openReview(user, "Ayşe Yılmaz");
    await fillConfirmedCorrection(user, restoredDialog);
    await user.click(within(restoredDialog).getByRole("button", { name: "Düzeltmeyi uygula" }));

    expect(await screen.findByRole("heading", { name: "Düzeltme öncesi Tam Sistem Yedeği" })).toBeInTheDocument();
    expect(await db.audit_logs.count()).toBe(0);
  });

  it("keeps invalid correction feedback in the modal", async () => {
    await seedCandidate();
    const { user } = await renderMaintenance();
    const dialog = await openReview(user, "Ayşe Yılmaz");

    await user.click(within(dialog).getByLabelText(/Bu kaydın öğrenci grubunu/));
    await user.click(within(dialog).getByRole("button", { name: "Düzeltmeyi uygula" }));

    expect(within(dialog).getByRole("alert")).toHaveTextContent("Doğrulanmış öğrenci grubu boş olamaz.");
    expect(screen.getByRole("dialog", { name: "Öğrenci grubunu düzelt" })).toBeInTheDocument();
  });

  it.each([
    ["student_missing", async (studentId: number) => db.students.delete(studentId), "Düzeltilecek aday bulunamadı."],
    ["student_deleted", async (studentId: number) => db.students.update(studentId, { deleted_at: "2026-08-18T11:00:00.000Z" }), "Silinmiş aday düzeltilemez."],
    ["not_cleanup_candidate", async (studentId: number) => db.students.update(studentId, { current_class: "11" }), "Bu kayıt artık öğrenci grubu cleanup adayı değil."],
    ["student_stale", async (studentId: number) => db.students.update(studentId, { updated_at: "2026-08-18T11:00:00.000Z" }), "Aday kaydı güncel değil."]
  ])("closes the review and refreshes feedback for %s", async (_code, mutate, message) => {
    const studentId = await seedCandidate();
    const { user } = await renderMaintenance();
    const dialog = await openReview(user, "Ayşe Yılmaz");

    await fillConfirmedCorrection(user, dialog);
    await user.click(within(dialog).getByRole("button", { name: "Düzeltmeyi uygula" }));
    await confirmBackupGate(user);
    await mutate(studentId);
    await user.click(within(dialog).getByRole("button", { name: "Düzeltmeyi uygula" }));

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Öğrenci grubunu düzelt" })).not.toBeInTheDocument());
    expect(screen.getByRole("alert")).toHaveTextContent(message);
    expect(await db.audit_logs.count()).toBe(0);
  });

  it("prevents duplicate writes while a correction is in progress", async () => {
    const studentId = await seedCandidate();
    const { user } = await renderMaintenance();
    const dialog = await openReview(user, "Ayşe Yılmaz");

    await fillConfirmedCorrection(user, dialog);
    await user.click(within(dialog).getByRole("button", { name: "Düzeltmeyi uygula" }));
    await confirmBackupGate(user);
    const submitButton = within(dialog).getByRole("button", { name: "Düzeltmeyi uygula" });

    fireEvent.click(submitButton);
    fireEvent.click(submitButton);

    await waitFor(async () => {
      expect((await db.students.get(studentId))?.student_group).toBe("8. Sınıf LGS Hazırlık");
      expect(await db.audit_logs.count()).toBe(1);
    });
  });

  it("resets the backup gate after Settings remount", async () => {
    await seedCandidate();
    const first = await renderMaintenance();
    const firstDialog = await openReview(first.user, "Ayşe Yılmaz");

    await fillConfirmedCorrection(first.user, firstDialog);
    await first.user.click(within(firstDialog).getByRole("button", { name: "Düzeltmeyi uygula" }));
    await confirmBackupGate(first.user);
    first.unmount();

    const second = await renderMaintenance();
    const secondDialog = await openReview(second.user, "Ayşe Yılmaz");

    await fillConfirmedCorrection(second.user, secondDialog);
    await second.user.click(within(secondDialog).getByRole("button", { name: "Düzeltmeyi uygula" }));

    expect(await screen.findByRole("heading", { name: "Düzeltme öncesi Tam Sistem Yedeği" })).toBeInTheDocument();
  });
});

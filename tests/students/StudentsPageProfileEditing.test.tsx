import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AppOutletContext } from "../../src/app/AppLayout";
import { db } from "../../src/db/db";
import { StudentsPage } from "../../src/features/students/StudentsPage";
import {
  readStudentProfileForEdit,
  StudentProfileReaderError
} from "../../src/features/students/services/studentProfileReader";
import {
  StudentProfileUpdateError,
  updateStudentProfile
} from "../../src/features/students/services/studentProfileUpdate";
import { createSearchText, normalizeText } from "../../src/utils/normalizeText";

vi.mock("../../src/features/students/services/studentProfileReader", async () => {
  const actual = await vi.importActual<typeof import("../../src/features/students/services/studentProfileReader")>(
    "../../src/features/students/services/studentProfileReader"
  );

  return {
    ...actual,
    readStudentProfileForEdit: vi.fn(actual.readStudentProfileForEdit)
  };
});

vi.mock("../../src/features/students/services/studentProfileUpdate", async () => {
  const actual = await vi.importActual<typeof import("../../src/features/students/services/studentProfileUpdate")>(
    "../../src/features/students/services/studentProfileUpdate"
  );

  return {
    ...actual,
    updateStudentProfile: vi.fn(actual.updateStudentProfile)
  };
});

const now = "2026-08-25T10:00:00.000Z";

type StudentSeedOptions = {
  source_file_name?: string | null;
  source_sheet_name?: string | null;
  source_row_number?: number | null;
};

async function seedStudent(options: StudentSeedOptions = {}) {
  return db.students.add({
    uuid: "student-profile-editing",
    student_full_name: "ASLI DEMIR",
    normalized_student_name: normalizeText("ASLI DEMIR"),
    search_text: createSearchText(["ASLI DEMIR"]),
    current_class: "8",
    student_group: "8. Sınıf LGS Hazırlık",
    neighborhood: "Merkez",
    district: "Nilüfer",
    category: "Diger",
    campaign_id: null,
    lifecycle_status: "candidate",
    last_call_result: "not_called",
    source_file_name: options.source_file_name === undefined ? "adaylar.xlsx" : options.source_file_name,
    source_sheet_name: options.source_sheet_name === undefined ? "Adaylar" : options.source_sheet_name,
    source_row_number: options.source_row_number === undefined ? 12 : options.source_row_number,
    general_note: "Bu alan düzenleme kapsamı dışındadır.",
    created_at: now,
    updated_at: now,
    sync_status: "local"
  });
}

function StudentsPageHost() {
  const context: AppOutletContext = {
    globalSearch: "",
    focusGlobalSearch: vi.fn(),
    openStudentById: vi.fn(),
    pendingOpenStudentId: null,
    consumePendingOpenStudentId: vi.fn(),
    pendingSearchListRequestId: null,
    consumePendingSearchListRequest: vi.fn()
  };

  return <Outlet context={context} />;
}

function renderStudentsPage() {
  return render(
    <MemoryRouter initialEntries={["/students"]}>
      <Routes>
        <Route element={<StudentsPageHost />}>
          <Route path="/students" element={<StudentsPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

async function openProfileEdit(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole("button", { name: "Aday işlemleri" }));

  const menu = document.querySelector(".drawer-more-popover");
  expect(menu).not.toBeNull();

  const actions = within(menu as HTMLElement).getAllByRole("button");
  expect(actions.map((action) => action.textContent?.trim())).toEqual(["Adayı sil", "Bilgileri Güncelle"]);

  await user.click(within(menu as HTMLElement).getByRole("button", { name: "Bilgileri Güncelle" }));

  return screen.findByRole("dialog", { name: "Aday Bilgilerini Güncelle" });
}

async function setInputValue(user: ReturnType<typeof userEvent.setup>, label: string, value: string) {
  const input = screen.getByLabelText(label);
  await user.clear(input);
  if (value) {
    await user.type(input, value);
  }
}

describe("StudentsPage profile editing", () => {
  beforeEach(async () => {
    Element.prototype.scrollIntoView = vi.fn();
    vi.clearAllMocks();
    window.localStorage.clear();
    await db.delete();
    await db.open();
  });

  afterEach(async () => {
    window.localStorage.clear();
    await db.delete();
  });

  it("adds the menu action below delete and opens a fresh, narrowly scoped profile form", async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
    const studentId = await seedStudent();
    let resolveSnapshot: ((value: Awaited<ReturnType<typeof readStudentProfileForEdit>>) => void) | undefined;
    vi.mocked(readStudentProfileForEdit).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSnapshot = resolve;
        })
    );

    renderStudentsPage();

    const dialog = await openProfileEdit(user);

    expect(readStudentProfileForEdit).toHaveBeenCalledWith(studentId);
    expect(within(dialog).getByText("Aday bilgileri yükleniyor.")).toBeInTheDocument();
    expect(within(dialog).queryByLabelText("Ad Soyad")).not.toBeInTheDocument();

    resolveSnapshot?.({
      id: studentId,
      uuid: "student-profile-editing",
      student_full_name: "ASLI GUNCEL",
      current_class: "8",
      student_group: "8. Sınıf LGS Hazırlık",
      neighborhood: "Merkez",
      district: "Nilüfer",
      source_file_name: "adaylar.xlsx",
      source_sheet_name: "Adaylar",
      source_row_number: 12,
      updated_at: now
    });

    await waitFor(() => expect(within(dialog).getByLabelText("Ad Soyad")).toHaveValue("ASLI GUNCEL"));
    expect(within(dialog).getByLabelText("Sınıf")).toHaveValue("8");
    expect(within(dialog).getByLabelText("Öğrenci Grubu")).toHaveValue("8. Sınıf LGS Hazırlık");
    expect(within(dialog).getByLabelText("Mahalle")).toHaveValue("Merkez");
    expect(within(dialog).getByLabelText("İlçe")).toHaveValue("Nilüfer");
    expect(within(dialog).getByText("Kaynak Bilgisi")).toBeInTheDocument();
    expect(within(dialog).getByText("adaylar.xlsx")).toBeInTheDocument();
    expect(within(dialog).getByText("Adaylar")).toBeInTheDocument();
    expect(within(dialog).getByText("12")).toBeInTheDocument();
    expect(within(dialog).queryByLabelText(/Kategori/i)).not.toBeInTheDocument();
    expect(within(dialog).queryByLabelText(/Kampanya/i)).not.toBeInTheDocument();
    expect(within(dialog).queryByLabelText(/Genel not/i)).not.toBeInTheDocument();
    expect(within(dialog).queryByLabelText(/Telefon/i)).not.toBeInTheDocument();
    expect(within(dialog).queryByLabelText(/Veli/i)).not.toBeInTheDocument();
    expect(openSpy).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog", { name: "Aday silinsin mi?" })).not.toBeInTheDocument();
  });

  it("handles missing provenance cleanly and fails closed when the fresh reader cannot load the record", async () => {
    const user = userEvent.setup();
    await seedStudent({ source_file_name: null, source_sheet_name: null, source_row_number: null });

    renderStudentsPage();

    const dialog = await openProfileEdit(user);
    expect(within(dialog).queryByText("Kaynak Bilgisi")).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Vazgeç" }));

    vi.mocked(readStudentProfileForEdit).mockRejectedValueOnce(
      new StudentProfileReaderError("student_missing", "Aday bulunamadı.")
    );
    const failureDialog = await openProfileEdit(user);

    expect(within(failureDialog).getByRole("alert")).toHaveTextContent("Aday kaydı bulunamadı.");
    expect(within(failureDialog).queryByLabelText("Ad Soyad")).not.toBeInTheDocument();
  });

  it("saves exactly the five profile fields with a reason and refreshes the current student view", async () => {
    const user = userEvent.setup();
    const studentId = await seedStudent();

    renderStudentsPage();
    const dialog = await openProfileEdit(user);

    await setInputValue(user, "Ad Soyad", "DENIZ KAYA");
    await setInputValue(user, "Sınıf", "9");
    await setInputValue(user, "Öğrenci Grubu", "9. Sınıf LGS Hazırlık");
    await setInputValue(user, "Mahalle", "Işıklar");
    await setInputValue(user, "İlçe", "Osmangazi");
    await user.type(within(dialog).getByLabelText("Değişiklik Nedeni"), "Profil bilgisi doğrulandı.");
    await user.click(within(dialog).getByRole("button", { name: "Kaydet" }));

    await waitFor(() => {
      expect(updateStudentProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          student_id: studentId,
          student_uuid: "student-profile-editing",
          expected_updated_at: now,
          student_full_name: "DENIZ KAYA",
          current_class: "9",
          student_group: "9. Sınıf LGS Hazırlık",
          neighborhood: "Işıklar",
          district: "Osmangazi",
          change_reason: "Profil bilgisi doğrulandı.",
          performed_by: "agent"
        })
      );
    });

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Aday Bilgilerini Güncelle" })).not.toBeInTheDocument());
    expect(screen.getByText("Aday bilgileri güncellendi.")).toBeInTheDocument();
    expect(await db.students.get(studentId)).toMatchObject({
      student_full_name: "DENIZ KAYA",
      current_class: "9",
      student_group: "9. Sınıf LGS Hazırlık",
      neighborhood: "Işıklar",
      district: "Osmangazi"
    });
    expect((await screen.findAllByText("DENIZ KAYA")).length).toBeGreaterThanOrEqual(2);
  });

  it("keeps the modal open for client validation, no-change, and stale errors without replacing the form", async () => {
    const user = userEvent.setup();
    const studentId = await seedStudent();

    renderStudentsPage();
    const dialog = await openProfileEdit(user);

    await setInputValue(user, "Ad Soyad", "");
    await user.click(within(dialog).getByRole("button", { name: "Kaydet" }));
    expect(within(dialog).getByRole("alert")).toHaveTextContent("Ad Soyad boş olamaz.");

    await setInputValue(user, "Ad Soyad", "ASLI DEMIR GUNCEL");
    await user.type(within(dialog).getByLabelText("Değişiklik Nedeni"), "   ");
    await user.click(within(dialog).getByRole("button", { name: "Kaydet" }));

    expect(updateStudentProfile).not.toHaveBeenCalled();
    expect(within(dialog).getByRole("alert")).toHaveTextContent("Değişiklik nedeni boş olamaz.");
    expect(within(dialog).getByLabelText("Ad Soyad")).toHaveValue("ASLI DEMIR GUNCEL");
    expect(within(dialog).getByLabelText("Değişiklik Nedeni")).toHaveValue("   ");
    expect(screen.queryByText("Aday bilgileri güncellendi.")).not.toBeInTheDocument();

    await setInputValue(user, "Ad Soyad", "ASLI DEMIR");
    await setInputValue(user, "Değişiklik Nedeni", "Kontrol edildi.");
    await user.click(within(dialog).getByRole("button", { name: "Kaydet" }));
    expect(within(dialog).getByRole("alert")).toHaveTextContent("Kaydedilecek bir değişiklik bulunamadı.");

    await setInputValue(user, "Ad Soyad", "ASLI AKSOY");
    await db.students.update(studentId, { updated_at: "2026-08-25T10:05:00.000Z" });
    await user.click(within(dialog).getByRole("button", { name: "Kaydet" }));

    expect(within(dialog).getByRole("alert")).toHaveTextContent("Aday kaydı form açıldıktan sonra değişti.");
    expect(within(dialog).getByLabelText("Ad Soyad")).toHaveValue("ASLI AKSOY");
    expect(within(dialog).getByLabelText("Değişiklik Nedeni")).toHaveValue("Kontrol edildi.");
  });

  it("keeps values visible on an audit error and prevents a second save while the first request is pending", async () => {
    const user = userEvent.setup();
    await seedStudent();

    renderStudentsPage();
    const dialog = await openProfileEdit(user);
    await setInputValue(user, "Mahalle", "Çekirge");
    await user.type(within(dialog).getByLabelText("Değişiklik Nedeni"), "Adres düzeltildi.");

    let resolveUpdate: ((value: { student_id: number; changed_fields: []; updated_at: string }) => void) | undefined;
    vi.mocked(updateStudentProfile).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveUpdate = resolve;
        })
    );

    const saveButton = within(dialog).getByRole("button", { name: "Kaydet" });
    await user.click(saveButton);
    await user.click(saveButton);

    expect(updateStudentProfile).toHaveBeenCalledTimes(1);
    expect(within(dialog).getByRole("button", { name: "Kaydediliyor..." })).toBeDisabled();
    expect(within(dialog).getByRole("button", { name: "Vazgeç" })).toBeDisabled();

    resolveUpdate?.({ student_id: 1, changed_fields: [], updated_at: "2026-08-25T10:10:00.000Z" });
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Aday Bilgilerini Güncelle" })).not.toBeInTheDocument());

    const errorUser = userEvent.setup();
    const errorDialog = await openProfileEdit(errorUser);
    await setInputValue(errorUser, "Mahalle", "Kükürtlü");
    await errorUser.type(within(errorDialog).getByLabelText("Değişiklik Nedeni"), "Yeni neden.");
    vi.mocked(updateStudentProfile).mockRejectedValueOnce(
      new StudentProfileUpdateError("audit_failed", "Aday güncelleme kaydı yazılamadı.")
    );
    await errorUser.click(within(errorDialog).getByRole("button", { name: "Kaydet" }));

    expect(within(errorDialog).getByRole("alert")).toHaveTextContent("değişiklik kaydı oluşturulamadı");
    expect(within(errorDialog).getByLabelText("Mahalle")).toHaveValue("Kükürtlü");
    expect(within(errorDialog).getByLabelText("Değişiklik Nedeni")).toHaveValue("Yeni neden.");
  });

  it("keeps every entered profile value visible when the student write fails", async () => {
    const user = userEvent.setup();
    await seedStudent();

    renderStudentsPage();
    const dialog = await openProfileEdit(user);
    await setInputValue(user, "Ad Soyad", "SENA YILDIRIM");
    await setInputValue(user, "Sınıf", "9");
    await setInputValue(user, "Öğrenci Grubu", "9. Sınıf LGS Hazırlık");
    await setInputValue(user, "Mahalle", "Altınşehir");
    await setInputValue(user, "İlçe", "Osmangazi");
    await user.type(within(dialog).getByLabelText("Değişiklik Nedeni"), "Yazım hatası düzeltildi.");
    vi.mocked(updateStudentProfile).mockRejectedValueOnce(
      new StudentProfileUpdateError("student_write_failed", "Aday bilgileri güncellenemedi.")
    );

    await user.click(within(dialog).getByRole("button", { name: "Kaydet" }));

    expect(updateStudentProfile).toHaveBeenCalledTimes(1);
    expect(within(dialog).getByRole("alert")).toHaveTextContent("Aday bilgileri kaydedilemedi. Lütfen yeniden deneyin.");
    expect(within(dialog).getByLabelText("Ad Soyad")).toHaveValue("SENA YILDIRIM");
    expect(within(dialog).getByLabelText("Sınıf")).toHaveValue("9");
    expect(within(dialog).getByLabelText("Öğrenci Grubu")).toHaveValue("9. Sınıf LGS Hazırlık");
    expect(within(dialog).getByLabelText("Mahalle")).toHaveValue("Altınşehir");
    expect(within(dialog).getByLabelText("İlçe")).toHaveValue("Osmangazi");
    expect(within(dialog).getByLabelText("Değişiklik Nedeni")).toHaveValue("Yazım hatası düzeltildi.");
    expect(screen.queryByText("Aday bilgileri güncellendi.")).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Aday Bilgilerini Güncelle" })).toBeInTheDocument();
  });
});

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AppOutletContext } from "../../src/app/AppLayout";
import { db } from "../../src/db/db";
import { StudentsPage } from "../../src/features/students/StudentsPage";
import { createSearchText, normalizeText } from "../../src/utils/normalizeText";

const now = "2026-05-10T10:00:00.000Z";

const phoneSeeds = [
  {
    phone_number: "0532 000 0001",
    normalized_phone_number: "05320000001",
    phone_label: "Telefon 1",
    reference_label: "Telefon 1",
    relation_label: "Telefon",
    priority: 1,
    is_primary: true
  },
  {
    phone_number: "0532 000 0002",
    normalized_phone_number: "05320000002",
    phone_label: "Anne Telefon",
    reference_label: "Telefon 2",
    relation_label: "Anne",
    priority: 2,
    is_primary: false
  },
  {
    phone_number: "0532 000 0003",
    normalized_phone_number: "05320000003",
    phone_label: "Öğrenci Telefon",
    reference_label: "Telefon 3",
    relation_label: "Öğrenci",
    priority: 3,
    is_primary: false
  },
  {
    phone_number: "0532 000 0004",
    normalized_phone_number: "05320000004",
    phone_label: "Veli Telefon",
    reference_label: "Telefon 4",
    relation_label: "Veli",
    priority: 4,
    is_primary: false
  },
  {
    phone_number: "0532 000 0005",
    normalized_phone_number: "05320000005",
    phone_label: "Yakın Telefon",
    reference_label: "Telefon 5",
    relation_label: "Yakın",
    priority: 5,
    is_primary: false
  }
] as const;

async function seedStudentWithPhones(phoneCount: number, fullName = "MELIS KAYA") {
  const studentId = await db.students.add({
    uuid: `student-multi-phone-${phoneCount}`,
    student_full_name: fullName,
    normalized_student_name: normalizeText(fullName),
    search_text: createSearchText([fullName, "AYLIN KAYA", "05320000001"]),
    current_class: "11",
    student_group: "YKS",
    category: "YKS",
    campaign_id: null,
    lifecycle_status: "candidate",
    last_call_result: "not_called",
    general_note: null,
    created_at: now,
    updated_at: now,
    sync_status: "local"
  });
  const guardianId = await db.guardians.add({
    uuid: `guardian-multi-phone-${phoneCount}`,
    student_id: studentId,
    guardian_full_name: "AYLIN KAYA",
    normalized_guardian_name: normalizeText("AYLIN KAYA"),
    relation_type: null,
    note: null,
    created_at: now,
    updated_at: now,
    sync_status: "local"
  });

  if (phoneCount > 0) {
    await db.phones.bulkAdd(
      phoneSeeds.slice(0, phoneCount).map((phone) => ({
        uuid: `${phone.normalized_phone_number}-${phoneCount}`,
        student_id: studentId,
        guardian_id: guardianId,
        phone_number: phone.phone_number,
        normalized_phone_number: phone.normalized_phone_number,
        phone_label: phone.phone_label,
        reference_label: phone.reference_label,
        relation_label: phone.relation_label,
        priority: phone.priority,
        phone_status: "active",
        is_valid: true,
        is_wrong: false,
        is_primary: phone.is_primary,
        created_at: now,
        updated_at: now,
        sync_status: "local"
      }))
    );
  }

  return studentId;
}

async function seedStudentWithSinglePhone(fullName: string, uuidPrefix: string, phoneNumber: string) {
  const normalizedPhone = phoneNumber.replace(/\D/g, "");
  const studentId = await db.students.add({
    uuid: `${uuidPrefix}-student`,
    student_full_name: fullName,
    normalized_student_name: normalizeText(fullName),
    search_text: createSearchText([fullName, normalizedPhone]),
    current_class: "11",
    student_group: "YKS",
    category: "YKS",
    campaign_id: null,
    lifecycle_status: "candidate",
    last_call_result: "not_called",
    general_note: null,
    created_at: now,
    updated_at: now,
    sync_status: "local"
  });

  await db.phones.add({
    uuid: `${uuidPrefix}-${normalizedPhone}`,
    student_id: studentId,
    guardian_id: null,
    phone_number: phoneNumber,
    normalized_phone_number: normalizedPhone,
    phone_label: "Telefon 1",
    reference_label: "Telefon 1",
    relation_label: "Telefon",
    priority: 1,
    phone_status: "active",
    is_valid: true,
    is_wrong: false,
    is_primary: true,
    created_at: now,
    updated_at: now,
    sync_status: "local"
  });

  return studentId;
}

function StudentsPageHost({ initialGlobalSearch = "" }: { initialGlobalSearch?: string }) {
  const [globalSearch, setGlobalSearch] = useState(initialGlobalSearch);
  const context: AppOutletContext = {
    globalSearch,
    focusGlobalSearch: vi.fn(),
    clearGlobalSearch: () => setGlobalSearch(""),
    openStudentById: vi.fn(),
    pendingOpenStudentId: null,
    consumePendingOpenStudentId: vi.fn(),
    pendingSearchListRequestId: null,
    consumePendingSearchListRequest: vi.fn()
  };

  return <Outlet context={context} />;
}

function renderStudentsPage(initialGlobalSearch?: string) {
  render(
    <MemoryRouter initialEntries={["/students"]}>
      <Routes>
        <Route element={<StudentsPageHost initialGlobalSearch={initialGlobalSearch} />}>
          <Route path="/students" element={<StudentsPage />} />
        </Route>
        <Route path="/import" element={<div>Import</div>} />
      </Routes>
    </MemoryRouter>
  );
}

async function getStudentTable() {
  return (await screen.findByRole("table")) as HTMLElement;
}

function getStudentDrawer() {
  const drawer = document.querySelector(".student-drawer");

  expect(drawer).not.toBeNull();

  return drawer as HTMLElement;
}

function getStatusFilterSelect() {
  const filterLabel = screen.getByText("Durum Filtresi").closest("label");
  const select = filterLabel?.querySelector("select");

  expect(select).not.toBeNull();

  return select as HTMLSelectElement;
}

describe("StudentsPage right card multi-phone display", () => {
  beforeEach(async () => {
    Element.prototype.scrollIntoView = vi.fn();
    window.localStorage.clear();
    await db.delete();
    await db.open();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    await db.delete();
  });

  it("shows the first extra phone and expands the remaining phones as readonly", async () => {
    const user = userEvent.setup();
    await seedStudentWithPhones(5);

    renderStudentsPage();

    expect(await screen.findByText("Telefon 3 · Öğrenci")).toBeInTheDocument();
    expect(screen.getByText("0532 000 0003")).toBeInTheDocument();
    expect(screen.queryByText("Telefon 4 · Veli")).not.toBeInTheDocument();
    expect(screen.queryByText("Telefon 5 · Yakın")).not.toBeInTheDocument();

    const readonlyCard = screen.getByText("Telefon 3 · Öğrenci").closest(".drawer-phone-card");
    expect(readonlyCard).not.toBeNull();
    expect(
      within(readonlyCard as HTMLElement).queryByRole("button", {
        name: "Son görüşülen numara olarak işaretle"
      })
    ).not.toBeInTheDocument();
    expect(
      within(readonlyCard as HTMLElement).getByRole("button", {
        name: "Yanlış / kullanılmayacak numara"
      })
    ).toBeInTheDocument();
    expect(within(readonlyCard as HTMLElement).queryByText("Aktif numara")).not.toBeInTheDocument();

    const scrollIntoViewMock = vi.mocked(Element.prototype.scrollIntoView);
    scrollIntoViewMock.mockClear();

    await user.click(screen.getByRole("button", { name: "+2 numara daha göster" }));

    expect(scrollIntoViewMock).not.toHaveBeenCalledWith({ behavior: "smooth", block: "start" });

    expect(await screen.findByText("Telefon 4 · Veli")).toBeInTheDocument();
    expect(screen.getByText("0532 000 0004")).toBeInTheDocument();
    expect(screen.getByText("Telefon 5 · Yakın")).toBeInTheDocument();
    expect(screen.getByText("0532 000 0005")).toBeInTheDocument();
    expect(screen.queryByText("Aktif numara")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Daha az göster" })).toBeInTheDocument();

    scrollIntoViewMock.mockClear();

    await user.click(screen.getByRole("button", { name: "Daha az göster" }));

    expect(screen.queryByText("Telefon 4 · Veli")).not.toBeInTheDocument();
    expect(screen.queryByText("Telefon 5 · Yakın")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+2 numara daha göster" })).toBeInTheDocument();
    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
  });

  it("shows only non-empty Veli, Anne and Baba rows in the right drawer", async () => {
    const studentId = await seedStudentWithPhones(1);
    await db.guardians.bulkAdd([
      {
        uuid: "mother-multi-phone",
        student_id: studentId,
        guardian_full_name: "FATMA KAYA",
        normalized_guardian_name: normalizeText("FATMA KAYA"),
        relation_type: "mother",
        note: null,
        created_at: now,
        updated_at: now,
        sync_status: "local"
      },
      {
        uuid: "father-multi-phone",
        student_id: studentId,
        guardian_full_name: "MEHMET KAYA",
        normalized_guardian_name: normalizeText("MEHMET KAYA"),
        relation_type: "father",
        note: null,
        created_at: now,
        updated_at: now,
        sync_status: "local"
      }
    ]);

    renderStudentsPage();
    expect(await screen.findAllByText("MELIS KAYA")).toHaveLength(2);

    const contactCard = getStudentDrawer().querySelector(".contact-card");
    expect(contactCard).not.toBeNull();
    expect(within(contactCard as HTMLElement).getByText("Veli Ad Soyad: AYLIN KAYA")).toBeInTheDocument();
    expect(within(contactCard as HTMLElement).getByText("Anne Adı: FATMA KAYA")).toBeInTheDocument();
    expect(within(contactCard as HTMLElement).getByText("Baba Adı: MEHMET KAYA")).toBeInTheDocument();
    expect(within(contactCard as HTMLElement).queryByText(/ilişki bilinmiyor/i)).not.toBeInTheDocument();
    expect(within(contactCard as HTMLElement).queryByText(/telefon yok/i)).not.toBeInTheDocument();
  });

  it("hides empty Anne and Baba rows in the right drawer", async () => {
    await seedStudentWithPhones(1);

    renderStudentsPage();
    expect(await screen.findAllByText("MELIS KAYA")).toHaveLength(2);

    const contactCard = getStudentDrawer().querySelector(".contact-card");
    expect(contactCard).not.toBeNull();
    expect(within(contactCard as HTMLElement).getByText("Veli Ad Soyad: AYLIN KAYA")).toBeInTheDocument();
    expect(within(contactCard as HTMLElement).queryByText(/Anne Adı:/)).not.toBeInTheDocument();
    expect(within(contactCard as HTMLElement).queryByText(/Baba Adı:/)).not.toBeInTheDocument();
  });

  it("does not show an expand button when there are no hidden phones", async () => {
    await seedStudentWithPhones(3);

    renderStudentsPage();

    expect(await screen.findByText("Telefon 3 · Öğrenci")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /\+\d+ numara daha göster/ })).not.toBeInTheDocument();
  });

  it("keeps the existing no-phone fallback", async () => {
    await seedStudentWithPhones(0, "TELEFONSUZ ADAY");

    renderStudentsPage();

    expect(await screen.findAllByText("TELEFONSUZ ADAY")).toHaveLength(2);
    expect(screen.getAllByText("Telefon yok").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByRole("button", { name: /\+\d+ numara daha göster/ })).not.toBeInTheDocument();
  });

  it("filters the table to the selected duplicate phone group from the drawer badge", async () => {
    const user = userEvent.setup();
    await seedStudentWithSinglePhone("BEGUM KOLEF", "begum", "0532 111 1111");
    await seedStudentWithSinglePhone("BERK KOLEF", "berk", "0532 111 1111");
    await seedStudentWithSinglePhone("CEM DEMIR", "cem", "0532 222 2222");
    await seedStudentWithSinglePhone("DENIZ DEMIR", "deniz", "0532 222 2222");
    await seedStudentWithSinglePhone("ECE YILMAZ", "ece", "0532 333 3333");

    renderStudentsPage();

    const table = await getStudentTable();
    expect(await within(table).findByText("BEGUM KOLEF")).toBeInTheDocument();

    await user.selectOptions(getStatusFilterSelect(), "duplicate_phone");

    expect(within(table).getByText("BEGUM KOLEF")).toBeInTheDocument();
    expect(within(table).getByText("BERK KOLEF")).toBeInTheDocument();
    expect(within(table).getByText("CEM DEMIR")).toBeInTheDocument();
    expect(within(table).getByText("DENIZ DEMIR")).toBeInTheDocument();
    expect(within(table).queryByText("ECE YILMAZ")).not.toBeInTheDocument();
    expect(within(table).getAllByText("Mükerrer").length).toBeGreaterThanOrEqual(4);

    await user.selectOptions(getStatusFilterSelect(), "all");
    await user.click(within(table).getByText("BEGUM KOLEF"));

    const drawer = getStudentDrawer();
    const drawerDuplicateBadge = within(drawer).getByRole("button", { name: "Mükerrer" });
    expect(drawerDuplicateBadge).toBeInTheDocument();
    expect(drawerDuplicateBadge.closest(".drawer-class")).not.toBeNull();
    expect(drawerDuplicateBadge.closest(".drawer-name")).toBeNull();

    await user.click(drawerDuplicateBadge);

    expect(within(table).getByText("BEGUM KOLEF")).toBeInTheDocument();
    expect(within(table).getByText("BERK KOLEF")).toBeInTheDocument();
    expect(within(table).queryByText("CEM DEMIR")).not.toBeInTheDocument();
    expect(within(table).queryByText("DENIZ DEMIR")).not.toBeInTheDocument();
    expect(within(table).queryByText("ECE YILMAZ")).not.toBeInTheDocument();
    expect(within(drawer).getByText("BEGUM KOLEF")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Filtreyi sıfırla" }));

    expect(within(table).getByText("BEGUM KOLEF")).toBeInTheDocument();
    expect(within(table).getByText("BERK KOLEF")).toBeInTheDocument();
    expect(within(table).getByText("CEM DEMIR")).toBeInTheDocument();
    expect(within(table).getByText("DENIZ DEMIR")).toBeInTheDocument();
    expect(within(table).getByText("ECE YILMAZ")).toBeInTheDocument();
    expect(within(drawer).getByText("BEGUM KOLEF")).toBeInTheDocument();

    await user.selectOptions(getStatusFilterSelect(), "duplicate_phone");

    expect(within(table).getByText("BEGUM KOLEF")).toBeInTheDocument();
    expect(within(table).getByText("BERK KOLEF")).toBeInTheDocument();
    expect(within(table).getByText("CEM DEMIR")).toBeInTheDocument();
    expect(within(table).getByText("DENIZ DEMIR")).toBeInTheDocument();
    expect(within(table).queryByText("ECE YILMAZ")).not.toBeInTheDocument();
  });

  it("clears global search when filtering from the drawer duplicate badge", async () => {
    const user = userEvent.setup();
    await seedStudentWithSinglePhone("MEDINE KAYRAN", "medine", "0532 444 4444");
    await seedStudentWithSinglePhone("ELIF KAYRAN", "elif", "0532 444 4444");
    await seedStudentWithSinglePhone("ZEYNEP ARSLAN", "zeynep", "0532 555 5555");

    renderStudentsPage("MEDINE KAYRAN");

    const table = await getStudentTable();
    expect(await within(table).findByText("MEDINE KAYRAN")).toBeInTheDocument();
    expect(within(table).queryByText("ELIF KAYRAN")).not.toBeInTheDocument();

    const drawer = getStudentDrawer();
    await user.click(within(drawer).getByRole("button", { name: "Mükerrer" }));

    expect(await within(table).findByText("ELIF KAYRAN")).toBeInTheDocument();
    expect(within(table).getByText("MEDINE KAYRAN")).toBeInTheDocument();
    expect(within(table).queryByText("ZEYNEP ARSLAN")).not.toBeInTheDocument();
    expect(within(drawer).getByText("MEDINE KAYRAN")).toBeInTheDocument();
  });

  it("does not show the drawer duplicate badge for a unique phone", async () => {
    await seedStudentWithSinglePhone("ECE YILMAZ", "unique-ece", "0532 333 3333");

    renderStudentsPage();

    expect(await screen.findAllByText("ECE YILMAZ")).toHaveLength(2);
    expect(within(getStudentDrawer()).queryByRole("button", { name: "Mükerrer" })).not.toBeInTheDocument();
  });
});

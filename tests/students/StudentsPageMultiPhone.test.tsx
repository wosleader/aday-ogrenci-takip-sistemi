import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  render(
    <MemoryRouter initialEntries={["/students"]}>
      <Routes>
        <Route element={<StudentsPageHost />}>
          <Route path="/students" element={<StudentsPage />} />
        </Route>
        <Route path="/import" element={<div>Import</div>} />
      </Routes>
    </MemoryRouter>
  );
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
        name: "Yanlış numara veya kullanılmıyor olarak işaretle"
      })
    ).toBeInTheDocument();

    const scrollIntoViewMock = vi.mocked(Element.prototype.scrollIntoView);
    scrollIntoViewMock.mockClear();

    await user.click(screen.getByRole("button", { name: "+2 numara daha göster" }));

    expect(scrollIntoViewMock).not.toHaveBeenCalledWith({ behavior: "smooth", block: "start" });

    expect(await screen.findByText("Telefon 4 · Veli")).toBeInTheDocument();
    expect(screen.getByText("0532 000 0004")).toBeInTheDocument();
    expect(screen.getByText("Telefon 5 · Yakın")).toBeInTheDocument();
    expect(screen.getByText("0532 000 0005")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Daha az göster" })).toBeInTheDocument();

    scrollIntoViewMock.mockClear();

    await user.click(screen.getByRole("button", { name: "Daha az göster" }));

    expect(screen.queryByText("Telefon 4 · Veli")).not.toBeInTheDocument();
    expect(screen.queryByText("Telefon 5 · Yakın")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+2 numara daha göster" })).toBeInTheDocument();
    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
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
});

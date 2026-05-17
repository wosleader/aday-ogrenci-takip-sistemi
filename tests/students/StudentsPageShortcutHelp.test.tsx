import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AppOutletContext } from "../../src/app/AppLayout";
import { db } from "../../src/db/db";
import { StudentsPage } from "../../src/features/students/StudentsPage";
import { createSearchText, normalizeText } from "../../src/utils/normalizeText";

const now = "2026-05-10T10:00:00.000Z";

async function seedStudent() {
  const studentId = await db.students.add({
    uuid: "student-shortcut-help",
    student_full_name: "ECEM CAKIR",
    normalized_student_name: normalizeText("ECEM CAKIR"),
    search_text: createSearchText(["ECEM CAKIR", "YILDIZ CAKIR", "05352329429"]),
    current_class: "12",
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
    uuid: "guardian-shortcut-help",
    student_id: studentId,
    guardian_full_name: "YILDIZ CAKIR",
    normalized_guardian_name: normalizeText("YILDIZ CAKIR"),
    relation_type: null,
    note: null,
    created_at: now,
    updated_at: now,
    sync_status: "local"
  });
  await db.phones.add({
    uuid: "phone-shortcut-help",
    student_id: studentId,
    guardian_id: guardianId,
    phone_number: "0535 232 9429",
    normalized_phone_number: "05352329429",
    phone_label: "Telefon 1",
    phone_status: "active",
    is_valid: true,
    is_wrong: false,
    is_primary: true,
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

describe("StudentsPage shortcut help bar", () => {
  beforeEach(async () => {
    Element.prototype.scrollIntoView = vi.fn();
    window.localStorage.clear();
    await db.delete();
    await db.open();
    await seedStudent();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    await db.delete();
  });

  it("starts compact and toggles the full shortcut help", async () => {
    renderStudentsPage();

    const bar = await screen.findByLabelText("Kısayol yardım çubuğu");
    expect(within(bar).getByText("Kısayollar")).toBeInTheDocument();
    expect(within(bar).getByRole("button", { name: "Göster" })).toBeInTheDocument();
    expect(within(bar).getByText("Ara")).toBeInTheDocument();
    expect(within(bar).getByText("Kaydet")).toBeInTheDocument();
    expect(within(bar).queryByText("Ulaşılamadı")).not.toBeInTheDocument();

    await userEvent.click(within(bar).getByRole("button", { name: "Göster" }));

    expect(within(bar).getByRole("button", { name: "Gizle" })).toBeInTheDocument();
    expect(within(bar).getByText("Gezinme")).toBeInTheDocument();
    expect(within(bar).getByText("Arama / Telefon")).toBeInTheDocument();
    expect(within(bar).getByText("Sonuç")).toBeInTheDocument();
    expect(within(bar).getByText("Ulaşılamadı")).toBeInTheDocument();
    expect(window.localStorage.getItem("aots-shortcut-help-expanded")).toBe("true");

    await userEvent.click(within(bar).getByRole("button", { name: "Gizle" }));

    expect(within(bar).getByRole("button", { name: "Göster" })).toBeInTheDocument();
    expect(within(bar).queryByText("Ulaşılamadı")).not.toBeInTheDocument();
    expect(window.localStorage.getItem("aots-shortcut-help-expanded")).toBe("false");
  });

  it("renders even when shortcut help preference storage cannot be read", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage unavailable");
    });

    renderStudentsPage();

    const bar = await screen.findByLabelText("Kısayol yardım çubuğu");
    expect(within(bar).getByText("Kısayollar")).toBeInTheDocument();
    expect(within(bar).getByRole("button", { name: "Göster" })).toBeInTheDocument();
  });
});

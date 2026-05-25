import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AppOutletContext } from "../../src/app/AppLayout";
import { db } from "../../src/db/db";
import type { PhoneSnapshot } from "../../src/domain/models/phone";
import { RemindersPage } from "../../src/features/reminders/RemindersPage";
import { createSearchText, normalizeText } from "../../src/utils/normalizeText";

const timestamp = "2026-05-08T09:00:00.000Z";

function TestOutletHost({ openStudentById }: { openStudentById: (studentId: number) => void }) {
  return (
    <Outlet
      context={{
        globalSearch: "",
        focusGlobalSearch: vi.fn(),
        openStudentById,
        pendingOpenStudentId: null,
        consumePendingOpenStudentId: vi.fn(),
        pendingSearchListRequestId: null,
        consumePendingSearchListRequest: vi.fn()
      } satisfies AppOutletContext}
    />
  );
}

function renderRemindersPage(openStudentById = vi.fn()) {
  render(
    <MemoryRouter initialEntries={["/reminders"]}>
      <Routes>
        <Route element={<TestOutletHost openStudentById={openStudentById} />}>
          <Route path="/reminders" element={<RemindersPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

  return { openStudentById };
}

type SeedReminderOptions = {
  includeSecondPhone?: boolean;
  phoneSnapshot?: PhoneSnapshot;
};

async function seedReminder(options: SeedReminderOptions = {}) {
  const now = "2026-05-10T10:00:00.000Z";
  const studentId = await db.students.add({
    uuid: "student-reminder-page",
    student_full_name: "ZEYNEP SUBAŞI",
    normalized_student_name: normalizeText("ZEYNEP SUBAŞI"),
    search_text: createSearchText(["ZEYNEP SUBAŞI", "RAMAZAN SUBAŞI"]),
    current_class: "11",
    student_group: "YKS",
    category: "YKS",
    campaign_id: null,
    lifecycle_status: "candidate",
    last_call_result: "not_called",
    created_at: now,
    updated_at: now,
    sync_status: "local"
  });
  await db.guardians.add({
    uuid: "guardian-reminder-page",
    student_id: studentId,
    guardian_full_name: "RAMAZAN SUBAŞI",
    normalized_guardian_name: normalizeText("RAMAZAN SUBAŞI"),
    created_at: now,
    updated_at: now,
    sync_status: "local"
  });
  await db.phones.add({
    uuid: "phone-reminder-page",
    student_id: studentId,
    phone_number: "0532 000 00 00",
    normalized_phone_number: "05320000000",
    phone_label: "Telefon 1",
    phone_status: "active",
    is_valid: true,
    is_wrong: false,
    is_primary: true,
    created_at: now,
    updated_at: now,
    sync_status: "local"
  });
  if (options.includeSecondPhone) {
    await db.phones.add({
      uuid: "phone-reminder-page-secondary",
      student_id: studentId,
      phone_number: "0533 000 00 00",
      normalized_phone_number: "05330000000",
      phone_label: "Telefon 2",
      phone_status: "active",
      is_valid: true,
      is_wrong: false,
      is_primary: false,
      created_at: now,
      updated_at: now,
      sync_status: "local"
    });
  }
  await db.reminders.add({
    uuid: "reminder-page",
    student_id: studentId,
    reminder_type: "call",
    reminder_at: "2099-05-10T13:00:00.000Z",
    status: "pending",
    note: "Tekrar aranacak",
    is_default_time_assigned: false,
    created_at: timestamp,
    updated_at: timestamp,
    sync_status: "local",
    ...(options.phoneSnapshot
      ? {
          phone_id: options.phoneSnapshot.phone_id ?? null,
          phone_snapshot: options.phoneSnapshot
        }
      : {})
  });

  return studentId;
}

describe("RemindersPage", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await db.delete();
  });

  it("renders the page shell and empty state", () => {
    renderRemindersPage();

    expect(screen.getByRole("heading", { name: "Hatırlatmalar" })).toBeInTheDocument();
    expect(screen.getByText("Bugün aranacak, süresi geçen ve yaklaşan tekrar aramaları buradan takip edin.")).toBeInTheDocument();
    expect(screen.getAllByText("Süresi geçenler").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bugün aranacaklar").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Yaklaşan aramalar").length).toBeGreaterThan(0);
    expect(screen.getByText("Toplam açık hatırlatma")).toBeInTheDocument();
    expect(screen.getByText("Tüm hatırlatmalar")).toBeInTheDocument();
    expect(screen.getByText("Zamanı geçmiş açık aramalar")).toBeInTheDocument();
    expect(screen.getByText("Tamamlanmamış tekrar aramalar")).toBeInTheDocument();
    expect(screen.getByText("Açık hatırlatma yok.")).toBeInTheDocument();
  });

  it("opens the selected student from the reminder list", async () => {
    const studentId = await seedReminder();
    const openStudentById = vi.fn();
    renderRemindersPage(openStudentById);

    expect(await screen.findByText("ZEYNEP SUBAŞI")).toBeInTheDocument();
    expect(screen.getByText("Aranacak telefon")).toBeInTheDocument();
    expect(screen.getByText("0532 000 00 00")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Adayı Aç" }));

    expect(openStudentById).toHaveBeenCalledWith(studentId);
  });

  it("shows phone context in the primary reminder phone column", async () => {
    await seedReminder({
      includeSecondPhone: true,
      phoneSnapshot: {
        phone_id: 5,
        reference_label: "Telefon 5",
        relation_label: "Yakın",
        phone_number: "0555 123 4567",
        source_column: "Yakın Telefon"
      }
    });
    renderRemindersPage();

    expect(await screen.findByText("Telefon 5 · Yakın: 0555 123 4567")).toBeInTheDocument();
    expect(screen.getByText("0533 000 00 00")).toBeInTheDocument();
  });
});

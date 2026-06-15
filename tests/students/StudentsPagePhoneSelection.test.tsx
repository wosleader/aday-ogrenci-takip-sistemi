import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
    phone_number: "0532 100 0001",
    normalized_phone_number: "05321000001",
    phone_label: "Telefon 1",
    reference_label: "Telefon 1",
    relation_label: "Telefon",
    priority: 1,
    is_primary: true
  },
  {
    phone_number: "0532 100 0002",
    normalized_phone_number: "05321000002",
    phone_label: "Anne Telefon",
    reference_label: "Telefon 2",
    relation_label: "Anne",
    priority: 2,
    is_primary: false
  },
  {
    phone_number: "0532 100 0003",
    normalized_phone_number: "05321000003",
    phone_label: "Öğrenci Telefon",
    reference_label: "Telefon 3",
    relation_label: "Öğrenci",
    priority: 3,
    is_primary: false
  },
  {
    phone_number: "0532 100 0004",
    normalized_phone_number: "05321000004",
    phone_label: "Veli Telefon",
    reference_label: "Telefon 4",
    relation_label: "Veli",
    priority: 4,
    is_primary: false
  }
] as const;

async function seedStudentWithPhones(fullName: string, uuidPrefix: string, phoneCount = 4) {
  const studentId = await db.students.add({
    uuid: `${uuidPrefix}-student`,
    student_full_name: fullName,
    normalized_student_name: normalizeText(fullName),
    search_text: createSearchText([fullName, "AYLIN KAYA", "05321000001"]),
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
    uuid: `${uuidPrefix}-guardian`,
    student_id: studentId,
    guardian_full_name: "AYLIN KAYA",
    normalized_guardian_name: normalizeText("AYLIN KAYA"),
    relation_type: null,
    note: null,
    created_at: now,
    updated_at: now,
    sync_status: "local"
  });

  await db.phones.bulkAdd(
    phoneSeeds.slice(0, phoneCount).map((phone) => ({
      uuid: `${uuidPrefix}-${phone.normalized_phone_number}`,
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

  return studentId;
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

function getCallResultSelect(): HTMLSelectElement {
  const selects = screen.getAllByRole("combobox");

  return selects[selects.length - 1] as HTMLSelectElement;
}

function getDrawerPhoneCard(label: string): HTMLElement {
  const labelElement = screen.getAllByText(label).find((element) => element.closest(".drawer-phone-card"));

  expect(labelElement).toBeDefined();

  return labelElement!.closest(".drawer-phone-card") as HTMLElement;
}

async function getPhoneId(normalizedPhoneNumber: string): Promise<number> {
  const phone = await db.phones.where("normalized_phone_number").equals(normalizedPhoneNumber).first();

  expect(phone?.id).toBeDefined();

  return phone!.id!;
}

async function addCallLogForPhone(
  studentId: number,
  phoneId: number,
  phoneNumber: string,
  phoneLabel: string,
  callResult: "not_reached" | "reached" | "call_later" | "appointment",
  callTime: string
) {
  await db.call_logs.add({
    uuid: crypto.randomUUID(),
    student_id: studentId,
    guardian_id: null,
    phone_id: phoneId,
    phone_snapshot: {
      phone_id: phoneId,
      reference_label: phoneLabel,
      relation_label: "Telefon",
      phone_number: phoneNumber
    },
    contacted_phone_id: phoneId,
    contacted_phone_number: phoneNumber,
    contacted_phone_label: phoneLabel,
    call_time: callTime,
    call_result: callResult,
    note: null,
    reminder_at: null,
    next_action: null,
    created_by: "agent",
    created_reminder_id: null,
    created_appointment_id: null,
    sync_status: "local",
    created_at: callTime,
    updated_at: callTime,
    deleted_at: null
  });
}

function mockClipboard(writeText = vi.fn().mockResolvedValue(undefined)) {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText }
  });

  return writeText;
}

describe("StudentsPage phone selection", () => {
  beforeEach(async () => {
    Element.prototype.scrollIntoView = vi.fn();
    window.localStorage.clear();
    await db.delete();
    await db.open();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined
    });
    window.localStorage.clear();
    await db.delete();
  });

  it("uses a selected extra phone as the call log context", async () => {
    const user = userEvent.setup();
    await seedStudentWithPhones("MELIS KAYA", "selection");

    renderStudentsPage();

    const phone3Card = (await screen.findByText("Telefon 3")).closest(".drawer-phone-card");
    expect(phone3Card).not.toBeNull();

    await user.click(
      within(phone3Card as HTMLElement).getByRole("button", {
        name: "Bu görüşmede kullanılacak telefon"
      })
    );

    const selectedPhoneControl = within(phone3Card as HTMLElement).getByRole("button", {
      name: "Bu görüşmede kullanılacak telefon seçili"
    });

    expect(selectedPhoneControl).toHaveAttribute("aria-pressed", "true");
    expect(selectedPhoneControl).toHaveAttribute("title", "Bu görüşmede kullanılacak telefon seçili");
    expect(selectedPhoneControl.closest(".phone-actions")).not.toBeNull();
    expect(selectedPhoneControl).not.toHaveTextContent("Bu görüşmede kullanılacak telefon");
    expect(phone3Card).toHaveClass("contacted");
    expect(within(phone3Card as HTMLElement).getByText("Son görüşülen / iletişim kurulan numara")).toBeInTheDocument();
    expect(
      within(phone3Card as HTMLElement).getByRole("button", {
        name: "Yanlış / kullanılmayacak numara"
      })
    ).toBeInTheDocument();

    await user.selectOptions(getCallResultSelect(), "reached");
    await user.click(screen.getByRole("button", { name: /Kaydet ve sonrakine geç/ }));

    expect(await screen.findByText("Telefon 3 · Öğrenci: 0532 100 0003")).toBeInTheDocument();
  });

  it("hides default active phone labels while keeping special phone status labels", async () => {
    const user = userEvent.setup();
    await seedStudentWithPhones("MELIS KAYA", "status-labels");

    renderStudentsPage();

    const phone1Card = await waitFor(() => getDrawerPhoneCard("Telefon 1"));
    const phone3Card = getDrawerPhoneCard("Telefon 3");

    expect(within(phone1Card).queryByText("Aktif numara")).not.toBeInTheDocument();
    expect(within(phone3Card).queryByText("Aktif numara")).not.toBeInTheDocument();

    await user.click(
      within(phone3Card).getByRole("button", {
        name: "Bu görüşmede kullanılacak telefon"
      })
    );

    expect(
      within(getDrawerPhoneCard("Telefon 3")).getByText("Son görüşülen / iletişim kurulan numara")
    ).toBeInTheDocument();

    await user.click(
      within(getDrawerPhoneCard("Telefon 3")).getByRole("button", {
        name: "Bu görüşmede kullanılacak telefon seçili"
      })
    );
    await waitFor(() => {
      expect(getDrawerPhoneCard("Telefon 3")).not.toHaveClass("contacted");
    });

    await user.click(
      within(getDrawerPhoneCard("Telefon 3")).getByRole("button", {
        name: "Yanlış / kullanılmayacak numara"
      })
    );

    await waitFor(() => {
      expect(
        within(getDrawerPhoneCard("Telefon 3")).getByText("Yanlış numara / kullanılmıyor")
      ).toBeInTheDocument();
    });
  });

  it("shows an empty latest outcome state when a phone has no call log", async () => {
    await seedStudentWithPhones("MELIS KAYA", "empty-outcome");

    renderStudentsPage();

    const phone1Card = await waitFor(() => getDrawerPhoneCard("Telefon 1"));
    const phone3Card = getDrawerPhoneCard("Telefon 3");

    expect(within(phone1Card).getByText("Son sonuç: Yok")).toBeInTheDocument();
    expect(within(phone3Card).getByText("Son sonuç: Yok")).toBeInTheDocument();
    expect(within(phone1Card).getByRole("combobox", { name: "Telefon 1 Telefon durumu" })).toHaveValue("not_called");

    const phone1 = await db.phones.where("normalized_phone_number").equals("05321000001").first();
    expect(phone1?.call_outcome).toBeUndefined();
    expect(phone1?.call_outcome_updated_at).toBeUndefined();
  });

  it("persists phone-level outcomes from right-card dropdowns without changing call selection fields", async () => {
    const user = userEvent.setup();
    await seedStudentWithPhones("MELIS KAYA", "manual-phone-outcome");

    renderStudentsPage();

    const phone1Card = await waitFor(() => getDrawerPhoneCard("Telefon 1"));
    const phone2Card = getDrawerPhoneCard("Telefon 2");
    const phone3Card = getDrawerPhoneCard("Telefon 3");

    await user.selectOptions(within(phone1Card).getByRole("combobox", { name: "Telefon 1 Telefon durumu" }), "no_answer");
    await waitFor(async () => {
      const phone1 = await db.phones.where("normalized_phone_number").equals("05321000001").first();

      expect(phone1?.call_outcome).toBe("no_answer");
      expect(phone1?.call_outcome_updated_at).toBeTruthy();
      expect(phone1?.phone_status).toBe("active");
      expect(phone1?.is_wrong).toBe(false);
      expect(phone1?.is_valid).toBe(true);
    });
    expect(within(phone1Card).getByText(/Güncellendi:/)).toBeInTheDocument();

    await user.selectOptions(within(phone2Card).getByRole("combobox", { name: "Telefon 2 Telefon durumu" }), "busy");
    await waitFor(async () => {
      const phone2 = await db.phones.where("normalized_phone_number").equals("05321000002").first();

      expect(phone2?.relation_label).toBe("Anne");
      expect(phone2?.call_outcome).toBe("busy");
    });

    await user.selectOptions(within(phone3Card).getByRole("combobox", { name: "Telefon 3 Telefon durumu" }), "reached");
    await waitFor(async () => {
      const phone3 = await db.phones.where("normalized_phone_number").equals("05321000003").first();

      expect(phone3?.reference_label).toBe("Telefon 3");
      expect(phone3?.call_outcome).toBe("reached");
      expect(phone3?.phone_status).toBe("active");
    });

    const student = (await db.students.toArray())[0];
    expect(student.last_call_result).toBe("not_called");
    expect(within(phone3Card).getByText("Son sonuç: Yok")).toBeInTheDocument();
    expect(within(phone2Card).getByText("Anne telefonu")).toBeInTheDocument();
  });

  it("stores manual Aranmadı reset with a timestamp", async () => {
    const user = userEvent.setup();
    await seedStudentWithPhones("MELIS KAYA", "manual-reset");
    const phone1Id = await getPhoneId("05321000001");
    await db.phones.update(phone1Id, {
      call_outcome: "reached",
      call_outcome_updated_at: "2026-05-10T08:00:00.000Z"
    });

    renderStudentsPage();

    const phone1Card = await waitFor(() => getDrawerPhoneCard("Telefon 1"));
    const outcomeSelect = within(phone1Card).getByRole("combobox", { name: "Telefon 1 Telefon durumu" });

    expect(outcomeSelect).toHaveValue("reached");

    await user.selectOptions(outcomeSelect, "not_called");

    await waitFor(async () => {
      const phone1 = await db.phones.get(phone1Id);

      expect(phone1?.call_outcome).toBe("not_called");
      expect(phone1?.call_outcome_updated_at).not.toBe("2026-05-10T08:00:00.000Z");
      expect(phone1?.call_outcome_updated_at).toBeTruthy();
    });
  });

  it("shows the latest call outcome for Telefon 1, Telefon 2, and Telefon 3+ cards", async () => {
    const studentId = await seedStudentWithPhones("MELIS KAYA", "phone-outcomes");
    const phone1Id = await getPhoneId("05321000001");
    const phone2Id = await getPhoneId("05321000002");
    const phone3Id = await getPhoneId("05321000003");

    await addCallLogForPhone(
      studentId,
      phone1Id,
      "0532 100 0001",
      "Telefon 1",
      "not_reached",
      "2026-05-10T09:00:00.000Z"
    );
    await addCallLogForPhone(
      studentId,
      phone1Id,
      "0532 100 0001",
      "Telefon 1",
      "reached",
      "2026-05-10T11:00:00.000Z"
    );
    await addCallLogForPhone(
      studentId,
      phone2Id,
      "0532 100 0002",
      "Telefon 2",
      "call_later",
      "2026-05-10T10:00:00.000Z"
    );
    await addCallLogForPhone(
      studentId,
      phone3Id,
      "0532 100 0003",
      "Telefon 3",
      "reached",
      "2026-05-10T08:00:00.000Z"
    );
    await addCallLogForPhone(
      studentId,
      phone3Id,
      "0532 100 0003",
      "Telefon 3",
      "appointment",
      "2026-05-10T12:00:00.000Z"
    );

    renderStudentsPage();

    const phone1Card = await waitFor(() => getDrawerPhoneCard("Telefon 1"));
    const phone2Card = getDrawerPhoneCard("Telefon 2");
    const phone3Card = getDrawerPhoneCard("Telefon 3");

    await waitFor(() => {
      expect(within(phone1Card).getByText("Son sonuç: Görüşüldü")).toBeInTheDocument();
      expect(within(phone2Card).getByText("Son sonuç: Sonra Aranacak")).toBeInTheDocument();
      expect(within(phone3Card).getByText("Son sonuç: Randevu Verildi")).toBeInTheDocument();
    });
  });

  it("shows invalid format for invalid extra phones", async () => {
    await seedStudentWithPhones("MELIS KAYA", "invalid-format");
    const phone3 = await db.phones.where("normalized_phone_number").equals("05321000003").first();
    expect(phone3?.id).toBeDefined();
    await db.phones.update(phone3!.id!, {
      is_valid: false,
      phone_status: "active",
      is_wrong: false
    });

    renderStudentsPage();

    const phone3Card = await waitFor(() => getDrawerPhoneCard("Telefon 3"));

    expect(within(phone3Card).getByText("Geçersiz format")).toBeInTheDocument();
    expect(within(phone3Card).queryByText("Aktif numara")).not.toBeInTheDocument();
  });

  it("keeps one contacted phone across legacy and extra phone controls", async () => {
    const user = userEvent.setup();
    await seedStudentWithPhones("MELIS KAYA", "parity");

    renderStudentsPage();

    const phone1Card = await waitFor(() => getDrawerPhoneCard("Telefon 1"));
    expect(within(phone1Card).getByRole("button", { name: "Bu görüşmede kullanılacak telefon" })).toHaveAttribute(
      "title",
      "Bu görüşmede kullanılacak telefon"
    );
    expect(within(phone1Card).getByRole("button", { name: "Yanlış / kullanılmayacak numara" })).toHaveAttribute(
      "title",
      "Yanlış / kullanılmayacak numara"
    );

    await user.click(
      within(phone1Card).getByRole("button", {
        name: "Bu görüşmede kullanılacak telefon"
      })
    );

    await waitFor(() => {
      expect(getDrawerPhoneCard("Telefon 1")).toHaveClass("contacted");
    });

    const phone3Card = getDrawerPhoneCard("Telefon 3");

    await user.click(
      within(phone3Card).getByRole("button", {
        name: "Bu görüşmede kullanılacak telefon"
      })
    );

    await waitFor(async () => {
      const phone1 = await db.phones.where("normalized_phone_number").equals("05321000001").first();
      const phone3 = await db.phones.where("normalized_phone_number").equals("05321000003").first();

      expect(phone1?.phone_status).toBe("active");
      expect(phone3?.phone_status).toBe("contacted");
      expect(getDrawerPhoneCard("Telefon 1")).not.toHaveClass("contacted");
      expect(getDrawerPhoneCard("Telefon 3")).toHaveClass("contacted");
      expect(
        within(getDrawerPhoneCard("Telefon 3")).getByText("Son görüşülen / iletişim kurulan numara")
      ).toBeInTheDocument();
    });

    await user.click(
      within(getDrawerPhoneCard("Telefon 3")).getByRole("button", {
        name: "Bu görüşmede kullanılacak telefon seçili"
      })
    );

    await waitFor(async () => {
      const phone3 = await db.phones.where("normalized_phone_number").equals("05321000003").first();

      expect(phone3?.phone_status).toBe("active");
      expect(getDrawerPhoneCard("Telefon 3")).not.toHaveClass("contacted");
      expect(
        within(getDrawerPhoneCard("Telefon 3")).getByRole("button", {
          name: "Bu görüşmede kullanılacak telefon"
        })
      ).toHaveAttribute("aria-pressed", "false");
    });
  });

  it("lets extra phone unused action update the phone status", async () => {
    const user = userEvent.setup();
    await seedStudentWithPhones("MELIS KAYA", "readonly");

    renderStudentsPage();

    const phone3Card = (await screen.findByText("Telefon 3")).closest(".drawer-phone-card");
    expect(phone3Card).not.toBeNull();

    expect(
      within(phone3Card as HTMLElement).getByRole("button", {
        name: "Bu görüşmede kullanılacak telefon"
      })
    ).toHaveAttribute("title", "Bu görüşmede kullanılacak telefon");

    const invalidControl = within(phone3Card as HTMLElement).getByRole("button", {
      name: "Yanlış / kullanılmayacak numara"
    });

    expect(invalidControl).toBeInTheDocument();
    expect(invalidControl).toHaveAttribute("title", "Yanlış / kullanılmayacak numara");

    await user.click(invalidControl);

    await waitFor(async () => {
      const updatedPhone = await db.phones.where("normalized_phone_number").equals("05321000003").first();

      expect(updatedPhone?.phone_status).toBe("invalid");
      expect(updatedPhone?.is_wrong).toBe(true);
    });

    expect(
      within(phone3Card as HTMLElement).getByRole("button", {
        name: "Yanlış / kullanılmayacak numara"
      })
    ).toHaveClass("active", "invalid");
  });

  it("copies visible phone numbers from the copy control without changing phone action behavior", async () => {
    const user = userEvent.setup();
    const writeText = mockClipboard();
    await seedStudentWithPhones("MELIS KAYA", "copy");

    renderStudentsPage();

    const phone1Card = await waitFor(() => getDrawerPhoneCard("Telefon 1"));
    const phone1Number = within(phone1Card).getByText("0532 100 0001");

    await user.click(phone1Number);
    expect(writeText).not.toHaveBeenCalled();
    expect(phone1Number).toBeInTheDocument();

    await user.hover(phone1Number);
    await user.click(within(phone1Card).getByRole("button", { name: "Telefon numarasını kopyala" }));

    expect(writeText).toHaveBeenCalledWith("0532 100 0001");
    expect(within(phone1Card).getByRole("button", { name: "Telefon numarasını kopyala" })).toHaveAttribute(
      "title",
      "Kopyalandı"
    );

    const phone3Card = getDrawerPhoneCard("Telefon 3");
    const phone3Number = within(phone3Card).getByText("0532 100 0003");
    await user.click(phone3Number);
    expect(writeText).not.toHaveBeenCalledWith("0532 100 0003");

    await user.hover(phone3Number);
    await user.click(within(phone3Card).getByRole("button", { name: "Telefon numarasını kopyala" }));

    expect(writeText).toHaveBeenCalledWith("0532 100 0003");

    writeText.mockClear();

    await user.click(
      within(phone3Card).getByRole("button", {
        name: "Bu görüşmede kullanılacak telefon"
      })
    );

    expect(writeText).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(getDrawerPhoneCard("Telefon 3")).toHaveClass("contacted");
    });

    await user.click(
      within(getDrawerPhoneCard("Telefon 3")).getByRole("button", {
        name: "Yanlış / kullanılmayacak numara"
      })
    );

    expect(writeText).not.toHaveBeenCalled();
  });

  it("does not crash when clipboard access is unavailable", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined
    });
    await seedStudentWithPhones("MELIS KAYA", "no-clipboard");

    renderStudentsPage();

    const phone1Card = await waitFor(() => getDrawerPhoneCard("Telefon 1"));
    const phone1Number = within(phone1Card).getByText("0532 100 0001");
    await user.hover(phone1Number);
    await user.click(within(phone1Card).getByRole("button", { name: "Telefon numarasını kopyala" }));

    expect(within(phone1Card).getByText("0532 100 0001")).toBeInTheDocument();
  });

  it("keeps the copy control briefly visible after mouse leave", async () => {
    mockClipboard();
    await seedStudentWithPhones("MELIS KAYA", "copy-timer");

    renderStudentsPage();

    const phone1Card = await waitFor(() => getDrawerPhoneCard("Telefon 1"));
    const phone1Number = within(phone1Card).getByText("0532 100 0001");

    vi.useFakeTimers();

    fireEvent.mouseEnter(phone1Number);
    expect(within(phone1Card).getByRole("button", { name: "Telefon numarasını kopyala" })).toBeInTheDocument();

    fireEvent.mouseLeave(phone1Number);

    act(() => {
      vi.advanceTimersByTime(199);
    });

    expect(within(phone1Card).getByRole("button", { name: "Telefon numarasını kopyala" })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(within(phone1Card).queryByRole("button", { name: "Telefon numarasını kopyala" })).not.toBeInTheDocument();
  });

  it("hides the copied state after a short tick without returning to the copy icon", async () => {
    const writeText = mockClipboard();
    await seedStudentWithPhones("MELIS KAYA", "copy-success-timer");

    renderStudentsPage();

    const phone1Card = await waitFor(() => getDrawerPhoneCard("Telefon 1"));
    const phone1Number = within(phone1Card).getByText("0532 100 0001");

    vi.useFakeTimers();

    fireEvent.mouseEnter(phone1Number);
    fireEvent.click(within(phone1Card).getByRole("button", { name: "Telefon numarasını kopyala" }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(writeText).toHaveBeenCalledWith("0532 100 0001");
    expect(within(phone1Card).getByRole("button", { name: "Telefon numarasını kopyala" })).toHaveAttribute(
      "title",
      "Kopyalandı"
    );

    act(() => {
      vi.advanceTimersByTime(199);
    });

    expect(within(phone1Card).getByRole("button", { name: "Telefon numarasını kopyala" })).toHaveAttribute(
      "title",
      "Kopyalandı"
    );

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(within(phone1Card).queryByRole("button", { name: "Telefon numarasını kopyala" })).not.toBeInTheDocument();

    fireEvent.mouseEnter(phone1Number);

    expect(within(phone1Card).getByRole("button", { name: "Telefon numarasını kopyala" })).toHaveAttribute(
      "title",
      "Telefon numarasını kopyala"
    );
  });

  it("requires an explicit call phone when multiple eligible phones exist", async () => {
    const user = userEvent.setup();
    await seedStudentWithPhones("MELIS KAYA", "validation");

    renderStudentsPage();

    await screen.findByText("Telefon 3");
    await user.selectOptions(getCallResultSelect(), "reached");
    await user.click(screen.getByRole("button", { name: /Kaydet ve sonrakine geç/ }));

    expect(
      await screen.findByText("Hangi numarayla görüşüldü? Lütfen görüşmede kullanılan telefonu seçin.")
    ).toBeInTheDocument();
  });

  it("resets the selected extra phone when the selected student changes", async () => {
    const user = userEvent.setup();
    await seedStudentWithPhones("DENIZ ARSLAN", "second");
    await seedStudentWithPhones("MELIS KAYA", "first");

    renderStudentsPage();

    const phone3Card = (await screen.findByText("Telefon 3")).closest(".drawer-phone-card");
    expect(phone3Card).not.toBeNull();

    await user.click(
      within(phone3Card as HTMLElement).getByRole("button", {
        name: "Bu görüşmede kullanılacak telefon"
      })
    );
    expect(screen.getByRole("button", { name: "Bu görüşmede kullanılacak telefon seçili" })).toBeInTheDocument();

    await user.click(await screen.findByText("DENIZ ARSLAN"));

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Bu görüşmede kullanılacak telefon seçili" })).not.toBeInTheDocument();
    });
  });
});

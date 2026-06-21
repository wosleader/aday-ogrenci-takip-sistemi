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
    expect(within(phone1Card).queryByRole("combobox", { name: "Telefon 1 Telefon durumu" })).not.toBeInTheDocument();
    expect(within(phone1Card).getByRole("button", { name: "Telefon durumu: Aranmadı" })).toHaveAttribute(
      "aria-haspopup",
      "menu"
    );
    const headerRow = phone1Card.querySelector(".phone-card-header-row") as HTMLElement;
    const bodyRow = phone1Card.querySelector(".phone-card-body-row") as HTMLElement;
    const footerRow = phone1Card.querySelector(".phone-card-footer-row") as HTMLElement;

    expect(headerRow).not.toBeNull();
    expect(bodyRow).not.toBeNull();
    expect(footerRow).not.toBeNull();
    expect(within(headerRow).getByText("Telefon 1")).toBeInTheDocument();
    expect(within(headerRow).queryByRole("button", { name: /Telefon durumu:/ })).not.toBeInTheDocument();
    expect(within(bodyRow).getByText("0532 100 0001")).toBeInTheDocument();
    expect(within(bodyRow).getByRole("button", { name: "Bu görüşmede kullanılacak telefon" })).toBeInTheDocument();
    expect(within(bodyRow).getByRole("button", { name: "Yanlış / kullanılmayacak numara" })).toBeInTheDocument();
    expect(within(bodyRow).getByRole("button", { name: "Bu görüşmede kullanılacak telefon" }).closest(".phone-card-action-row")).toBe(
      within(bodyRow).getByRole("button", { name: "Yanlış / kullanılmayacak numara" }).closest(".phone-card-action-row")
    );
    expect(within(footerRow).getByText("Son sonuç: Yok")).toBeInTheDocument();
    expect(within(footerRow).getByRole("button", { name: "Telefon durumu: Aranmadı" })).toBeInTheDocument();

    const phone1 = await db.phones.where("normalized_phone_number").equals("05321000001").first();
    expect(phone1?.call_outcome).toBeUndefined();
    expect(phone1?.call_outcome_updated_at).toBeUndefined();
  });

  it("anchors the outcome menu close to the chip when opening downward", async () => {
    const user = userEvent.setup();
    const originalInnerHeight = window.innerHeight;
    await seedStudentWithPhones("MELIS KAYA", "outcome-bottom-anchor");

    renderStudentsPage();

    const phone1Card = await waitFor(() => getDrawerPhoneCard("Telefon 1"));
    const outcomeChip = within(phone1Card).getByRole("button", { name: "Telefon durumu: Aranmadı" });
    const triggerBottom = 124;

    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 500
    });
    vi.spyOn(outcomeChip, "getBoundingClientRect").mockReturnValue({
      bottom: triggerBottom,
      height: 24,
      left: 300,
      right: 420,
      top: 100,
      width: 120,
      x: 300,
      y: 100,
      toJSON: () => ({})
    } as DOMRect);

    await user.click(outcomeChip);

    const menu = screen.getByRole("menu");
    const gap = Number.parseFloat(menu.style.top) - triggerBottom;
    expect(menu).toHaveAttribute("data-placement", "bottom");
    expect(menu).toHaveStyle("position: fixed");
    expect(menu).toHaveStyle("z-index: 2000");
    expect(gap).toBeGreaterThanOrEqual(4);
    expect(gap).toBeLessThanOrEqual(10);

    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: originalInnerHeight
    });
  });

  it("opens the outcome menu upward when there is not enough viewport space below the chip", async () => {
    const user = userEvent.setup();
    const originalInnerHeight = window.innerHeight;
    await seedStudentWithPhones("MELIS KAYA", "outcome-placement");

    renderStudentsPage();

    const phone1Card = await waitFor(() => getDrawerPhoneCard("Telefon 1"));
    const outcomeChip = within(phone1Card).getByRole("button", { name: "Telefon durumu: Aranmadı" });
    const triggerTop = 454;
    const renderedMenuHeight = 210;

    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 500
    });
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      if (this instanceof HTMLElement && this.classList.contains("phone-outcome-menu")) {
        return {
          bottom: 0,
          height: renderedMenuHeight,
          left: 0,
          right: 156,
          top: 0,
          width: 156,
          x: 0,
          y: 0,
          toJSON: () => ({})
        } as DOMRect;
      }

      return {
        bottom: 0,
        height: 0,
        left: 0,
        right: 0,
        top: 0,
        width: 0,
        x: 0,
        y: 0,
        toJSON: () => ({})
      } as DOMRect;
    });
    vi.spyOn(outcomeChip, "getBoundingClientRect").mockReturnValue({
      bottom: 478,
      height: 24,
      left: 300,
      right: 420,
      top: triggerTop,
      width: 120,
      x: 300,
      y: triggerTop,
      toJSON: () => ({})
    } as DOMRect);

    await user.click(outcomeChip);

    const menu = screen.getByRole("menu");
    expect(menu).toHaveAttribute("data-placement", "top");
    expect(menu).toHaveClass("phone-outcome-menu-top");
    expect(menu).toHaveStyle("position: fixed");
    expect(menu).toHaveStyle("z-index: 2000");
    expect(menu).toHaveStyle("overflow-y: visible");
    const menuBottom = Number.parseFloat(menu.style.top) + Number.parseFloat(menu.style.maxHeight);
    const gap = triggerTop - menuBottom;
    expect(gap).toBeGreaterThanOrEqual(4);
    expect(gap).toBeLessThanOrEqual(10);

    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: originalInnerHeight
    });
  });

  it("keeps the outcome menu scrollable when viewport space is constrained", async () => {
    const user = userEvent.setup();
    const originalInnerHeight = window.innerHeight;
    await seedStudentWithPhones("MELIS KAYA", "outcome-constrained");

    renderStudentsPage();

    const phone1Card = await waitFor(() => getDrawerPhoneCard("Telefon 1"));
    const outcomeChip = within(phone1Card).getByRole("button", { name: "Telefon durumu: Aranmadı" });
    const triggerTop = 100;

    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 220
    });
    vi.spyOn(outcomeChip, "getBoundingClientRect").mockReturnValue({
      bottom: 124,
      height: 24,
      left: 300,
      right: 420,
      top: triggerTop,
      width: 120,
      x: 300,
      y: triggerTop,
      toJSON: () => ({})
    } as DOMRect);

    await user.click(outcomeChip);

    const menu = screen.getByRole("menu");
    expect(menu).toHaveStyle("position: fixed");
    expect(menu).toHaveStyle("z-index: 2000");
    expect(menu).toHaveStyle("overflow-y: auto");
    expect(Number.parseFloat(menu.style.maxHeight)).toBeLessThan(252);
    const menuBottom = Number.parseFloat(menu.style.top) + Number.parseFloat(menu.style.maxHeight);
    const gap = triggerTop - menuBottom;
    expect(gap).toBeGreaterThanOrEqual(4);
    expect(gap).toBeLessThanOrEqual(10);

    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: originalInnerHeight
    });
  });

  it("persists phone-level outcomes from right-card dropdowns without changing call selection fields", async () => {
    const user = userEvent.setup();
    await seedStudentWithPhones("MELIS KAYA", "manual-phone-outcome");

    renderStudentsPage();

    const phone1Card = await waitFor(() => getDrawerPhoneCard("Telefon 1"));
    const phone2Card = getDrawerPhoneCard("Telefon 2");
    const phone3Card = getDrawerPhoneCard("Telefon 3");

    const phone2Header = phone2Card.querySelector(".phone-card-header-row") as HTMLElement;
    const phone2Footer = phone2Card.querySelector(".phone-card-footer-row") as HTMLElement;
    expect(within(phone2Header).getByText("Telefon 2")).toBeInTheDocument();
    expect(within(phone2Header).getByText("Anne telefonu")).toBeInTheDocument();
    expect(within(phone2Header).queryByRole("button", { name: /Telefon durumu:/ })).not.toBeInTheDocument();
    expect(within(phone2Footer).getByRole("button", { name: "Telefon durumu: Aranmadı" })).toBeInTheDocument();

    await user.click(within(phone1Card).getByRole("button", { name: "Telefon durumu: Aranmadı" }));
    expect((await db.phones.where("normalized_phone_number").equals("05321000001").first())?.call_outcome).toBeUndefined();

    const phone1Menu = screen.getByRole("menu");
    expect(phone1Menu).toHaveAttribute("data-placement", "bottom");
    expect(phone1Menu).toHaveClass("phone-outcome-menu", "phone-outcome-menu-bottom");
    expect(phone1Menu).toHaveStyle("position: fixed");
    expect(phone1Menu).toHaveStyle("z-index: 2000");
    expect(phone1Card).toHaveStyle("z-index: 30");
    expect(within(phone1Menu).getAllByRole("menuitemradio").map((item) => item.textContent?.replace(/\s+/g, " ").trim())).toEqual([
      "Aranmadı",
      "Cevap Yok",
      "Meşgul",
      "Kapalı",
      "Görüşüldü",
      "Yanlış Numara",
      "Kullanılmıyor"
    ]);

    await user.click(within(phone1Menu).getByRole("menuitemradio", { name: "Cevap Yok" }));
    await waitFor(async () => {
      const phone1 = await db.phones.where("normalized_phone_number").equals("05321000001").first();

      expect(phone1?.call_outcome).toBe("no_answer");
      expect(phone1?.call_outcome_updated_at).toBeTruthy();
      expect(phone1?.phone_status).toBe("active");
      expect(phone1?.is_wrong).toBe(false);
      expect(phone1?.is_valid).toBe(true);
    });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(within(phone1Card).queryByText(/Güncellendi:/)).not.toBeInTheDocument();
    expect(within(phone1Card).getByRole("button", { name: "Telefon durumu: Cevap Yok" })).toHaveAttribute(
      "title",
      expect.stringContaining("Güncellendi:")
    );

    await user.click(within(phone2Card).getByRole("button", { name: "Telefon durumu: Aranmadı" }));
    await user.click(screen.getByRole("menuitemradio", { name: "Meşgul" }));
    await waitFor(async () => {
      const phone2 = await db.phones.where("normalized_phone_number").equals("05321000002").first();

      expect(phone2?.relation_label).toBe("Anne");
      expect(phone2?.call_outcome).toBe("busy");
    });

    await user.click(within(phone3Card).getByRole("button", { name: "Telefon durumu: Aranmadı" }));
    await user.click(screen.getByRole("menuitemradio", { name: "Görüşüldü" }));
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
    expect(within(phone1Card).getByRole("button", { name: "Telefon durumu: Görüşüldü" })).toBeInTheDocument();

    await user.click(within(phone1Card).getByRole("button", { name: "Telefon durumu: Görüşüldü" }));
    await user.click(screen.getByRole("menuitemradio", { name: "Aranmadı" }));

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

  it("opens WhatsApp draft modal, builds a wa.me URL, and writes local draft logs", async () => {
    const user = userEvent.setup();
    const writeText = mockClipboard();
    const openSpy = vi.spyOn(window, "open").mockReturnValue({} as Window);
    await seedStudentWithPhones("MELIS KAYA", "whatsapp-draft");

    renderStudentsPage();

    const phone1Card = await waitFor(() => getDrawerPhoneCard("Telefon 1"));
    const phone3Card = getDrawerPhoneCard("Telefon 3");

    expect(within(phone1Card).getByRole("button", { name: "Telefon 1 WhatsApp taslak mesajı" })).toBeInTheDocument();
    expect(within(phone3Card).getByRole("button", { name: "Telefon 3 WhatsApp taslak mesajı" })).toBeInTheDocument();

    await user.click(within(phone1Card).getByRole("button", { name: "Telefon 1 WhatsApp taslak mesajı" }));

    const dialog = await screen.findByRole("dialog", { name: "WhatsApp Taslak Mesajı" });
    expect(within(dialog).getByText("MELIS KAYA")).toBeInTheDocument();
    expect(within(dialog).getByText("Telefon 1: 0532 100 0001")).toBeInTheDocument();

    await user.selectOptions(within(dialog).getByLabelText("Şablon"), "kurum-bilgisi-konum");

    const preview = within(dialog).getByLabelText("Mesaj önizleme") as HTMLTextAreaElement;
    expect(preview.value).toContain("Doğanbey Mh. 1. Doğanbey Sk.");
    expect(preview.value).toContain("https://www.instagram.com/bursaakademiknot/");
    expect(preview.value).toContain("https://maps.app.goo.gl/AjMa1AcJxZyE9oZq8");

    await user.click(within(dialog).getByRole("button", { name: "WhatsApp'ta Aç" }));

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining("https://wa.me/905321000001?text="),
      "_blank",
      "noopener,noreferrer"
    );
    await waitFor(async () => {
      const openedLog = await db.whatsapp_draft_logs.where("status").equals("draft_opened").first();

      expect(openedLog?.template_title).toBe("Kurum Bilgisi + Konum");
      expect(openedLog?.phone_number).toBe("0532 100 0001");
    });

    await user.click(within(dialog).getByRole("button", { name: "Mesajı Kopyala" }));
    expect(writeText).toHaveBeenCalledWith(preview.value);

    await user.click(within(dialog).getByRole("button", { name: "Gönderildi olarak işaretle" }));

    await waitFor(async () => {
      const logs = await db.whatsapp_draft_logs.orderBy("id").toArray();

      expect(logs.map((log) => log.status)).toEqual(["draft_opened", "copied", "manually_marked_sent"]);
    });
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

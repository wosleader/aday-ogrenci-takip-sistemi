import { render, screen, waitFor, within } from "@testing-library/react";
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

describe("StudentsPage phone selection", () => {
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

  it("uses a selected extra phone as the call log context", async () => {
    const user = userEvent.setup();
    await seedStudentWithPhones("MELIS KAYA", "selection");

    renderStudentsPage();

    const phone3Card = (await screen.findByText("Telefon 3 · Öğrenci")).closest(".drawer-phone-card");
    expect(phone3Card).not.toBeNull();

    await user.click(
      within(phone3Card as HTMLElement).getByRole("button", {
        name: "Bu numarayla görüşüldü"
      })
    );

    const selectedPhoneControl = within(phone3Card as HTMLElement).getByRole("button", {
      name: "Görüşmede kullanılacak"
    });

    expect(selectedPhoneControl).toHaveAttribute("aria-pressed", "true");
    expect(selectedPhoneControl.closest(".phone-actions")).not.toBeNull();
    expect(selectedPhoneControl).not.toHaveTextContent("Görüşmede kullanılacak");
    expect(phone3Card).toHaveClass("contacted");
    expect(within(phone3Card as HTMLElement).getByText("Son görüşülen / iletişim kurulan numara")).toBeInTheDocument();
    expect(
      within(phone3Card as HTMLElement).getByRole("button", {
        name: "Yanlış numara veya kullanılmıyor olarak işaretle"
      })
    ).toBeInTheDocument();

    await user.selectOptions(getCallResultSelect(), "reached");
    await user.click(screen.getByRole("button", { name: /Kaydet ve sonrakine geç/ }));

    expect(await screen.findByText("Telefon 3 · Öğrenci: 0532 100 0003")).toBeInTheDocument();
  });

  it("keeps one contacted phone across legacy and extra phone controls", async () => {
    const user = userEvent.setup();
    await seedStudentWithPhones("MELIS KAYA", "parity");

    renderStudentsPage();

    const phone1Card = await waitFor(() => getDrawerPhoneCard("Telefon 1"));

    await user.click(
      within(phone1Card).getByRole("button", {
        name: "Son görüşülen numara olarak işaretle"
      })
    );

    await waitFor(() => {
      expect(getDrawerPhoneCard("Telefon 1")).toHaveClass("contacted");
    });

    const phone3Card = getDrawerPhoneCard("Telefon 3 · Öğrenci");

    await user.click(
      within(phone3Card).getByRole("button", {
        name: "Bu numarayla görüşüldü"
      })
    );

    await waitFor(async () => {
      const phone1 = await db.phones.where("normalized_phone_number").equals("05321000001").first();
      const phone3 = await db.phones.where("normalized_phone_number").equals("05321000003").first();

      expect(phone1?.phone_status).toBe("active");
      expect(phone3?.phone_status).toBe("contacted");
      expect(getDrawerPhoneCard("Telefon 1")).not.toHaveClass("contacted");
      expect(getDrawerPhoneCard("Telefon 3 · Öğrenci")).toHaveClass("contacted");
      expect(
        within(getDrawerPhoneCard("Telefon 3 · Öğrenci")).getByText("Son görüşülen / iletişim kurulan numara")
      ).toBeInTheDocument();
    });

    await user.click(
      within(getDrawerPhoneCard("Telefon 3 · Öğrenci")).getByRole("button", {
        name: "Görüşmede kullanılacak"
      })
    );

    await waitFor(async () => {
      const phone3 = await db.phones.where("normalized_phone_number").equals("05321000003").first();

      expect(phone3?.phone_status).toBe("active");
      expect(getDrawerPhoneCard("Telefon 3 · Öğrenci")).not.toHaveClass("contacted");
      expect(
        within(getDrawerPhoneCard("Telefon 3 · Öğrenci")).getByRole("button", {
          name: "Bu numarayla görüşüldü"
        })
      ).toHaveAttribute("aria-pressed", "false");
    });
  });

  it("lets extra phone unused action update the phone status", async () => {
    const user = userEvent.setup();
    await seedStudentWithPhones("MELIS KAYA", "readonly");

    renderStudentsPage();

    const phone3Card = (await screen.findByText("Telefon 3 · Öğrenci")).closest(".drawer-phone-card");
    expect(phone3Card).not.toBeNull();

    expect(
      within(phone3Card as HTMLElement).queryByRole("button", {
        name: "Son görüşülen numara olarak işaretle"
      })
    ).not.toBeInTheDocument();

    const invalidControl = within(phone3Card as HTMLElement).getByRole("button", {
      name: "Yanlış numara veya kullanılmıyor olarak işaretle"
    });

    expect(invalidControl).toBeInTheDocument();

    await user.click(invalidControl);

    await waitFor(async () => {
      const updatedPhone = await db.phones.where("normalized_phone_number").equals("05321000003").first();

      expect(updatedPhone?.phone_status).toBe("invalid");
      expect(updatedPhone?.is_wrong).toBe(true);
    });

    expect(
      within(phone3Card as HTMLElement).getByRole("button", {
        name: "Yanlış numara veya kullanılmıyor olarak işaretle"
      })
    ).toHaveClass("active", "invalid");
  });

  it("requires an explicit call phone when multiple eligible phones exist", async () => {
    const user = userEvent.setup();
    await seedStudentWithPhones("MELIS KAYA", "validation");

    renderStudentsPage();

    await screen.findByText("Telefon 3 · Öğrenci");
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

    const phone3Card = (await screen.findByText("Telefon 3 · Öğrenci")).closest(".drawer-phone-card");
    expect(phone3Card).not.toBeNull();

    await user.click(
      within(phone3Card as HTMLElement).getByRole("button", {
        name: "Bu numarayla görüşüldü"
      })
    );
    expect(screen.getByRole("button", { name: "Görüşmede kullanılacak" })).toBeInTheDocument();

    await user.click(await screen.findByText("DENIZ ARSLAN"));

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Görüşmede kullanılacak" })).not.toBeInTheDocument();
    });
  });
});

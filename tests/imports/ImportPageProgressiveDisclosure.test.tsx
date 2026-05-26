import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ImportPage } from "../../src/features/imports/ImportPage";
import type { ParsedWorksheet } from "../../src/features/imports/services/types";

const excelReaderMocks = vi.hoisted(() => ({
  parseFirstWorksheet: vi.fn(),
  reparseWorksheetWithHeaderRow: vi.fn()
}));

const duplicateGuardMocks = vi.hoisted(() => ({
  checkPossibleDuplicateImport: vi.fn()
}));

vi.mock("../../src/features/imports/services/excelReader", () => excelReaderMocks);

vi.mock("../../src/features/imports/services/importDuplicateGuard", () => duplicateGuardMocks);

function createWorksheet(headers: string[], rows: unknown[][]): ParsedWorksheet {
  return {
    file_name: "test-import.xlsx",
    sheet_name: "Sayfa1",
    ignored_sheet_names: [],
    raw_rows: [headers, ...rows],
    detected_header_row_number: 1,
    headers,
    rows,
    preview_rows: rows.slice(0, 20)
  };
}

function renderImportPage() {
  render(
    <MemoryRouter initialEntries={["/import"]}>
      <Routes>
        <Route path="/import" element={<ImportPage />} />
        <Route path="/students" element={<div>Aday listesi</div>} />
      </Routes>
    </MemoryRouter>
  );
}

async function uploadWorksheet(worksheet: ParsedWorksheet) {
  const user = userEvent.setup();
  excelReaderMocks.parseFirstWorksheet.mockResolvedValueOnce(worksheet);
  renderImportPage();

  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
  await user.upload(fileInput, new File(["mock"], "test-import.xlsx"));

  await screen.findByRole("heading", { name: "Kolon Eşleştirme" });

  return user;
}

function getSectionByHeading(name: string | RegExp) {
  const heading = screen.getByRole("heading", { name });
  const section = heading.closest("section");

  expect(section).not.toBeNull();

  return section as HTMLElement;
}

function findLogItem(section: HTMLElement, rowText: string, messageText: string) {
  return within(section).queryByText((content, element) => {
    const text = element?.textContent ?? content;

    return element?.tagName.toLowerCase() === "li" && text.includes(rowText) && text.includes(messageText);
  });
}

describe("ImportPage progressive disclosure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    window.sessionStorage.clear();
    duplicateGuardMocks.checkPossibleDuplicateImport.mockResolvedValue({
      isPossibleDuplicate: false,
      matched_imports: []
    });
  });

  it("collapses long column mapping rows and expands them on demand", async () => {
    const blankHeaders = Array.from({ length: 12 }, () => "");
    const worksheet = createWorksheet(
      ["Ad Soyad", "Telefon", ...blankHeaders],
      [["Ayşe Yılmaz", "0555 123 4567", ...blankHeaders]]
    );
    const user = await uploadWorksheet(worksheet);
    const mappingSection = getSectionByHeading("Kolon Eşleştirme");

    expect(within(mappingSection).getAllByText("Başlık boş")).toHaveLength(8);

    await user.click(within(mappingSection).getByRole("button", { name: "+4 kolon daha göster" }));

    expect(within(mappingSection).getAllByText("Başlık boş")).toHaveLength(12);

    await user.click(within(mappingSection).getByRole("button", { name: "Daha az göster" }));

    expect(within(mappingSection).getAllByText("Başlık boş")).toHaveLength(8);
  });

  it("keeps mapping-required columns visible in the collapsed column mapping list", async () => {
    const blankHeaders = Array.from({ length: 12 }, () => "");
    const worksheet = createWorksheet(
      ["Ad Soyad", ...blankHeaders, "Bilinmeyen Önemli"],
      [["Ayşe Yılmaz", ...blankHeaders, "değer"]]
    );

    await uploadWorksheet(worksheet);
    const mappingSection = getSectionByHeading("Kolon Eşleştirme");

    expect(within(mappingSection).getByText("Bilinmeyen Önemli")).toBeInTheDocument();
  });

  it("collapses long error logs and expands them on demand", async () => {
    const rows = Array.from({ length: 12 }, (_, index) => ["", `0555 000 00${String(index).padStart(2, "0")}`]);
    const worksheet = createWorksheet(["Ad Soyad", "Telefon"], rows);
    const user = await uploadWorksheet(worksheet);
    const errorsSection = getSectionByHeading("Hatalar (13)");

    expect(findLogItem(errorsSection, "Satır 10", "Ad Soyad alanı boş")).toBeInTheDocument();
    expect(findLogItem(errorsSection, "Satır 11", "Ad Soyad alanı boş")).not.toBeInTheDocument();

    await user.click(within(errorsSection).getByRole("button", { name: "+3 hata daha göster" }));

    expect(findLogItem(errorsSection, "Satır 11", "Ad Soyad alanı boş")).toBeInTheDocument();

    await user.click(within(errorsSection).getByRole("button", { name: "Daha az göster" }));

    expect(findLogItem(errorsSection, "Satır 11", "Ad Soyad alanı boş")).not.toBeInTheDocument();
  });

  it("collapses long warning logs and expands them on demand", async () => {
    const rows = Array.from({ length: 12 }, () => [""]);
    const worksheet = createWorksheet(["Ad Soyad"], rows);
    const user = await uploadWorksheet(worksheet);
    const warningsSection = getSectionByHeading("Uyarılar (13)");

    expect(findLogItem(warningsSection, "Satır 10", "satır tamamen boş")).toBeInTheDocument();
    expect(findLogItem(warningsSection, "Satır 11", "satır tamamen boş")).not.toBeInTheDocument();

    await user.click(within(warningsSection).getByRole("button", { name: "+3 uyarı daha göster" }));

    expect(findLogItem(warningsSection, "Satır 11", "satır tamamen boş")).toBeInTheDocument();

    await user.click(within(warningsSection).getByRole("button", { name: "Daha az göster" }));

    expect(findLogItem(warningsSection, "Satır 11", "satır tamamen boş")).not.toBeInTheDocument();
  });
});

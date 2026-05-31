import { render, screen, waitFor, within } from "@testing-library/react";
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

const importWriterMocks = vi.hoisted(() => ({
  writeImportToDatabase: vi.fn()
}));

const scrollIntoViewMock = vi.fn();

vi.mock("../../src/features/imports/services/excelReader", () => excelReaderMocks);

vi.mock("../../src/features/imports/services/importDuplicateGuard", () => duplicateGuardMocks);

vi.mock("../../src/features/imports/services/importWriter", () => importWriterMocks);

vi.mock("../../src/features/imports/services/logExport", async () => {
  const actual = await vi.importActual<typeof import("../../src/features/imports/services/logExport")>(
    "../../src/features/imports/services/logExport"
  );

  return {
    ...actual,
    downloadTextFile: vi.fn()
  };
});

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

function getFileInput() {
  return document.querySelector('input[type="file"]') as HTMLInputElement;
}

async function uploadWorksheet(worksheet: ParsedWorksheet) {
  const user = userEvent.setup();
  excelReaderMocks.parseFirstWorksheet.mockResolvedValueOnce(worksheet);
  renderImportPage();

  const fileInput = getFileInput();
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

function getMappingRowByHeader(mappingSection: HTMLElement, header: string) {
  const row = Array.from(mappingSection.querySelectorAll("tbody tr")).find((item) => {
    const cells = item.querySelectorAll("td");

    return cells[1]?.textContent === header;
  });

  expect(row).toBeDefined();

  return row as HTMLElement;
}

function getMappingRowsByHeader(mappingSection: HTMLElement, header: string) {
  return Array.from(mappingSection.querySelectorAll("tbody tr")).filter((row) =>
    Array.from(row.querySelectorAll("td")).some((cell) => cell.textContent === header)
  ) as HTMLElement[];
}

function getMappingSelect(mappingSection: HTMLElement, header: string) {
  return within(getMappingRowByHeader(mappingSection, header)).getByRole("combobox") as HTMLSelectElement;
}

function getMappingOption(select: HTMLSelectElement, label: string) {
  return within(select).getByRole("option", { name: label }) as HTMLOptionElement;
}

function getMappingOptionByValue(select: HTMLSelectElement, value: string) {
  const option = Array.from(select.options).find((item) => item.value === value);

  expect(option).toBeDefined();

  return option as HTMLOptionElement;
}

describe("ImportPage progressive disclosure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(Element.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoViewMock
    });
    scrollIntoViewMock.mockClear();
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.confirm = vi.fn(() => true);
    duplicateGuardMocks.checkPossibleDuplicateImport.mockResolvedValue({
      isPossibleDuplicate: false,
      matched_imports: []
    });
    importWriterMocks.writeImportToDatabase.mockResolvedValue({
      created_students: 1,
      created_guardians: 1,
      created_phones: 1,
      created_reminders: 0,
      saved_import_logs: 1,
      skipped_rows: 0,
      backup: {
        file_name: "import-oncesi-yedek.json",
        json: "{}"
      }
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
    expect(scrollIntoViewMock).not.toHaveBeenCalled();

    await user.click(within(mappingSection).getByRole("button", { name: "Daha az göster" }));

    expect(within(mappingSection).getAllByText("Başlık boş")).toHaveLength(8);
    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
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

  it("stages long error logs from 5 to 20, 50, and all items", async () => {
    const rows = Array.from({ length: 60 }, (_, index) => ["", `0555 000 00${String(index).padStart(2, "0")}`]);
    const worksheet = createWorksheet(["Ad Soyad", "Telefon"], rows);
    const user = await uploadWorksheet(worksheet);
    const errorsSection = getSectionByHeading("Hatalar (61)");

    expect(findLogItem(errorsSection, "Satır 5", "Ad Soyad alanı boş")).toBeInTheDocument();
    expect(findLogItem(errorsSection, "Satır 6", "Ad Soyad alanı boş")).not.toBeInTheDocument();
    expect(screen.queryByText(/Detayları göster/)).not.toBeInTheDocument();

    await user.click(within(errorsSection).getByRole("button", { name: "+15 daha fazla göster" }));

    expect(findLogItem(errorsSection, "Satır 20", "Ad Soyad alanı boş")).toBeInTheDocument();
    expect(findLogItem(errorsSection, "Satır 21", "Ad Soyad alanı boş")).not.toBeInTheDocument();

    await user.click(within(errorsSection).getByRole("button", { name: "+30 daha fazla göster" }));

    expect(findLogItem(errorsSection, "Satır 50", "Ad Soyad alanı boş")).toBeInTheDocument();
    expect(findLogItem(errorsSection, "Satır 51", "Ad Soyad alanı boş")).not.toBeInTheDocument();

    await user.click(within(errorsSection).getByRole("button", { name: "+11 daha fazla göster" }));

    expect(findLogItem(errorsSection, "Satır 61", "Ad Soyad alanı boş")).toBeInTheDocument();

    await user.click(within(errorsSection).getByRole("button", { name: "Daha az göster" }));

    expect(findLogItem(errorsSection, "Satır 6", "Ad Soyad alanı boş")).not.toBeInTheDocument();
  });

  it("stages long warning logs from 5 to 20, 50, and all items", async () => {
    const rows = Array.from({ length: 100 }, () => [""]);
    const worksheet = createWorksheet(["Ad Soyad"], rows);
    const user = await uploadWorksheet(worksheet);
    const warningsSection = getSectionByHeading("Uyarılar (101)");

    expect(findLogItem(warningsSection, "Satır 5", "satır tamamen boş")).toBeInTheDocument();
    expect(findLogItem(warningsSection, "Satır 6", "satır tamamen boş")).not.toBeInTheDocument();
    expect(screen.queryByText(/Detayları göster/)).not.toBeInTheDocument();

    await user.click(within(warningsSection).getByRole("button", { name: "+15 daha fazla göster" }));

    expect(findLogItem(warningsSection, "Satır 20", "satır tamamen boş")).toBeInTheDocument();
    expect(findLogItem(warningsSection, "Satır 21", "satır tamamen boş")).not.toBeInTheDocument();
    expect(scrollIntoViewMock).not.toHaveBeenCalled();

    await user.click(within(warningsSection).getByRole("button", { name: "+30 daha fazla göster" }));

    expect(findLogItem(warningsSection, "Satır 50", "satır tamamen boş")).toBeInTheDocument();
    expect(findLogItem(warningsSection, "Satır 51", "satır tamamen boş")).not.toBeInTheDocument();

    await user.click(within(warningsSection).getByRole("button", { name: "+51 daha fazla göster" }));

    expect(findLogItem(warningsSection, "Satır 101", "satır tamamen boş")).toBeInTheDocument();
    expect(within(warningsSection).getAllByText((content, element) => {
      const text = element?.textContent ?? content;

      return element?.tagName.toLowerCase() === "li" && text.includes("Satır 6:") && text.includes("satır tamamen boş");
    })).toHaveLength(1);
    expect(scrollIntoViewMock).not.toHaveBeenCalled();

    await user.click(within(warningsSection).getByRole("button", { name: "Daha az göster" }));

    expect(findLogItem(warningsSection, "Satır 6", "satır tamamen boş")).not.toBeInTheDocument();
    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
  });

  it("stages long info logs without a duplicate detail block", async () => {
    const rows = Array.from({ length: 60 }, (_, index) => [
      `Aday ${index + 1}`,
      "",
      `0555 100 00${String(index).padStart(2, "0")}`
    ]);
    const worksheet = createWorksheet(["Ad Soyad", "Telefon", "2. Telefon"], rows);
    const user = await uploadWorksheet(worksheet);
    const infoSection = getSectionByHeading("Bilgiler (63)");

    expect(findLogItem(infoSection, "Satır 3", "Telefon 1 boş")).toBeInTheDocument();
    expect(findLogItem(infoSection, "Satır 4", "Telefon 1 boş")).not.toBeInTheDocument();
    expect(screen.queryByText(/Detayları göster/)).not.toBeInTheDocument();

    await user.click(within(infoSection).getByRole("button", { name: "+15 daha fazla göster" }));

    expect(findLogItem(infoSection, "Satır 18", "Telefon 1 boş")).toBeInTheDocument();
    expect(findLogItem(infoSection, "Satır 19", "Telefon 1 boş")).not.toBeInTheDocument();

    await user.click(within(infoSection).getByRole("button", { name: "+30 daha fazla göster" }));

    expect(findLogItem(infoSection, "Satır 48", "Telefon 1 boş")).toBeInTheDocument();
    expect(findLogItem(infoSection, "Satır 49", "Telefon 1 boş")).not.toBeInTheDocument();

    await user.click(within(infoSection).getByRole("button", { name: "+13 daha fazla göster" }));

    expect(findLogItem(infoSection, "Satır 61", "Telefon 1 boş")).toBeInTheDocument();

    await user.click(within(infoSection).getByRole("button", { name: "Daha az göster" }));

    expect(findLogItem(infoSection, "Satır 4", "Telefon 1 boş")).not.toBeInTheDocument();
  });

  it("collapses the first 20 preview rows to 10 and expands them on demand", async () => {
    const rows = Array.from({ length: 20 }, (_, index) => [
      `Aday ${index + 1}`,
      `0555 200 00${String(index).padStart(2, "0")}`
    ]);
    const worksheet = createWorksheet(["Ad Soyad", "Telefon"], rows);
    const user = await uploadWorksheet(worksheet);
    const previewSection = getSectionByHeading("İlk 20 Satır Ön İzleme");

    expect(within(previewSection).getByText("Aday 10")).toBeInTheDocument();
    expect(within(previewSection).queryByText("Aday 11")).not.toBeInTheDocument();

    await user.click(within(previewSection).getByRole("button", { name: "+10 daha göster" }));

    expect(within(previewSection).getByText("Aday 20")).toBeInTheDocument();
    expect(scrollIntoViewMock).not.toHaveBeenCalled();

    await user.click(within(previewSection).getByRole("button", { name: "Daha az göster" }));

    expect(within(previewSection).queryByText("Aday 11")).not.toBeInTheDocument();
    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
  });

  it("does not show a preview expansion control for 10 or fewer preview rows", async () => {
    const rows = Array.from({ length: 10 }, (_, index) => [
      `Aday ${index + 1}`,
      `0555 300 00${String(index).padStart(2, "0")}`
    ]);
    const worksheet = createWorksheet(["Ad Soyad", "Telefon"], rows);

    await uploadWorksheet(worksheet);
    const previewSection = getSectionByHeading("İlk 20 Satır Ön İzleme");

    expect(within(previewSection).getByText("Aday 10")).toBeInTheDocument();
    expect(within(previewSection).queryByRole("button", { name: "+10 daha göster" })).not.toBeInTheDocument();
  });

  it("clears stale simulation and duplicate warning controls after a successful import", async () => {
    const worksheet = createWorksheet(
      ["Ad Soyad", "Telefon"],
      [["Ayşe Yılmaz", "0555 123 4567"]]
    );
    const user = await uploadWorksheet(worksheet);

    expect(screen.getByRole("heading", { name: "Kolon Eşleştirme" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "İçe Aktar" }));

    expect(await screen.findByRole("heading", { name: "İçe Aktarma Tamamlandı" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Kolon Eşleştirme" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Bu dosya daha önce içe aktarılmış olabilir" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Yine de içe aktar" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Eski import verisini temizleyip yeniden içe aktar" })
    ).not.toBeInTheDocument();
    expect(getFileInput().value).toBe("");

    duplicateGuardMocks.checkPossibleDuplicateImport.mockResolvedValueOnce({
      isPossibleDuplicate: true,
      matched_imports: [
        {
          import_id: 1,
          file_name: "test-import.xlsx",
          sheet_name: "Sayfa1",
          started_at: "2026-05-29T09:00:00.000Z",
          finished_at: "2026-05-29T09:01:00.000Z",
          imported_rows: 1
        }
      ]
    });
    excelReaderMocks.parseFirstWorksheet.mockResolvedValueOnce(worksheet);

    const fileInput = getFileInput();
    await user.upload(fileInput, new File(["mock"], "test-import.xlsx"));

    expect(await screen.findByRole("heading", { name: "Bu dosya daha önce içe aktarılmış olabilir" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Yine de içe aktar" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "İçe Aktarma Tamamlandı" })).not.toBeInTheDocument();
    expect(excelReaderMocks.parseFirstWorksheet).toHaveBeenCalledTimes(2);
    expect(fileInput.value).toBe("");
  });

  it("applies manual guardian mapping when importing without rerunning simulation", async () => {
    const worksheet = createWorksheet(
      ["Ad Soyad", "Veli Adı", "Telefon"],
      [["Ayşe Yılmaz", "Ahmet Veli", "0555 123 4567"]]
    );
    const user = await uploadWorksheet(worksheet);
    const mappingSection = getSectionByHeading("Kolon Eşleştirme");
    const guardianHeaderCell = within(mappingSection).getByText("Veli Adı");
    const guardianRow = guardianHeaderCell.closest("tr");

    expect(guardianRow).not.toBeNull();
    expect(within(guardianRow as HTMLElement).getByText("Elle eşleştirme gerekli")).toBeInTheDocument();

    await user.selectOptions(within(guardianRow as HTMLElement).getByRole("combobox"), "guardian_full_name");

    expect(within(guardianRow as HTMLElement).getByText("Elle eşleştirildi")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "İçe Aktar" }));

    await waitFor(() => expect(importWriterMocks.writeImportToDatabase).toHaveBeenCalledTimes(1));

    const [, summary] = importWriterMocks.writeImportToDatabase.mock.calls[0];
    const latestDuplicateCheckCall = duplicateGuardMocks.checkPossibleDuplicateImport.mock.calls.at(-1);

    expect(summary.simulated_rows[0].guardian_full_name).toBe("Ahmet Veli");
    expect(latestDuplicateCheckCall?.[1].simulated_rows[0].guardian_full_name).toBe("Ahmet Veli");
  });

  it("shows normalized phone labels in manual mapping dropdowns", async () => {
    const worksheet = createWorksheet(
      ["Ad Soyad", "Telefon", "2. Telefon", "Telefon 3"],
      [["Ayşe Yılmaz", "0555 111 1111", "0555 222 2222", "0555 333 3333"]]
    );
    await uploadWorksheet(worksheet);

    const mappingSection = getSectionByHeading("Kolon Eşleştirme");
    const phoneSelect = getMappingSelect(mappingSection, "Telefon");

    expect(getMappingOptionByValue(phoneSelect, "phone_1")).toHaveTextContent("Telefon 1");
    expect(getMappingOptionByValue(phoneSelect, "phone_2")).toHaveTextContent("Telefon 2");
    expect(getMappingOptionByValue(phoneSelect, "phone_3")).toHaveTextContent("Telefon 3");
    expect(within(phoneSelect).queryByRole("option", { name: "2. Telefon" })).not.toBeInTheDocument();
  });

  it("shows system export info columns as safe non-imported fields", async () => {
    const worksheet = createWorksheet(
      ["Ad Soyad", "Genel Açıklama", "Telefon 10", "Sıra No", "Telefon 1 Durumu", "Arama 2 Sonucu", "Dış Excel Notu"],
      [["Ayşe Yılmaz", "Export notu", "0555 000 0010", "1", "Aktif", "Görüşüldü", "Harici not"]]
    );
    const user = await uploadWorksheet(worksheet);

    const mappingSection = getSectionByHeading("Kolon Eşleştirme");
    const generalNoteRow = getMappingRowByHeader(mappingSection, "Genel Açıklama");
    const systemInfoTooltipText = "Bu kolon rapor/sistem bilgisidir. Aday kaydına aktarılmaz.";

    expect(within(mappingSection).getByText("Durum")).toBeInTheDocument();
    expect(within(mappingSection).queryByText("Güven")).not.toBeInTheDocument();
    expect(
      within(mappingSection).getByText(
        "Bazı kolonlar sistem tarafından tanınır ancak standart içe aktarmada kullanılmaz. Bu kolonlar “İçe Aktarılamaz” olarak gösterilir."
      )
    ).toBeInTheDocument();
    expect(within(generalNoteRow).getAllByText("Açıklama")[0].tagName).toBe("TD");
    expect(within(generalNoteRow).getByText("Tam eşleşti")).toBeInTheDocument();
    expect(within(generalNoteRow).queryByText("Sistem bilgisi — şu an içe aktarılmaz")).not.toBeInTheDocument();
    expect(within(getMappingRowByHeader(mappingSection, "Telefon 10")).getByText("Tam eşleşti")).toBeInTheDocument();
    expect(
      within(mappingSection).getByRole("button", { name: "İçe aktarılmayacak kolonları gizle" })
    ).toBeInTheDocument();

    let firstInfoBadge: HTMLElement | null = null;

    for (const header of ["Sıra No", "Telefon 1 Durumu", "Arama 2 Sonucu"]) {
      const row = getMappingRowByHeader(mappingSection, header);

      expect(within(row).getByText("İçe Aktarılamaz")).toBeInTheDocument();
      expect(within(row).queryByText("İçe Aktarılamaz i")).not.toBeInTheDocument();

      const infoBadge = within(row).getByRole("img", {
        name: systemInfoTooltipText
      });
      firstInfoBadge ??= infoBadge;

      expect(infoBadge).toBeInTheDocument();
      expect(infoBadge).toHaveTextContent("i");
      expect(infoBadge).toHaveStyle({
        backgroundColor: "#f7f1e8",
        borderRadius: "999px",
        cursor: "help",
        display: "inline-flex",
        height: "13px",
        userSelect: "none",
        width: "13px"
      });
      expect(within(row).getByText("İçe aktarılmayacak")).toBeInTheDocument();
      expect(within(row).queryByText("Elle eşleştirme gerekli")).not.toBeInTheDocument();
      expect(within(row).queryByText("Güvenli şekilde yok sayıldı")).not.toBeInTheDocument();
      expect(within(row).queryByText("ignored / 100%")).not.toBeInTheDocument();
    }

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    await user.hover(firstInfoBadge as HTMLElement);

    expect(await screen.findByRole("tooltip")).toHaveTextContent(systemInfoTooltipText);

    await user.unhover(firstInfoBadge as HTMLElement);

    await waitFor(() => expect(screen.queryByRole("tooltip")).not.toBeInTheDocument());

    expect(within(getMappingRowByHeader(mappingSection, "Dış Excel Notu")).getByText("Elle eşleştirme gerekli")).toBeInTheDocument();

    await user.click(within(mappingSection).getByRole("button", { name: "İçe aktarılmayacak kolonları gizle" }));

    expect(within(mappingSection).queryByText("Sıra No")).not.toBeInTheDocument();
    expect(within(mappingSection).queryByText("Telefon 1 Durumu")).not.toBeInTheDocument();
    expect(within(mappingSection).queryByText("Arama 2 Sonucu")).not.toBeInTheDocument();
    expect(within(getMappingRowByHeader(mappingSection, "Genel Açıklama")).getByText("Tam eşleşti")).toBeInTheDocument();
    expect(within(getMappingRowByHeader(mappingSection, "Telefon 10")).getByText("Tam eşleşti")).toBeInTheDocument();
    expect(within(getMappingRowByHeader(mappingSection, "Dış Excel Notu")).getByText("Elle eşleştirme gerekli")).toBeInTheDocument();

    await user.click(
      within(mappingSection).getByRole("button", { name: "3 içe aktarılmayacak kolon gizlendi · Göster" })
    );

    expect(within(getMappingRowByHeader(mappingSection, "Sıra No")).getByText("İçe Aktarılamaz")).toBeInTheDocument();
    expect(within(getMappingRowByHeader(mappingSection, "Telefon 1 Durumu")).getByText("İçe Aktarılamaz")).toBeInTheDocument();
  });

  it("shows friendly status labels instead of technical match scores", async () => {
    const worksheet = createWorksheet(
      ["Ad Soyad", "Sınıf", "Sınıf", "Tekrar Arancak mı", "Dış Excel Notu"],
      [["Ayşe Yılmaz", "11", "YKS", "Evet", "Harici not"]]
    );
    await uploadWorksheet(worksheet);

    const mappingSection = getSectionByHeading("Kolon Eşleştirme");

    expect(within(getMappingRowByHeader(mappingSection, "Ad Soyad")).getByText("Tam eşleşti")).toBeInTheDocument();
    expect(within(getMappingRowByHeader(mappingSection, "Tekrar Arancak mı")).getByText("Eşleşti")).toBeInTheDocument();

    const classRows = getMappingRowsByHeader(mappingSection, "Sınıf");

    expect(classRows).toHaveLength(2);
    expect(within(classRows[0]).getByText("Eşleşti")).toBeInTheDocument();
    expect(within(classRows[1]).getByText("Eşleşti")).toBeInTheDocument();

    expect(within(getMappingRowByHeader(mappingSection, "Dış Excel Notu")).getByText("Elle eşleştirme gerekli")).toBeInTheDocument();
    expect(within(mappingSection).queryByText(/matched \//)).not.toBeInTheDocument();
    expect(within(mappingSection).queryByText(/auto_fixed \//)).not.toBeInTheDocument();
    expect(within(mappingSection).queryByText(/mapping_required \//)).not.toBeInTheDocument();
  });

  it("disables duplicate CRM field choices across automatic and manual mappings", async () => {
    const worksheet = createWorksheet(
      ["Ad Soyad", "Aday Adı", "Telefon", "Cep 2"],
      [["Ayşe Yılmaz", "Mehmet Kaya", "0555 111 1111", "0555 222 2222"]]
    );
    const user = await uploadWorksheet(worksheet);

    const mappingSection = getSectionByHeading("Kolon Eşleştirme");
    const candidateNameSelect = getMappingSelect(mappingSection, "Aday Adı");
    const phoneSelect = getMappingSelect(mappingSection, "Telefon");
    const secondPhoneSelect = getMappingSelect(mappingSection, "Cep 2");

    expect(getMappingOption(candidateNameSelect, "Ad Soyad — başka kolonda seçildi")).toBeDisabled();
    expect(getMappingOption(secondPhoneSelect, "Telefon 1 — başka kolonda seçildi")).toBeDisabled();
    expect(getMappingOption(secondPhoneSelect, "Telefon 2")).not.toBeDisabled();

    await user.selectOptions(phoneSelect, "ignore");

    expect(getMappingOption(secondPhoneSelect, "Telefon 1")).not.toBeDisabled();
    expect(getMappingOption(secondPhoneSelect, "Telefon 2")).not.toBeDisabled();

    await user.selectOptions(secondPhoneSelect, "phone_2");

    expect(getMappingOption(phoneSelect, "Telefon 1")).not.toBeDisabled();
    expect(getMappingOption(phoneSelect, "Telefon 2 — başka kolonda seçildi")).toBeDisabled();
  });

  it("allows selecting the same file again after clearing the simulation", async () => {
    const worksheet = createWorksheet(
      ["Ad Soyad", "Telefon"],
      [["Ayşe Yılmaz", "0555 123 4567"]]
    );
    const user = await uploadWorksheet(worksheet);

    await user.click(screen.getByRole("button", { name: "Simülasyonu Temizle" }));

    expect(await screen.findByRole("heading", { name: "Henüz simülasyon yok" })).toBeInTheDocument();
    expect(getFileInput().value).toBe("");

    excelReaderMocks.parseFirstWorksheet.mockResolvedValueOnce(worksheet);
    await user.upload(getFileInput(), new File(["mock"], "test-import.xlsx"));

    expect(await screen.findByRole("heading", { name: "Kolon Eşleştirme" })).toBeInTheDocument();
    expect(excelReaderMocks.parseFirstWorksheet).toHaveBeenCalledTimes(2);
  });

  it("clears previous success state when a different file is selected after import", async () => {
    const firstWorksheet = createWorksheet(
      ["Ad Soyad", "Telefon"],
      [["Ayşe Yılmaz", "0555 123 4567"]]
    );
    const secondWorksheet = createWorksheet(
      ["Ad Soyad", "Telefon"],
      [["Mehmet Kaya", "0555 765 4321"]]
    );
    const user = await uploadWorksheet(firstWorksheet);

    await user.click(screen.getByRole("button", { name: "İçe Aktar" }));
    expect(await screen.findByRole("heading", { name: "İçe Aktarma Tamamlandı" })).toBeInTheDocument();

    excelReaderMocks.parseFirstWorksheet.mockResolvedValueOnce(secondWorksheet);
    await user.upload(getFileInput(), new File(["second"], "second-import.xlsx"));

    expect(await screen.findByRole("heading", { name: "Kolon Eşleştirme" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "İçe Aktarma Tamamlandı" })).not.toBeInTheDocument();
  });
});

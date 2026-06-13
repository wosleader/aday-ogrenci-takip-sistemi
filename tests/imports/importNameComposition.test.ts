import { describe, expect, it } from "vitest";

import { AppDatabase } from "../../src/db/db";
import { seedDatabase } from "../../src/db/seed";
import { matchColumns } from "../../src/features/imports/services/columnMatching";
import { simulateImport } from "../../src/features/imports/services/importSimulation";
import { writeImportToDatabase } from "../../src/features/imports/services/importWriter";
import type { ParsedWorksheet } from "../../src/features/imports/services/types";

function worksheet(headers: string[], rows: unknown[][]): ParsedWorksheet {
  return {
    file_name: "name-composition.xlsx",
    file_size: 1200,
    file_last_modified: 1710000000000,
    sheet_name: "Worksheet",
    ignored_sheet_names: [],
    raw_rows: [headers, ...rows],
    detected_header_row_number: 1,
    headers,
    rows,
    preview_rows: rows.slice(0, 20)
  };
}

async function createDatabase() {
  const database = new AppDatabase(`test-import-name-composition-${crypto.randomUUID()}`);
  await database.open();
  await seedDatabase(database);
  return database;
}

describe("AD/SOYAD import composition", () => {
  it("matches student AD/SOYAD columns without treating guardian or parent names as student name", () => {
    const { matches } = matchColumns([
      "AD",
      "SOYAD",
      "Öğrenci Adı",
      "Öğrenci Soyadı",
      "Veli Adı",
      "Anne adı",
      "Baba Adı"
    ]);

    expect(matches[0]).toMatchObject({ status: "matched", target_field: "student_first_name" });
    expect(matches[1]).toMatchObject({ status: "matched", target_field: "student_last_name" });
    expect(matches[2]).toMatchObject({ status: "matched", target_field: "student_first_name" });
    expect(matches[3]).toMatchObject({ status: "matched", target_field: "student_last_name" });
    expect(matches[4]).toMatchObject({ status: "mapping_required" });
    expect(matches[5]).toMatchObject({ status: "matched", target_field: "mother_full_name" });
    expect(matches[6]).toMatchObject({ status: "matched", target_field: "father_full_name" });
  });

  it("carries Anne and Baba names without using them as student name sources", () => {
    const summary = simulateImport(
      worksheet(
        ["AD", "SOYAD", "Anne Adı", "Baba Ad Soyad", "Telefon"],
        [["Ayşe", "Yılmaz", "Fatma Yılmaz", "Mehmet Yılmaz", "5321234567"]]
      )
    );

    expect(summary.readable_rows).toBe(1);
    expect(summary.preview_rows[0]).toMatchObject({
      student_full_name: "Ayşe Yılmaz",
      mother_full_name: "Fatma Yılmaz",
      father_full_name: "Mehmet Yılmaz"
    });
  });

  it("blocks rows that contain only Veli, Anne and Baba names", () => {
    const summary = simulateImport(
      worksheet(
        ["Veli Ad Soyad", "Anne Adı", "Baba Adı", "Telefon"],
        [["Ayşe Veli", "Fatma Yılmaz", "Mehmet Yılmaz", "5321234567"]]
      )
    );

    expect(summary.readable_rows).toBe(0);
    expect(summary.skipped_rows).toBe(1);
    expect(summary.preview_rows).toHaveLength(0);
    expect(summary.logs.some((log) => log.message.includes("Ad Soyad zorunlu alanı"))).toBe(true);
  });

  it("composes student full name from AD and SOYAD when full-name column is absent", () => {
    const summary = simulateImport(
      worksheet(["AD", "SOYAD", "Telefon"], [["Ayşe", "Yılmaz", "5321234567"]])
    );

    expect(summary.readable_rows).toBe(1);
    expect(
      summary.logs.some((log) => log.message.includes("Ad Soyad zorunlu alanı için eşleşen Excel kolonu bulunamadı"))
    ).toBe(false);
    expect(summary.preview_rows[0]).toMatchObject({
      student_first_name: "Ayşe",
      student_last_name: "Yılmaz",
      student_full_name: "Ayşe Yılmaz"
    });
  });

  it("keeps AD/SOYAD readable when another column is manually mapped", () => {
    const summary = simulateImport(
      worksheet(
        ["AD", "SOYAD", "Veli Adı", "Telefon", "Telefon 10", "Açıklama"],
        [
          ["Ayşe", "Yılmaz", "Ahmet Veli", "5321234567", "5320000010", "Not 1"],
          ["Mehmet", "Kaya", "Fatma Veli", "5321234568", "5320000011", "Not 2"],
          ["Zeynep", "Demir", "Ali Veli", "5321234569", "5320000012", "Not 3"]
        ]
      ),
      {
        manualMappings: {
          2: "guardian_full_name"
        }
      }
    );

    expect(summary.readable_rows).toBe(3);
    expect(summary.skipped_rows).toBe(0);
    expect(
      summary.logs.some((log) => log.message.includes("Ad Soyad zorunlu alanı için eşleşen Excel kolonu bulunamadı"))
    ).toBe(false);
    expect(summary.logs.some((log) => log.message.includes("Ad Soyad alanı boş"))).toBe(false);
    expect(summary.preview_rows.map((row) => row.student_full_name)).toEqual([
      "Ayşe Yılmaz",
      "Mehmet Kaya",
      "Zeynep Demir"
    ]);
    expect(summary.preview_rows[0].guardian_full_name).toBe("Ahmet Veli");
    expect(summary.preview_rows[0].general_note).toBe("Not 1");
    expect(summary.preview_rows[0].phones.map((phone) => phone.reference_label)).toEqual(["Telefon 1", "Telefon 10"]);
  });

  it("uses manually mapped first and last name columns as usable student name mapping", () => {
    const summary = simulateImport(
      worksheet(["İsim", "Soy isim", "Telefon"], [["Ayşe", "Yılmaz", "5321234567"]]),
      {
        manualMappings: {
          0: "student_first_name",
          1: "student_last_name"
        }
      }
    );

    expect(summary.readable_rows).toBe(1);
    expect(summary.preview_rows[0].student_full_name).toBe("Ayşe Yılmaz");
    expect(
      summary.logs.some((log) => log.message.includes("Ad Soyad zorunlu alanı için eşleşen Excel kolonu bulunamadı"))
    ).toBe(false);
  });

  it("keeps AD/SOYAD composition and Telefon 1-10 slot fidelity with Mahalle and Ilce present", () => {
    const summary = simulateImport(
      worksheet(
        ["AD", "SOYAD", "Mahalle", "İlçe", "Telefon", "Telefon 10"],
        [["Ayşe", "Yılmaz", "Atatürk", "Kadıköy", "5321234567", "5320000010"]]
      )
    );

    expect(summary.readable_rows).toBe(1);
    expect(summary.preview_rows[0]).toMatchObject({
      student_full_name: "Ayşe Yılmaz",
      neighborhood: "Atatürk",
      district: "Kadıköy"
    });
    expect(summary.preview_rows[0].phones.map((phone) => phone.reference_label)).toEqual(["Telefon 1", "Telefon 10"]);
  });

  it("keeps full-name field when full-name and AD/SOYAD columns are both present", () => {
    const summary = simulateImport(
      worksheet(
        ["Ad Soyad", "AD", "SOYAD", "Telefon"],
        [["Ayşe Nur Yılmaz", "Ayşe", "Yılmaz", "5321234567"]]
      )
    );

    expect(summary.readable_rows).toBe(1);
    expect(summary.preview_rows[0].student_full_name).toBe("Ayşe Nur Yılmaz");
    expect(
      summary.logs.some((log) =>
        log.message.includes("Tam ad alanı bulunduğu için Ad/Soyad alanları birleştirme için kullanılmadı")
      )
    ).toBe(true);
  });

  it("uses AD as student full name with warning when SOYAD is absent", () => {
    const summary = simulateImport(worksheet(["AD", "Telefon"], [["Ayşe", "5321234567"]]));

    expect(summary.readable_rows).toBe(1);
    expect(summary.preview_rows[0].student_full_name).toBe("Ayşe");
    expect(
      summary.logs.some((log) =>
        log.message.includes("Soyad alanı bulunamadı; öğrenci adı yalnızca Ad alanından oluşturuldu")
      )
    ).toBe(true);
  });

  it("blocks SOYAD-only rows because surname alone cannot create student full name", () => {
    const summary = simulateImport(worksheet(["SOYAD", "Telefon"], [["Yılmaz", "5321234567"]]));

    expect(summary.readable_rows).toBe(0);
    expect(summary.skipped_rows).toBe(1);
    expect(summary.missing_required_fields[0]).toMatchObject({
      field: "student_full_name"
    });
    expect(summary.missing_required_fields[0].message).toContain(
      "Soyad alanı tek başına öğrenci adı oluşturmak için yeterli değil"
    );
  });

  it("preserves existing missing-name behavior when no usable name fields exist", () => {
    const summary = simulateImport(worksheet(["Telefon"], [["5321234567"]]));

    expect(summary.readable_rows).toBe(0);
    expect(summary.missing_required_fields[0].message).toBe("Satır 2 içe aktarılmayacak: Ad Soyad alanı boş.");
  });

  it("persists composed student_full_name without changing the writer model", async () => {
    const database = await createDatabase();
    const parsedWorksheet = worksheet(
      ["AD", "SOYAD", "Telefon", "Telefon 10"],
      [["Ayşe", "Yılmaz", "5321234567", "5320000010"]]
    );

    try {
      const summary = simulateImport(parsedWorksheet);
      const result = await writeImportToDatabase(parsedWorksheet, summary, { database });
      const [student] = await database.students.toArray();
      const phones = (await database.phones.toArray()).sort(
        (left, right) => (left.priority ?? 0) - (right.priority ?? 0)
      );

      expect(result.created_students).toBe(1);
      expect(student.student_full_name).toBe("Ayşe Yılmaz");
      expect(student.normalized_student_name).toBe("ayse yilmaz");
      expect(phones.map((phone) => phone.reference_label)).toEqual(["Telefon 1", "Telefon 10"]);
    } finally {
      database.close();
      await database.delete();
    }
  });
});

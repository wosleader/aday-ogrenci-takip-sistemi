import { describe, expect, it } from "vitest";

import { BASE_EXPORT_HEADERS } from "../../src/features/exports/services/exportMapper";
import { COLUMN_DEFINITIONS } from "../../src/features/imports/services/columnDefinitions";
import { matchColumns, normalizeColumnHeader } from "../../src/features/imports/services/columnMatching";

describe("column matching", () => {
  it("normalizes case, Turkish characters and extra whitespace", () => {
    expect(normalizeColumnHeader("  AÇIKLAMA-2026  ")).toBe("aciklama 2026");
  });

  it("matches supported columns by normalized aliases", () => {
    const { matches } = matchColumns(["Ad Soyad", "Veli Ad Soyad", "2. Telefon"]);

    expect(matches[0].target_field).toBe("student_full_name");
    expect(matches[1].target_field).toBe("guardian_full_name");
    expect(matches[2].target_field).toBe("phone_2");
  });

  it("auto-fixes known misspelled headers and logs them", () => {
    const { matches, logs } = matchColumns(["Tekrar arancak mı?"]);

    expect(matches[0].status).toBe("auto_fixed");
    expect(matches[0].target_field).toBe("should_call_again");
    expect(logs[0].auto_fixed).toBe(true);
    expect(logs[0].message).toContain("Kolon A (1): 'Tekrar arancak mı?'");
  });

  it("marks unknown columns as mapping required", () => {
    const { matches } = matchColumns(["Bilinmeyen Kolon"]);

    expect(matches[0].status).toBe("mapping_required");
  });

  it("ignores blank headers with clear column metadata", () => {
    const { matches, logs } = matchColumns([""]);

    expect(matches[0].status).toBe("ignored");
    expect(logs[0].message).toBe("Kolon A: başlık boş olduğu için yok sayıldı.");
  });

  it("uses manual mappings when provided", () => {
    const { matches } = matchColumns(["Bilinmeyen Kolon"], { 0: "student_full_name" });

    expect(matches[0].status).toBe("manual");
    expect(matches[0].target_field).toBe("student_full_name");
  });

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
    expect(matches[5]).toMatchObject({ status: "mapping_required" });
    expect(matches[6]).toMatchObject({ status: "mapping_required" });
  });

  it("maps duplicate Sınıf columns to current class and student group", () => {
    const { matches } = matchColumns(["Sınıf", "Sınıf"]);

    expect(matches[0].target_field).toBe("current_class");
    expect(matches[1].target_field).toBe("student_group");
  });

  it("includes Telefon 3-10 as import mapping definitions", () => {
    const phoneFields = COLUMN_DEFINITIONS.filter((definition) => definition.field.startsWith("phone_")).map(
      (definition) => definition.field
    );

    expect(phoneFields).toEqual([
      "phone_1",
      "phone_2",
      "phone_3",
      "phone_4",
      "phone_5",
      "phone_6",
      "phone_7",
      "phone_8",
      "phone_9",
      "phone_10"
    ]);
  });

  it("matches multi-phone GSM and Telefon aliases", () => {
    const { matches } = matchColumns(["GSM3", "GSM 4", "Telefon 10"]);

    expect(matches[0].target_field).toBe("phone_3");
    expect(matches[1].target_field).toBe("phone_4");
    expect(matches[2].target_field).toBe("phone_10");
  });

  it("matches Genel Açıklama as the real Açıklama import field", () => {
    const { matches } = matchColumns(["Genel Açıklama"]);

    expect(matches[0]).toMatchObject({
      status: "matched",
      target_field: "general_note"
    });
  });

  it("recognizes detailed export headers while keeping importable columns matched", () => {
    const { matches } = matchColumns([...BASE_EXPORT_HEADERS]);
    const byHeader = new Map(matches.map((match) => [match.source_header, match]));

    expect(byHeader.get("Öğrenci Ad Soyad")).toMatchObject({ status: "matched", target_field: "student_full_name" });
    expect(byHeader.get("Veli Ad Soyad")).toMatchObject({ status: "matched", target_field: "guardian_full_name" });
    expect(byHeader.get("Telefon 1")).toMatchObject({ status: "matched", target_field: "phone_1" });
    expect(byHeader.get("Telefon 10")).toMatchObject({ status: "matched", target_field: "phone_10" });
    expect(byHeader.get("Sınıf")).toMatchObject({ status: "matched", target_field: "current_class" });
    expect(byHeader.get("Öğrenci Grubu")).toMatchObject({ status: "matched", target_field: "student_group" });
    expect(byHeader.get("Kampanya")).toMatchObject({ status: "matched", target_field: "campaign_name" });
    expect(byHeader.get("Genel Açıklama")).toMatchObject({ status: "matched", target_field: "general_note" });
    expect(byHeader.get("Tekrar Aranacak mı?")).toMatchObject({ status: "matched", target_field: "should_call_again" });
    expect(byHeader.get("Tekrar Arama Tarihi")).toMatchObject({ status: "matched", target_field: "reminder_date" });

    for (const header of [
      "Sıra No",
      "Telefon 1 Durumu",
      "Telefon 10 Durumu",
      "Kategori",
      "Son Arama Sonucu",
      "Son Görüşülen Telefon",
      "Son Görüşme Tarihi",
      "Tekrar Arama Saati",
      "Randevu Durumu",
      "Randevu Tarihi",
      "Kayıt Durumu",
      "Mükerrer Telefon Uyarısı",
      "Kaynak Excel Satırı",
      "Oluşturulma Tarihi",
      "Güncellenme Tarihi"
    ]) {
      expect(byHeader.get(header)).toMatchObject({
        status: "ignored",
        note: "Sistem bilgisi — şu an içe aktarılmaz"
      });
    }
  });

  it("recognizes dynamic call history export columns without ignoring unknown columns", () => {
    const { matches } = matchColumns([
      "Arama 1 Tarihi",
      "Arama 1 Sonucu",
      "Arama 1 Telefon",
      "Arama 1 Açıklaması",
      "Arama 1 Tekrar Arama Tarihi",
      "Arama 3 Tarihi",
      "Dış Excel Notu"
    ]);

    expect(matches.slice(0, 6).map((match) => match.status)).toEqual([
      "ignored",
      "ignored",
      "ignored",
      "ignored",
      "ignored",
      "ignored"
    ]);
    expect(matches.slice(0, 6).every((match) => match.note === "Sistem bilgisi — şu an içe aktarılmaz")).toBe(true);
    expect(matches[6]).toMatchObject({
      source_header: "Dış Excel Notu",
      status: "mapping_required"
    });
  });
});

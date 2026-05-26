import { describe, expect, it } from "vitest";
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
});

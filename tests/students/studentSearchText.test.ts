import { describe, expect, it } from "vitest";
import { createStudentSearchText } from "../../src/features/students/services/studentSearchText";
import { createSearchText } from "../../src/utils/normalizeText";

describe("createStudentSearchText", () => {
  it("preserves the established import search field order and Turkish normalization", () => {
    const result = createStudentSearchText({
      student_full_name: "  Ayşe Yılmaz  ",
      guardian_names: ["Veli Demir", " Fatma Şahin ", "Mehmet Öztürk"],
      phone_values: ["05321112233", "05322223344"],
      current_class: " 8. Sınıf ",
      student_group: " 8. Sınıf LGS Hazırlık ",
      district: " Kadıköy ",
      neighborhood: " Fenerbahçe "
    });

    expect(result).toBe(
      "ayse yilmaz veli demir fatma sahin mehmet ozturk 05321112233 05322223344 8 sinif 8 sinif lgs hazirlik kadikoy fenerbahce"
    );
    expect(result).toBe(
      createSearchText([
        "  Ayşe Yılmaz  ",
        "Veli Demir",
        " Fatma Şahin ",
        "Mehmet Öztürk",
        "05321112233",
        "05322223344",
        " 8. Sınıf ",
        " 8. Sınıf LGS Hazırlık ",
        " Kadıköy ",
        " Fenerbahçe "
      ])
    );
  });

  it("safely omits empty values and an unspecified student group", () => {
    const result = createStudentSearchText({
      student_full_name: "  Ayşe   Yılmaz ",
      guardian_names: [null, undefined, ""],
      phone_values: [null, undefined, ""],
      current_class: null,
      student_group: "",
      district: null,
      neighborhood: ""
    });

    expect(result).toBe("ayse yilmaz");
    expect(result).not.toContain("11 sinif yks hazirlik");
  });

  it("does not accept arbitrary non-canonical tokens", () => {
    const result = createStudentSearchText({
      student_full_name: "Ayşe Yılmaz",
      guardian_names: ["Veli Yılmaz"],
      phone_values: ["05321112233"],
      current_class: "8",
      student_group: "LGS Hazırlık",
      district: "Kadıköy",
      neighborhood: "Fenerbahçe"
    });

    expect(result).not.toContain("kampanya");
    expect(result).not.toContain("oncelik");
    expect(result).not.toContain("aday notu");
  });
});

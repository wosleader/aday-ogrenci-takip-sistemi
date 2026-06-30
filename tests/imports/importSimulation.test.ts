import { describe, expect, it } from "vitest";
import { BASE_EXPORT_HEADERS } from "../../src/features/exports/services/exportMapper";
import { simulateImport } from "../../src/features/imports/services/importSimulation";
import type { ParsedWorksheet } from "../../src/features/imports/services/types";

function worksheet(headers: string[], rows: unknown[][]): ParsedWorksheet {
  return {
    file_name: "test.xlsx",
    sheet_name: "Worksheet",
    ignored_sheet_names: [],
    raw_rows: [headers, ...rows],
    detected_header_row_number: 1,
    headers,
    rows,
    preview_rows: rows.slice(0, 20)
  };
}

describe("simulateImport", () => {
  it("assigns default campaign when campaign column is missing", () => {
    const summary = simulateImport(
      worksheet(["Ad Soyad", "Telefon"], [["Ayşe Yılmaz", "5321234567"]])
    );

    expect(summary.default_campaign_assigned_count).toBe(1);
    expect(summary.preview_rows[0].campaign_name).toBe("Diğer");
    expect(summary.logs.some((log) => log.message.includes("Kampanya Tanımı kolonu bulunamadı"))).toBe(
      true
    );
  });

  it("simulates reminder default time assignment without writing records", () => {
    const summary = simulateImport(
      worksheet(
        ["Ad Soyad", "Telefon", "Tekrar arancak mı?", "Tekrar Aranacak Tarih"],
        [["Ayşe Yılmaz", "5321234567", "Evet", "2026-05-12"]]
      )
    );

    expect(summary.default_time_assigned_count).toBe(1);
    expect(summary.preview_rows[0].reminder_at).toBe("2026-05-12T11:00:00");
    expect(summary.auto_matched_columns[0].target_field).toBe("should_call_again");
  });

  it("does not warn when phone 1 and phone 2 are same in the same row", () => {
    const summary = simulateImport(
      worksheet(
        ["Ad Soyad", "Telefon", "2. Telefon"],
        [["Ayşe Yılmaz", "05321234567", "5321234567"]]
      )
    );

    expect(summary.duplicate_phone_warnings).toHaveLength(0);
  });

  it("warns when the same phone belongs to different students in different rows", () => {
    const summary = simulateImport(
      worksheet(
        ["Ad Soyad", "Telefon"],
        [
          ["Ayşe Yılmaz", "05321234567"],
          ["Mehmet Kaya", "+90 532 123 45 67"]
        ]
      )
    );

    expect(summary.duplicate_phone_warnings).toHaveLength(1);
    expect(summary.duplicate_phone_warnings[0].phone_number).toBe("05321234567");
    expect(summary.duplicate_phone_warnings[0].row_numbers).toEqual([2, 3]);
  });

  it("groups missing required fields and keeps row details separate", () => {
    const summary = simulateImport(
      worksheet(["Ad Soyad", "Telefon"], [["", "05321234567"], ["", "05327654321"]])
    );

    expect(summary.skipped_rows).toBe(2);
    expect(summary.readable_rows).toBe(0);
    expect(summary.missing_required_fields[0].field).toBe("student_full_name");
    expect(summary.logs.some((log) => log.message === "2 satır içe aktarılmayacak: zorunlu alan bilgisi eksik.")).toBe(
      true
    );
    expect(summary.detailed_logs).toHaveLength(2);
    expect(summary.detailed_logs[0].message).toBe("Satır 2 içe aktarılmayacak: Ad Soyad alanı boş.");
  });

  it("allows manual column mappings during simulation", () => {
    const summary = simulateImport(worksheet(["İsim"], [["Ayşe Yılmaz"]]), {
      allowNoPhoneCandidates: true,
      manualMappings: { 0: "student_full_name" }
    });

    expect(summary.readable_rows).toBe(1);
    expect(summary.preview_rows[0].student_full_name).toBe("Ayşe Yılmaz");
  });

  it("blocks no-phone candidates by default and allows them only when enabled", () => {
    const parsedWorksheet = worksheet(["Ad Soyad", "Telefon"], [["Arda Güneş", ""]]);
    const blockedSummary = simulateImport(parsedWorksheet);
    const allowedSummary = simulateImport(parsedWorksheet, { allowNoPhoneCandidates: true });

    expect(blockedSummary.allow_no_phone_candidates).toBe(false);
    expect(blockedSummary.readable_rows).toBe(0);
    expect(blockedSummary.skipped_rows).toBe(1);
    expect(blockedSummary.no_usable_phone_count).toBe(1);
    expect(blockedSummary.simulated_rows).toHaveLength(0);
    expect(
      blockedSummary.detailed_logs.some((log) =>
        log.message.includes("geçerli telefon numarası bulunamadı")
      )
    ).toBe(true);

    expect(allowedSummary.allow_no_phone_candidates).toBe(true);
    expect(allowedSummary.readable_rows).toBe(1);
    expect(allowedSummary.skipped_rows).toBe(0);
    expect(allowedSummary.simulated_rows[0]).toMatchObject({
      student_full_name: "Arda Güneş",
      phones: []
    });
  });

  it("blocks invalid-only phone input in both no-phone modes", () => {
    const parsedWorksheet = worksheet(["Ad Soyad", "Telefon"], [["Arda Güneş", "12345"]]);

    for (const allowNoPhoneCandidates of [false, true]) {
      const summary = simulateImport(parsedWorksheet, { allowNoPhoneCandidates });

      expect(summary.readable_rows).toBe(0);
      expect(summary.skipped_rows).toBe(1);
      expect(summary.no_usable_phone_count).toBe(1);
      expect(summary.simulated_rows).toHaveLength(0);
      expect(
        summary.detailed_logs.some((log) =>
          log.message.includes("telefon bilgisi var ancak geçerli formatta değil")
        )
      ).toBe(true);
    }
  });

  it("accepts valid parent and alternate-slot phones while no-phone import is disabled", () => {
    const parentPhoneSummary = simulateImport(
      worksheet(["Ad Soyad", "ANNE TEL"], [["Ayşe Yılmaz", "5320000001"]])
    );
    const alternatePhoneSummary = simulateImport(
      worksheet(
        ["Ad Soyad", "Telefon", "2. Telefon", "Telefon 10"],
        [["Mehmet Kaya", "", "", "5320000010"]]
      )
    );

    expect(parentPhoneSummary.readable_rows).toBe(1);
    expect(parentPhoneSummary.preview_rows[0].phones[0]).toMatchObject({
      relation_label: "Anne",
      is_valid: true
    });
    expect(alternatePhoneSummary.readable_rows).toBe(1);
    expect(alternatePhoneSummary.preview_rows[0].phones[0]).toMatchObject({
      reference_label: "Telefon 10",
      priority: 10,
      is_valid: true
    });
  });

  it("keeps Mahalle and Ilce optional while carrying values into preview rows", () => {
    const summary = simulateImport(
      worksheet(
        ["AD", "SOYAD", "Mahalle", "İlçe", "Telefon"],
        [
          ["Ayşe", "Yılmaz", "Atatürk", "Kadıköy", "5321234567"],
          ["Mehmet", "Kaya", "", "", "5327654321"]
        ]
      )
    );

    expect(summary.readable_rows).toBe(2);
    expect(summary.skipped_rows).toBe(0);
    expect(summary.preview_rows[0]).toMatchObject({
      student_full_name: "Ayşe Yılmaz",
      neighborhood: "Atatürk",
      district: "Kadıköy"
    });
    expect(summary.preview_rows[1]).toMatchObject({
      student_full_name: "Mehmet Kaya"
    });
    expect(summary.preview_rows[1].neighborhood).toBeUndefined();
    expect(summary.preview_rows[1].district).toBeUndefined();
  });

  it("separates missing primary phone from fully missing phone records", () => {
    const summary = simulateImport(
      worksheet(
        ["Ad Soyad", "Telefon", "2. Telefon"],
        [
          ["Ayşe Yılmaz", "", "5321234567"],
          ["Mehmet Kaya", "", ""]
        ]
      )
    );

    expect(summary.empty_phone_count).toBe(2);
    expect(summary.phone1_empty_with_alternative_count).toBe(1);
    expect(summary.both_phones_empty_count).toBe(1);
    expect(
      summary.logs.some((log) =>
        log.message.includes("Telefon 1 boş, ancak alternatif telefon bulunduğu için kayıtlar içe aktarılabilir")
      )
    ).toBe(true);
    expect(
      summary.logs.some((log) =>
        log.message.includes("Telefon 1 ve Telefon 2 boş. Bu kayıtlar kontrol edilmeli")
      )
    ).toBe(true);
  });

  it("uses a user-friendly duplicate phone message with student names", () => {
    const summary = simulateImport(
      worksheet(
        ["Ad Soyad", "Telefon"],
        [
          ["Ayşe Yılmaz", "05321234567"],
          ["Mehmet Kaya", "+90 532 123 45 67"]
        ]
      )
    );

    expect(
      summary.logs.some((log) =>
        log.message.includes("Mükerrer telefon uyarısı: 05321234567 numarası 2 farklı öğrencide geçiyor")
      )
    ).toBe(true);
    expect(summary.logs.some((log) => log.message.includes("Öğrenciler: Ayşe Yılmaz, Mehmet Kaya"))).toBe(
      true
    );
  });
  it("creates multi-phone simulation rows while keeping phone 1 and phone 2 compatibility", () => {
    const summary = simulateImport(
      worksheet(
        ["Ad Soyad", "Telefon", "2. Telefon", "GSM3", "GSM 4", "Telefon 5"],
        [["AyÅŸe YÄ±lmaz", "05320000001", "5320000002", "5320000003", "5320000004", "5320000005"]]
      )
    );

    expect(summary.preview_rows[0].phone_1).toBe("05320000001");
    expect(summary.preview_rows[0].phone_2).toBe("05320000002");
    expect(summary.preview_rows[0].phones).toHaveLength(5);
    expect(summary.preview_rows[0].phones.map((phone) => phone.reference_label)).toEqual([
      "Telefon 1",
      "Telefon 2",
      "Telefon 3",
      "Telefon 4",
      "Telefon 5"
    ]);
    expect(summary.preview_rows[0].phones.map((phone) => phone.normalized_phone_number)).toEqual([
      "05320000001",
      "05320000002",
      "05320000003",
      "05320000004",
      "05320000005"
    ]);
  });

  it("carries explicit parent phones with relation labels and allocates slots in Excel order", () => {
    const summary = simulateImport(
      worksheet(
        ["AD", "SOYAD", "GSM", "VELİ TEL", "BABA TEL", "GSM2", "GSM3", "ANNE TEL", "GSM4"],
        [
          [
            "Ayse",
            "Yilmaz",
            "5320000001",
            "5320000002",
            "5320000003",
            "5320000004",
            "5320000005",
            "5320000006",
            "5320000007"
          ]
        ]
      )
    );

    expect(summary.readable_rows).toBe(1);
    expect(summary.preview_rows[0].phone_1).toBe("05320000001");
    expect(summary.preview_rows[0].phone_2).toBe("05320000002");
    expect(summary.preview_rows[0].phones).toEqual([
      expect.objectContaining({
        source_field: "phone_1",
        reference_label: "Telefon 1",
        relation_label: null,
        source_column: "GSM",
        priority: 1
      }),
      expect.objectContaining({
        source_field: "guardian_phone",
        reference_label: "Telefon 2",
        relation_label: "Veli",
        source_column: "VELİ TEL",
        priority: 2
      }),
      expect.objectContaining({
        source_field: "father_phone",
        reference_label: "Telefon 3",
        relation_label: "Baba",
        source_column: "BABA TEL",
        priority: 3
      }),
      expect.objectContaining({ source_field: "phone_2", reference_label: "Telefon 4", priority: 4 }),
      expect.objectContaining({ source_field: "phone_3", reference_label: "Telefon 5", priority: 5 }),
      expect.objectContaining({
        source_field: "mother_phone",
        reference_label: "Telefon 6",
        relation_label: "Anne",
        source_column: "ANNE TEL",
        priority: 6
      }),
      expect.objectContaining({ source_field: "phone_4", reference_label: "Telefon 7", priority: 7 })
    ]);
  });

  it("keeps explicit parent phones safe when parent names are absent", () => {
    const summary = simulateImport(
      worksheet(
        ["AD", "SOYAD", "VELİ TEL", "ANNE TEL", "BABA TEL"],
        [["Ayse", "Yilmaz", "5320000001", "5320000002", "5320000003"]]
      )
    );

    expect(summary.readable_rows).toBe(1);
    expect(summary.preview_rows[0].student_full_name).toBe("Ayse Yilmaz");
    expect(summary.preview_rows[0].phones).toEqual([
      expect.objectContaining({ relation_label: "Veli", reference_label: "Telefon 1" }),
      expect.objectContaining({ relation_label: "Anne", reference_label: "Telefon 2" }),
      expect.objectContaining({ relation_label: "Baba", reference_label: "Telefon 3" })
    ]);
  });

  it("treats explicit Veli phone as usable phone without forcing a special slot", () => {
    const summary = simulateImport(
      worksheet(["AD", "SOYAD", "VELİ TELEFON"], [["Ayse", "Yilmaz", "5320000001"]])
    );

    expect(summary.readable_rows).toBe(1);
    expect(summary.no_usable_phone_count).toBe(0);
    expect(summary.preview_rows[0].phones).toEqual([
      expect.objectContaining({
        source_field: "guardian_phone",
        reference_label: "Telefon 1",
        relation_label: "Veli",
        source_column: "VELİ TELEFON",
        priority: 1
      })
    ]);
  });

  it("skips empty phone cells and de-duplicates phones within the same row", () => {
    const summary = simulateImport(
      worksheet(
        ["Ad Soyad", "Telefon", "2. Telefon", "GSM3", "GSM4"],
        [["AyÅŸe YÄ±lmaz", "05321234567", "", "+90 532 123 45 67", "5320000004"]]
      )
    );

    expect(summary.preview_rows[0].phones).toHaveLength(2);
    expect(summary.preview_rows[0].phones.map((phone) => phone.normalized_phone_number)).toEqual([
      "05321234567",
      "05320000004"
    ]);
    expect(summary.duplicate_phone_warnings).toHaveLength(0);
  });

  it("keeps invalid non-empty phone values in simulation with validity metadata", () => {
    const summary = simulateImport(
      worksheet(["Ad Soyad", "Telefon", "GSM3"], [["AyÅŸe YÄ±lmaz", "5321234567", "12345"]])
    );

    expect(summary.preview_rows[0].phones).toHaveLength(2);
    expect(summary.preview_rows[0].phones[1]).toMatchObject({
      reference_label: "Telefon 3",
      normalized_phone_number: "12345",
      is_valid: false
    });
  });

  it("detects duplicate phones across all simulated phone fields", () => {
    const summary = simulateImport(
      worksheet(
        ["Ad Soyad", "Telefon", "GSM3"],
        [
          ["AyÅŸe YÄ±lmaz", "05320000001", "5321234567"],
          ["Mehmet Kaya", "05320000002", "+90 532 123 45 67"]
        ]
      )
    );

    expect(summary.duplicate_phone_warnings).toHaveLength(1);
    expect(summary.duplicate_phone_warnings[0].phone_number).toBe("05321234567");
    expect(summary.duplicate_phone_warnings[0].row_numbers).toEqual([2, 3]);
  });

  it("detects duplicate Veli phones across simulated rows", () => {
    const summary = simulateImport(
      worksheet(
        ["Ad Soyad", "VELİ TEL"],
        [
          ["Ayse Yilmaz", "5321234567"],
          ["Mehmet Kaya", "+90 532 123 45 67"]
        ]
      )
    );

    expect(summary.duplicate_phone_warnings).toHaveLength(1);
    expect(summary.duplicate_phone_warnings[0]).toMatchObject({
      phone_number: "05321234567",
      row_numbers: [2, 3],
      student_names: ["Ayse Yilmaz", "Mehmet Kaya"]
    });
  });

  it("imports real detailed export fields while excluding system info columns from mapping requirements", () => {
    const headers = [
      ...BASE_EXPORT_HEADERS,
      "Arama 1 Tarihi",
      "Arama 1 Sonucu",
      "Arama 1 Telefon",
      "Arama 1 Açıklaması",
      "Arama 1 Tekrar Arama Tarihi",
      "Arama 2 Tarihi",
      "Dış Excel Notu"
    ];
    const row = headers.map((header) => {
      const values: Record<string, string> = {
        "Öğrenci Ad Soyad": "Ayşe Yılmaz",
        "Veli Ad Soyad": "Ahmet Veli",
        "Telefon 1": "0555 111 1111",
        "Telefon 3": "0555 333 3333",
        "Sınıf": "11",
        "Öğrenci Grubu": "YKS",
        Kampanya: "Pilot",
        "Genel Açıklama": "Export notu",
        "Tekrar Aranacak mı?": "Evet",
        "Tekrar Arama Tarihi": "2026-06-01"
      };

      return values[header] ?? "";
    });
    const summary = simulateImport(worksheet(headers, [row]));

    expect(summary.readable_rows).toBe(1);
    expect(summary.preview_rows[0]).toMatchObject({
      student_full_name: "Ayşe Yılmaz",
      guardian_full_name: "Ahmet Veli",
      campaign_name: "Pilot",
      general_note: "Export notu"
    });
    expect(summary.preview_rows[0].phones.map((phone) => phone.reference_label)).toContain("Telefon 3");
    expect(summary.mapping_required_columns.map((match) => match.source_header)).toEqual(["Dış Excel Notu"]);
    expect(summary.logs.some((log) => log.message.includes("Telefon 1 Durumu eşleştirilemedi"))).toBe(false);
    expect(summary.logs.some((log) => log.message.includes("Arama 1 Tarihi eşleştirilemedi"))).toBe(false);
  });
});

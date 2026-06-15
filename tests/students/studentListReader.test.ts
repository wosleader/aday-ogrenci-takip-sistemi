import { describe, expect, it } from "vitest";
import { AppDatabase } from "../../src/db/db";
import type { CallLogRecord } from "../../src/domain/models/callLog";
import type { GuardianRecord } from "../../src/domain/models/guardian";
import type { PhoneRecord } from "../../src/domain/models/phone";
import type { ReminderRecord } from "../../src/domain/models/reminder";
import type { StudentRecord } from "../../src/domain/models/student";
import {
  ALL_STUDENT_GROUPS_FILTER,
  UNSPECIFIED_STUDENT_GROUP_FILTER,
  createStudentListNoteSummary,
  createStudentGroupFilterOptions,
  filterRowsByStudentGroup,
  filterStudentListRows,
  getStudentGroupFilterKey,
  normalizeClassSectionLabel,
  readStudentListRows
} from "../../src/features/students/services/studentListReader";
import { createSearchText, normalizeText } from "../../src/utils/normalizeText";

const baseTime = "2026-05-08T09:00:00.000Z";

async function createDatabase() {
  const database = new AppDatabase(`test-student-list-${crypto.randomUUID()}`);
  await database.open();
  return database;
}

function student(overrides: Partial<StudentRecord> = {}): StudentRecord {
  const fullName = overrides.student_full_name ?? "Ayse Yilmaz";

  return {
    uuid: crypto.randomUUID(),
    student_full_name: fullName,
    normalized_student_name: normalizeText(fullName),
    search_text: createSearchText([fullName, overrides.general_note]),
    current_class: "11",
    student_group: "11. Sinif YKS",
    category: "YKS",
    campaign_id: null,
    lifecycle_status: "candidate",
    last_call_result: "not_called",
    source_file_name: "test.xlsx",
    source_sheet_name: "Worksheet",
    source_row_number: 2,
    general_note: null,
    sync_status: "local",
    created_at: baseTime,
    updated_at: baseTime,
    deleted_at: null,
    ...overrides
  };
}

function guardian(studentId: number, overrides: Partial<GuardianRecord> = {}): GuardianRecord {
  const fullName = overrides.guardian_full_name ?? "Veli Yilmaz";

  return {
    uuid: crypto.randomUUID(),
    student_id: studentId,
    guardian_full_name: fullName,
    normalized_guardian_name: normalizeText(fullName),
    relation_type: null,
    note: null,
    sync_status: "local",
    created_at: baseTime,
    updated_at: baseTime,
    deleted_at: null,
    ...overrides
  };
}

function phone(studentId: number, overrides: Partial<PhoneRecord> = {}): PhoneRecord {
  const phoneNumber = overrides.phone_number ?? "05321234567";

  return {
    uuid: crypto.randomUUID(),
    student_id: studentId,
    guardian_id: null,
    phone_number: phoneNumber,
    normalized_phone_number: overrides.normalized_phone_number ?? phoneNumber,
    original_phone_value: phoneNumber,
    phone_label: "Telefon 1",
    is_valid: true,
    is_wrong: false,
    is_primary: true,
    note: null,
    sync_status: "local",
    created_at: baseTime,
    updated_at: baseTime,
    deleted_at: null,
    ...overrides
  };
}

function reminder(studentId: number, overrides: Partial<ReminderRecord> = {}): ReminderRecord {
  return {
    uuid: crypto.randomUUID(),
    student_id: studentId,
    reminder_type: "call",
    reminder_at: "2026-05-12T11:00:00",
    status: "pending",
    note: null,
    is_default_time_assigned: true,
    sync_status: "local",
    created_at: baseTime,
    updated_at: baseTime,
    deleted_at: null,
    ...overrides
  };
}

function callLog(studentId: number, overrides: Partial<CallLogRecord> = {}): CallLogRecord {
  return {
    uuid: crypto.randomUUID(),
    student_id: studentId,
    guardian_id: null,
    phone_id: null,
    contacted_phone_id: null,
    contacted_phone_number: null,
    contacted_phone_label: null,
    call_time: baseTime,
    call_result: "reached",
    note: null,
    reminder_at: null,
    next_action: null,
    created_by: null,
    created_reminder_id: null,
    created_appointment_id: null,
    sync_status: "local",
    created_at: baseTime,
    updated_at: baseTime,
    deleted_at: null,
    ...overrides
  };
}

describe("studentListReader", () => {
  it("carries optional Mahalle and Ilce fields into student list rows", async () => {
    const database = await createDatabase();

    try {
      await database.students.add(
        student({
          student_full_name: "Ayse Yilmaz",
          neighborhood: "Ataturk",
          district: "Kadikoy"
        })
      );

      const [row] = await readStudentListRows(database);

      expect(row.neighborhood).toBe("Ataturk");
      expect(row.district).toBe("Kadikoy");
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("separates legacy Veli, Anne and Baba guardian records", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      await database.guardians.bulkAdd([
        guardian(studentId, { guardian_full_name: "Zeynep Yilmaz", relation_type: null }),
        guardian(studentId, { guardian_full_name: "Fatma Yilmaz", relation_type: "mother" }),
        guardian(studentId, { guardian_full_name: "Mehmet Yilmaz", relation_type: "father" })
      ]);

      const [row] = await readStudentListRows(database);

      expect(row).toMatchObject({
        guardian_full_name: "Zeynep Yilmaz",
        mother_full_name: "Fatma Yilmaz",
        father_full_name: "Mehmet Yilmaz"
      });
      expect(filterStudentListRows([row], "Fatma Yilmaz")).toHaveLength(1);
      expect(filterStudentListRows([row], "Mehmet Yilmaz")).toHaveLength(1);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("normalizes common combined class and section labels", () => {
    expect(normalizeClassSectionLabel("9A")).toBe("9-A");
    expect(normalizeClassSectionLabel("9-A")).toBe("9-A");
    expect(normalizeClassSectionLabel("9/A")).toBe("9-A");
    expect(normalizeClassSectionLabel("9 A")).toBe("9-A");
    expect(normalizeClassSectionLabel("9. Sinif A")).toBe("9-A");
    expect(normalizeClassSectionLabel("9 sinif A")).toBe("9-A");
    expect(normalizeClassSectionLabel("11. Sinif YKS Hazirlik")).toBe("11. Sınıf YKS Hazirlik");
    expect(normalizeClassSectionLabel("8. Sinif LGS")).toBe("8. Sınıf LGS");
    expect(normalizeClassSectionLabel("9")).toBe("9. Sınıf");
    expect(normalizeClassSectionLabel("11")).toBe("11. Sınıf");
  });

  it("uses separate section/group value over a combined class value", () => {
    expect(normalizeClassSectionLabel("9", "A")).toBe("9-A");
    expect(normalizeClassSectionLabel("11", "YKS Hazirlik")).toBe("11. Sınıf YKS Hazirlik");
    expect(normalizeClassSectionLabel("9-A", "B")).toBe("9-B");
  });

  it("treats invalid numeric-only class/section values as unspecified", () => {
    expect(normalizeClassSectionLabel("0")).toBeNull();
    expect(normalizeClassSectionLabel("22")).toBeNull();
    expect(normalizeClassSectionLabel(null, "44")).toBeNull();
  });

  it("combines students, guardians and phones into list rows", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      await database.guardians.add(guardian(studentId));
      await database.phones.bulkAdd([
        phone(studentId, { phone_number: "05321234567", normalized_phone_number: "05321234567", phone_label: "Telefon 1" }),
        phone(studentId, {
          phone_number: "05327654321",
          normalized_phone_number: "05327654321",
          phone_label: "Telefon 2",
          is_primary: false
        })
      ]);

      const rows = await readStudentListRows(database);

      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        student_id: studentId,
        student_full_name: "Ayse Yilmaz",
        guardian_full_name: "Veli Yilmaz",
        phone_1: "05321234567",
        phone_2: "05327654321",
        phone_1_status: "active",
        phone_2_status: "active",
        phone_count: 2,
        has_missing_phone: false
      });
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("exposes multi-phone read model fields for right card preview", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      await database.phones.bulkAdd([
        phone(studentId, {
          phone_number: "05320000001",
          normalized_phone_number: "05320000001",
          phone_label: "Telefon 1",
          reference_label: "Telefon 1",
          priority: 1,
          source_column: "Telefon 1"
        }),
        phone(studentId, {
          phone_number: "05320000002",
          normalized_phone_number: "05320000002",
          phone_label: "Anne Telefon",
          reference_label: "Telefon 2",
          relation_label: "Anne",
          priority: 2,
          is_primary: false,
          source_column: "Anne Telefon"
        }),
        phone(studentId, {
          phone_number: "05320000003",
          normalized_phone_number: "05320000003",
          phone_label: "Öğrenci Telefon",
          reference_label: "Telefon 3",
          relation_label: "Öğrenci",
          priority: 3,
          is_primary: false,
          phone_status: "contacted",
          call_outcome: "no_answer",
          call_outcome_updated_at: "2026-05-08T10:00:00.000Z",
          source_column: "Öğrenci Telefon"
        }),
        phone(studentId, {
          phone_number: "05320000004",
          normalized_phone_number: "05320000004",
          phone_label: "Veli Telefon",
          reference_label: "Telefon 4",
          relation_label: "Veli",
          priority: 4,
          is_primary: false,
          is_valid: false,
          is_wrong: true,
          phone_status: "invalid",
          source_column: "Veli Telefon"
        }),
        phone(studentId, {
          phone_number: "05320000005",
          normalized_phone_number: "05320000005",
          phone_label: "Yakın Telefon",
          reference_label: "Telefon 5",
          relation_label: "Yakın",
          priority: 5,
          is_primary: false,
          source_column: "Yakın Telefon"
        })
      ]);

      const [row] = await readStudentListRows(database);

      expect(row.phone_1).toBe("05320000001");
      expect(row.phone_2).toBe("05320000002");
      expect(row.phone_count).toBe(5);
      expect(row.phones).toHaveLength(5);
      expect(row.visible_phones.map((item) => item.display_label)).toEqual([
        "Telefon 1",
        "Telefon 2 · Anne",
        "Telefon 3 · Öğrenci"
      ]);
      expect(row.hidden_phone_count).toBe(2);
      expect(row.phones[2]).toMatchObject({
        phone_number: "05320000003",
        normalized_phone_number: "05320000003",
        reference_label: "Telefon 3",
        relation_label: "Öğrenci",
        display_label: "Telefon 3 · Öğrenci",
        source_column: "Öğrenci Telefon",
        phone_status: "contacted",
        call_outcome: "no_answer",
        call_outcome_updated_at: "2026-05-08T10:00:00.000Z",
        is_primary: false,
        is_wrong: false,
        is_valid: true
      });
      expect(row.phones[0]).toEqual(
        expect.objectContaining({
          phone_number: "05320000001",
          call_outcome: null,
          call_outcome_updated_at: null
        })
      );
      expect(row.phones[3]).toMatchObject({
        phone_number: "05320000004",
        display_label: "Telefon 4 · Veli",
        phone_status: "invalid",
        is_wrong: true,
        is_valid: false
      });
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("keeps phone 2 as phone 2 when phone 1 is empty", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      await database.phones.add(
        phone(studentId, {
          phone_number: "05327654321",
          normalized_phone_number: "05327654321",
          phone_label: "Telefon 2",
          is_primary: true
        })
      );

      const rows = await readStudentListRows(database);

      expect(rows[0].phone_1).toBeNull();
      expect(rows[0].phone_2).toBe("05327654321");
      expect(rows[0].has_missing_phone).toBe(false);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it.each([
    { slot: 3, phoneNumber: "05320000003" },
    { slot: 10, phoneNumber: "05320000010" }
  ])("preserves Telefon $slot metadata while keeping the compatibility action target", async ({ slot, phoneNumber }) => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      await database.phones.add(
        phone(studentId, {
          phone_number: phoneNumber,
          normalized_phone_number: phoneNumber,
          phone_label: `Telefon ${slot}`,
          reference_label: `Telefon ${slot}`,
          priority: slot,
          source_column: `TELEFON ${slot}`,
          is_primary: true
        })
      );

      const [row] = await readStudentListRows(database);

      expect(row.phone_1).toBe(phoneNumber);
      expect(row.phone_1_id).toBe(row.phones[0].id);
      expect(row.phones).toHaveLength(1);
      expect(row.phones[0]).toMatchObject({
        phone_number: phoneNumber,
        reference_label: `Telefon ${slot}`,
        display_label: `Telefon ${slot}`,
        source_column: `TELEFON ${slot}`
      });
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("marks rows without any phone as missing phone", async () => {
    const database = await createDatabase();

    try {
      await database.students.add(student());

      const rows = await readStudentListRows(database);

      expect(rows[0].phone_count).toBe(0);
      expect(rows[0].has_missing_phone).toBe(true);
      expect(rows[0].phones).toEqual([]);
      expect(rows[0].visible_phones).toEqual([]);
      expect(rows[0].hidden_phone_count).toBe(0);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("uses only pending reminders for repeat call indicators", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      await database.reminders.bulkAdd([
        reminder(studentId, { reminder_at: "2026-05-15T11:00:00", status: "completed" }),
        reminder(studentId, { reminder_at: "2026-05-11T11:00:00", status: "pending" })
      ]);

      const rows = await readStudentListRows(database);

      expect(rows[0].has_reminder).toBe(true);
      expect(rows[0].next_reminder_at).toBe("2026-05-11T11:00:00");
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("filters by student, guardian, phone and note text", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(
        student({
          student_full_name: "Mehmet Kaya",
          general_note: "Burs bilgisi soruldu",
          search_text: createSearchText(["Mehmet Kaya", "Burs bilgisi soruldu"])
        })
      );
      await database.guardians.add(guardian(studentId, { guardian_full_name: "Fatma Kaya" }));
      await database.phones.add(phone(studentId, { phone_number: "05329998877", normalized_phone_number: "05329998877" }));

      const rows = await readStudentListRows(database);

      expect(filterStudentListRows(rows, "mehmet")).toHaveLength(1);
      expect(filterStudentListRows(rows, "fatma")).toHaveLength(1);
      expect(filterStudentListRows(rows, "998877")).toHaveLength(1);
      expect(filterStudentListRows(rows, "burs")).toHaveLength(1);
      expect(filterStudentListRows(rows, "olmayan")).toHaveLength(0);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("creates readable list note summaries without raw counters", async () => {
    const database = await createDatabase();

    try {
      const noNoteId = await database.students.add(student({ student_full_name: "Not Yok" }));
      const generalOnlyId = await database.students.add(
        student({
          student_full_name: "Genel Notlu",
          general_note: "Excel genel açıklaması",
          created_at: "2026-05-08T09:01:00.000Z",
          updated_at: "2026-05-08T09:01:00.000Z"
        })
      );
      const oneCallNoteId = await database.students.add(
        student({
          student_full_name: "Tek Görüşme Notu",
          created_at: "2026-05-08T09:02:00.000Z",
          updated_at: "2026-05-08T09:02:00.000Z"
        })
      );
      const threeCallNotesId = await database.students.add(
        student({
          student_full_name: "Üç Görüşme Notu",
          created_at: "2026-05-08T09:03:00.000Z",
          updated_at: "2026-05-08T09:03:00.000Z"
        })
      );
      const generalPlusId = await database.students.add(
        student({
          student_full_name: "Genel ve Görüşme",
          general_note: "Excel notu",
          created_at: "2026-05-08T09:04:00.000Z",
          updated_at: "2026-05-08T09:04:00.000Z"
        })
      );

      await database.call_logs.bulkAdd([
        callLog(oneCallNoteId, { note: "Tek not", call_time: "2026-05-08T10:00:00.000Z" }),
        callLog(threeCallNotesId, { note: "Birinci not", call_time: "2026-05-08T10:00:00.000Z" }),
        callLog(threeCallNotesId, { note: "İkinci not", call_time: "2026-05-08T11:00:00.000Z" }),
        callLog(threeCallNotesId, { note: "Üçüncü not", call_time: "2026-05-08T12:00:00.000Z" }),
        callLog(threeCallNotesId, { note: "   ", call_time: "2026-05-08T13:00:00.000Z" }),
        callLog(generalPlusId, { note: "İlk görüşme", call_time: "2026-05-08T10:00:00.000Z" }),
        callLog(generalPlusId, { note: "İkinci görüşme", call_time: "2026-05-08T11:00:00.000Z" })
      ]);

      const rows = await readStudentListRows(database);
      const byId = new Map(rows.map((row) => [row.student_id, row]));

      expect(createStudentListNoteSummary(byId.get(noNoteId)!).text).toBe("Not yok");
      expect(createStudentListNoteSummary(byId.get(noNoteId)!).is_empty).toBe(true);
      expect(createStudentListNoteSummary(byId.get(generalOnlyId)!).text).toBe("Genel not var");
      expect(createStudentListNoteSummary(byId.get(oneCallNoteId)!).text).toBe("1 not");
      expect(createStudentListNoteSummary(byId.get(threeCallNotesId)!).text).toBe("3 not");
      expect(createStudentListNoteSummary(byId.get(generalPlusId)!).text).toBe("Genel + 2 not");
      expect(byId.get(threeCallNotesId)?.call_note_count).toBe(3);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("uses the latest non-empty call note in note-focused list summaries", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student({ student_full_name: "Son Notlu" }));
      await database.call_logs.bulkAdd([
        callLog(studentId, { note: "Eski dolu not", call_time: "2026-05-08T10:00:00.000Z" }),
        callLog(studentId, { note: "Veli bilgi istedi, tekrar aranacak", call_time: "2026-05-08T11:00:00.000Z" }),
        callLog(studentId, { note: "  ", call_time: "2026-05-08T12:00:00.000Z" })
      ]);

      const rows = await readStudentListRows(database);
      const row = rows.find((item) => item.student_id === studentId)!;
      const noteSummary = createStudentListNoteSummary(row, "has_note");

      expect(row.call_note_count).toBe(2);
      expect(row.latest_call_note).toBe("Veli bilgi istedi, tekrar aranacak");
      expect(row.latest_call_note_at).toBe("2026-05-08T11:00:00.000Z");
      expect(noteSummary.text).toBe("Veli bilgi istedi, tekrar aranacak");
      expect(noteSummary.suffix).toBe("2 not");
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("falls back to general note in note-focused summaries when there is no call note", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(
        student({
          student_full_name: "Genel Özeti",
          general_note: "Excel'den gelen genel not"
        })
      );

      const rows = await readStudentListRows(database);
      const row = rows.find((item) => item.student_id === studentId)!;

      expect(createStudentListNoteSummary(row, "has_note").text).toBe("Excel'den gelen genel not");
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("includes call log notes in the has_note filter", async () => {
    const database = await createDatabase();

    try {
      const callNoteStudentId = await database.students.add(student({ student_full_name: "Görüşme Notlu" }));
      await database.students.add(
        student({
          student_full_name: "Notsuz",
          created_at: "2026-05-08T09:01:00.000Z",
          updated_at: "2026-05-08T09:01:00.000Z"
        })
      );
      await database.call_logs.add(callLog(callNoteStudentId, { note: "Sadece görüşme notu var" }));

      const rows = await readStudentListRows(database);
      const filteredRows = filterStudentListRows(rows, "", "has_note");

      expect(filteredRows).toHaveLength(1);
      expect(filteredRows[0].student_full_name).toBe("Görüşme Notlu");
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("marks the same phone on different students as duplicate", async () => {
    const database = await createDatabase();

    try {
      const firstStudentId = await database.students.add(student({ student_full_name: "Ayse Yilmaz" }));
      const secondStudentId = await database.students.add(
        student({
          student_full_name: "Mehmet Kaya",
          created_at: "2026-05-08T09:01:00.000Z",
          updated_at: "2026-05-08T09:01:00.000Z"
        })
      );
      await database.phones.bulkAdd([
        phone(firstStudentId, { normalized_phone_number: "05321234567" }),
        phone(firstStudentId, {
          phone_number: "05321234567",
          normalized_phone_number: "05321234567",
          phone_label: "Telefon 2",
          is_primary: false
        }),
        phone(secondStudentId, { normalized_phone_number: "05321234567" })
      ]);

      const rows = await readStudentListRows(database);

      expect(rows.find((row) => row.student_id === firstStudentId)?.has_duplicate_phone).toBe(true);
      expect(rows.find((row) => row.student_id === secondStudentId)?.has_duplicate_phone).toBe(true);
      expect(rows.find((row) => row.student_id === firstStudentId)?.duplicate_group_key).toBe("05321234567");
      expect(rows.find((row) => row.student_id === secondStudentId)?.duplicate_group_key).toBe("05321234567");
      expect(filterStudentListRows(rows, "", "duplicate_phone")).toHaveLength(2);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("carries contacted and invalid phone indicators to list rows", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      await database.phones.bulkAdd([
        phone(studentId, {
          phone_number: "05321234567",
          normalized_phone_number: "05321234567",
          phone_label: "Telefon 1",
          phone_status: "contacted"
        }),
        phone(studentId, {
          phone_number: "05327654321",
          normalized_phone_number: "05327654321",
          phone_label: "Telefon 2",
          phone_status: "invalid",
          is_primary: false,
          is_wrong: true
        })
      ]);

      const rows = await readStudentListRows(database);

      expect(rows[0].phone_1_is_contacted).toBe(true);
      expect(rows[0].phone_1_is_wrong).toBe(false);
      expect(rows[0].phone_2_is_contacted).toBe(false);
      expect(rows[0].phone_2_is_wrong).toBe(true);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("creates class/section filter options from current rows without duplicates", async () => {
    const database = await createDatabase();

    try {
      await database.students.bulkAdd([
        student({ student_full_name: "Ayse Yilmaz", current_class: "11", student_group: "YKS Hazirlik" }),
        student({
          student_full_name: "Mehmet Kaya",
          current_class: "11",
          student_group: "  YKS Hazirlik  ",
          created_at: "2026-05-08T09:01:00.000Z"
        }),
        student({
          student_full_name: "Zeynep Demir",
          current_class: "12",
          student_group: "YKS Hazirlik",
          created_at: "2026-05-08T09:02:00.000Z"
        }),
        student({
          student_full_name: "Bos Grup",
          current_class: null,
          student_group: "   ",
          created_at: "2026-05-08T09:03:00.000Z"
        }),
        student({
          student_full_name: "Kod Grup",
          current_class: null,
          student_group: "44",
          created_at: "2026-05-08T09:04:00.000Z"
        }),
        student({
          student_full_name: "LGS Aday",
          current_class: "8. Sinif LGS",
          student_group: "",
          created_at: "2026-05-08T09:05:00.000Z"
        })
      ]);

      const rows = await readStudentListRows(database);
      const options = createStudentGroupFilterOptions(rows);

      expect(options[0]).toEqual({ value: ALL_STUDENT_GROUPS_FILTER, label: "Tüm Sınıf / Şubeler", group: "all" });
      expect(options).toContainEqual({ value: "class:8", label: "8. Sınıf", group: "class_level" });
      expect(options).toContainEqual({ value: "class:11", label: "11. Sınıf", group: "class_level" });
      expect(options).toContainEqual({ value: "class:12", label: "12. Sınıf", group: "class_level" });
      expect(options).toContainEqual({
        value: getStudentGroupFilterKey("11", "YKS Hazirlik"),
        label: "11. Sınıf YKS Hazirlik",
        group: "section"
      });
      expect(options).toContainEqual({
        value: getStudentGroupFilterKey("12", "YKS Hazirlik"),
        label: "12. Sınıf YKS Hazirlik",
        group: "section"
      });
      expect(options).toContainEqual({ value: getStudentGroupFilterKey("8. Sinif LGS"), label: "8. Sınıf LGS", group: "section" });
      expect(options).toContainEqual({ value: UNSPECIFIED_STUDENT_GROUP_FILTER, label: "Belirtilmemiş", group: "unspecified" });
      expect(options).not.toContainEqual({ value: "44", label: "44" });
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("keeps all rows when all student groups are selected", async () => {
    const database = await createDatabase();

    try {
      await database.students.bulkAdd([
        student({ student_full_name: "Ayse Yilmaz", student_group: "11. Sinif YKS" }),
        student({
          student_full_name: "Mehmet Kaya",
          student_group: "12. Sinif YKS",
          created_at: "2026-05-08T09:01:00.000Z"
        })
      ]);

      const rows = await readStudentListRows(database);

      expect(filterRowsByStudentGroup(rows, ALL_STUDENT_GROUPS_FILTER)).toHaveLength(2);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("filters all sections under a selected class level", async () => {
    const database = await createDatabase();

    try {
      await database.students.bulkAdd([
        student({ student_full_name: "On A", current_class: "10", student_group: "A" }),
        student({
          student_full_name: "On B",
          current_class: "10-B",
          student_group: "",
          created_at: "2026-05-08T09:01:00.000Z"
        }),
        student({
          student_full_name: "On C",
          current_class: "10/C",
          student_group: "",
          created_at: "2026-05-08T09:02:00.000Z"
        }),
        student({
          student_full_name: "On Bir YKS",
          current_class: "11. Sinif YKS Hazirlik",
          student_group: "",
          created_at: "2026-05-08T09:03:00.000Z"
        })
      ]);

      const rows = await readStudentListRows(database);
      const tenthGradeRows = filterRowsByStudentGroup(rows, "class:10");

      expect(tenthGradeRows.map((row) => row.student_full_name).sort()).toEqual(["On A", "On B", "On C"]);
      expect(filterRowsByStudentGroup(rows, getStudentGroupFilterKey("10", "A")).map((row) => row.student_full_name)).toEqual([
        "On A"
      ]);
      expect(filterRowsByStudentGroup(rows, "class:11").map((row) => row.student_full_name)).toEqual(["On Bir YKS"]);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("filters rows by selected class/section", async () => {
    const database = await createDatabase();

    try {
      await database.students.bulkAdd([
        student({ student_full_name: "Ayse Yilmaz", current_class: "11", student_group: "YKS Hazirlik" }),
        student({
          student_full_name: "Mehmet Kaya",
          current_class: "12",
          student_group: "YKS Hazirlik",
          created_at: "2026-05-08T09:01:00.000Z"
        })
      ]);

      const rows = await readStudentListRows(database);
      const filteredRows = filterRowsByStudentGroup(rows, getStudentGroupFilterKey("11", "YKS Hazirlik"));

      expect(filteredRows).toHaveLength(1);
      expect(filteredRows[0].student_full_name).toBe("Ayse Yilmaz");
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("filters blank student groups as unspecified", async () => {
    const database = await createDatabase();

    try {
      await database.students.bulkAdd([
        student({ student_full_name: "Ayse Yilmaz", current_class: "11", student_group: "YKS Hazirlik" }),
        student({
          student_full_name: "Bos Grup",
          current_class: null,
          student_group: "   ",
          created_at: "2026-05-08T09:01:00.000Z"
        }),
        student({
          student_full_name: "Numeric Grup",
          current_class: null,
          student_group: "44",
          created_at: "2026-05-08T09:02:00.000Z"
        }),
        student({
          student_full_name: "LGS Aday",
          current_class: "8. Sinif LGS",
          student_group: "",
          created_at: "2026-05-08T09:03:00.000Z"
        })
      ]);

      const rows = await readStudentListRows(database);
      const filteredRows = filterRowsByStudentGroup(rows, UNSPECIFIED_STUDENT_GROUP_FILTER);

      expect(filteredRows.map((row) => row.student_full_name).sort()).toEqual(["Bos Grup", "Numeric Grup"]);
      expect(filterRowsByStudentGroup(rows, getStudentGroupFilterKey("8. Sinif LGS"))).toHaveLength(1);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("combines student group filtering with search and status filters", async () => {
    const database = await createDatabase();

    try {
      await database.students.bulkAdd([
        student({
          student_full_name: "Ahmet Yilmaz",
          search_text: createSearchText(["Ahmet Yilmaz"]),
          current_class: "11",
          student_group: "YKS Hazirlik",
          last_call_result: "not_called"
        }),
        student({
          student_full_name: "Ahmet Demir",
          search_text: createSearchText(["Ahmet Demir"]),
          current_class: "12",
          student_group: "YKS Hazirlik",
          last_call_result: "not_called",
          created_at: "2026-05-08T09:01:00.000Z"
        }),
        student({
          student_full_name: "Zeynep Yilmaz",
          search_text: createSearchText(["Zeynep Yilmaz"]),
          current_class: "11",
          student_group: "YKS Hazirlik",
          last_call_result: "reached",
          created_at: "2026-05-08T09:02:00.000Z"
        })
      ]);

      const rows = await readStudentListRows(database);
      const bySearchAndStatus = filterStudentListRows(rows, "ahmet", "not_called");
      const byGroup = filterRowsByStudentGroup(bySearchAndStatus, getStudentGroupFilterKey("11", "YKS Hazirlik"));

      expect(byGroup).toHaveLength(1);
      expect(byGroup[0].student_full_name).toBe("Ahmet Yilmaz");
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("keeps existing list filters working before student group filtering", async () => {
    const database = await createDatabase();

    try {
      const firstStudentId = await database.students.add(
        student({
          student_full_name: "Notlu Aday",
          current_class: "11",
          student_group: "YKS Hazirlik",
          general_note: "Gorusme notu"
        })
      );
      const secondStudentId = await database.students.add(
        student({
          student_full_name: "Telefonsuz Aday",
          current_class: "11",
          student_group: "YKS Hazirlik",
          created_at: "2026-05-08T09:01:00.000Z"
        })
      );
      await database.phones.add(phone(firstStudentId));
      await database.reminders.add(reminder(secondStudentId));

      const rows = await readStudentListRows(database);
      const groupFilter = getStudentGroupFilterKey("11", "YKS Hazirlik");

      expect(filterRowsByStudentGroup(filterStudentListRows(rows, "", "has_note"), groupFilter)).toHaveLength(1);
      expect(filterRowsByStudentGroup(filterStudentListRows(rows, "", "missing_phone"), groupFilter)).toHaveLength(1);
      expect(filterRowsByStudentGroup(filterStudentListRows(rows, "", "has_reminder"), groupFilter)).toHaveLength(1);
    } finally {
      database.close();
      await database.delete();
    }
  });
});

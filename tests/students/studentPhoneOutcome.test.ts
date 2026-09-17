import { describe, expect, it, vi } from "vitest";
import { AppDatabase } from "../../src/db/db";
import type { PhoneRecord } from "../../src/domain/models/phone";
import type { StudentRecord } from "../../src/domain/models/student";
import { updatePhoneOutcome } from "../../src/features/students/services/studentPhoneOutcome";
import { createSearchText, normalizeText } from "../../src/utils/normalizeText";

const timestamp = "2026-05-08T09:00:00.000Z";
async function createDatabase() {
  const database = new AppDatabase(`test-phone-outcome-${crypto.randomUUID()}`);
  await database.open();
  return database;
}

function student(name = "Ayse Yilmaz"): StudentRecord {
  return {
    uuid: crypto.randomUUID(),
    student_full_name: name,
    normalized_student_name: normalizeText(name),
    search_text: createSearchText([name]),
    current_class: "11",
    student_group: "11. Sinif YKS",
    category: "YKS",
    campaign_id: null,
    lifecycle_status: "candidate",
    last_call_result: "not_called",
    general_note: null,
    sync_status: "local",
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null
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
    reference_label: "Telefon 1",
    relation_label: "Telefon",
    priority: 1,
    phone_status: "active",
    is_valid: true,
    is_wrong: false,
    is_primary: true,
    note: null,
    sync_status: "local",
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    ...overrides
  };
}

describe("studentPhoneOutcome", () => {
  it("marks an operational phone as contacted when its outcome is reached", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const phoneId = await database.phones.add(phone(studentId));

      await updatePhoneOutcome(phoneId, "reached", database);

      expect(await database.phones.get(phoneId)).toMatchObject({
        call_outcome: "reached",
        call_outcome_updated_at: expect.any(String),
        phone_status: "contacted",
        invalid_reason: null,
        invalidated_at: null,
        is_wrong: false
      });
      const audits = await database.audit_logs.toArray();
      expect(audits).toHaveLength(2);
      expect(audits).toContainEqual(expect.objectContaining({ entity_type: "phone_attempt", entity_id: phoneId }));
      expect(JSON.parse(audits.find((audit) => audit.entity_type === "phone_attempt")?.new_value ?? "{}")).toMatchObject({
        event_version: 1,
        student_id: studentId,
        outcome: "reached",
        campaign_id_at_attempt: null,
        contact_established: true
      });
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("moves contacted status without rewriting the previous phone outcome", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const firstPhoneId = await database.phones.add(
        phone(studentId, {
          phone_status: "contacted",
          call_outcome: "reached",
          call_outcome_updated_at: "2026-05-08T10:00:00.000Z"
        })
      );
      const secondPhoneId = await database.phones.add(
        phone(studentId, {
          phone_number: "05327654321",
          normalized_phone_number: "05327654321",
          phone_label: "Telefon 2",
          reference_label: "Telefon 2",
          priority: 2,
          is_primary: false
        })
      );

      await updatePhoneOutcome(secondPhoneId, "reached", database);

      expect(await database.phones.get(firstPhoneId)).toMatchObject({
        phone_status: "active",
        call_outcome: "reached",
        call_outcome_updated_at: "2026-05-08T10:00:00.000Z"
      });
      expect(await database.phones.get(secondPhoneId)).toMatchObject({
        phone_status: "contacted",
        call_outcome: "reached"
      });
      expect(await database.audit_logs.count()).toBe(3);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("updates only the selected phone outcome without changing phone action fields or student summary", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const firstPhoneId = await database.phones.add(phone(studentId));
      const secondPhoneId = await database.phones.add(
        phone(studentId, {
          phone_number: "05327654321",
          normalized_phone_number: "05327654321",
          phone_label: "Telefon 2",
          reference_label: "Telefon 2",
          priority: 2,
          is_primary: false,
          phone_status: "invalid",
          is_wrong: true,
          is_valid: false
        })
      );

      const result = await updatePhoneOutcome(firstPhoneId, "no_answer", database);
      const updatedFirstPhone = await database.phones.get(firstPhoneId);
      const untouchedSecondPhone = await database.phones.get(secondPhoneId);
      const unchangedStudent = await database.students.get(studentId);

      expect(result).toMatchObject({
        phone_id: firstPhoneId,
        student_id: studentId,
        call_outcome: "no_answer",
        call_outcome_updated_at: expect.any(String)
      });
      expect(updatedFirstPhone).toMatchObject({
        call_outcome: "no_answer",
        call_outcome_updated_at: expect.any(String),
        phone_status: "active",
        is_wrong: false,
        is_valid: true
      });
      expect(updatedFirstPhone?.invalid_reason).toBeUndefined();
      expect(updatedFirstPhone?.invalidated_at).toBeUndefined();
      expect(updatedFirstPhone?.updated_at).toBe(timestamp);
      expect(untouchedSecondPhone).toMatchObject({
        phone_status: "invalid",
        is_wrong: true,
        is_valid: false
      });
      expect(untouchedSecondPhone?.call_outcome).toBeUndefined();
      expect(untouchedSecondPhone?.call_outcome_updated_at).toBeUndefined();
      expect(unchangedStudent?.last_call_result).toBe("not_called");
      expect(unchangedStudent?.last_contacted_at).toBeUndefined();
      expect(unchangedStudent?.last_contacted_phone_id).toBeUndefined();
      expect(await database.audit_logs.count()).toBe(1);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("stores manual Aranmadı reset separately from legacy fallback", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const phoneId = await database.phones.add(
        phone(studentId, {
          call_outcome: "reached",
          call_outcome_updated_at: "2026-05-08T10:00:00.000Z"
        })
      );

      await updatePhoneOutcome(phoneId, "not_called", database);
      const updatedPhone = await database.phones.get(phoneId);

      expect(updatedPhone?.call_outcome).toBe("not_called");
      expect(updatedPhone?.call_outcome_updated_at).toBeTruthy();
      expect(updatedPhone?.call_outcome_updated_at).not.toBe("2026-05-08T10:00:00.000Z");
      expect(await database.audit_logs.count()).toBe(0);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("atomically records wrong number as an invalid operational state without rewriting call history", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const phoneId = await database.phones.add(phone(studentId));
      const callLogId = await database.call_logs.add({
        uuid: crypto.randomUUID(),
        student_id: studentId,
        phone_id: phoneId,
        contacted_phone_id: phoneId,
        contacted_phone_number: "05321234567",
        call_time: timestamp,
        call_result: "reached",
        sync_status: "local",
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null
      });
      const historicalCallLog = await database.call_logs.get(callLogId);

      await updatePhoneOutcome(phoneId, "wrong_number", database);

      const updatedPhone = await database.phones.get(phoneId);
      expect(updatedPhone).toMatchObject({
        call_outcome: "wrong_number",
        call_outcome_updated_at: expect.any(String),
        phone_status: "invalid",
        invalid_reason: "wrong_number",
        invalidated_at: expect.any(String),
        is_wrong: true,
        is_valid: true
      });
      expect(await database.call_logs.get(callLogId)).toEqual(historicalCallLog);

      const audits = await database.audit_logs.toArray();
      const audit = audits.find((entry) => entry.field_name === "operational_status")!;
      expect(audit).toBeDefined();
      expect(audit).toMatchObject({ entity_type: "phone", entity_id: phoneId, field_name: "operational_status" });
      expect(JSON.parse(audit.new_value ?? "{}")).toMatchObject({
        phone_status: "invalid",
        invalid_reason: "wrong_number",
        is_wrong: true
      });
      expect(audits).toContainEqual(expect.objectContaining({ entity_type: "phone_attempt", entity_id: phoneId }));
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("atomically records not in use without setting the wrong-number compatibility flag", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const phoneId = await database.phones.add(phone(studentId));

      await updatePhoneOutcome(phoneId, "unused", database);

      expect(await database.phones.get(phoneId)).toMatchObject({
        call_outcome: "unused",
        phone_status: "invalid",
        invalid_reason: "not_in_use",
        invalidated_at: expect.any(String),
        is_wrong: false,
        is_valid: true
      });
      expect(await database.audit_logs.count()).toBe(2);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("keeps an existing invalid reason when a temporary outcome is selected", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const phoneId = await database.phones.add(
        phone(studentId, {
          phone_status: "invalid",
          invalid_reason: "manual",
          invalidated_at: "2026-05-08T08:30:00.000Z",
          is_wrong: false
        })
      );

      await updatePhoneOutcome(phoneId, "busy", database);

      expect(await database.phones.get(phoneId)).toMatchObject({
        call_outcome: "busy",
        phone_status: "invalid",
        invalid_reason: "manual",
        invalidated_at: "2026-05-08T08:30:00.000Z",
        is_wrong: false
      });
      expect(await database.audit_logs.count()).toBe(1);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("does not auto-contact a manually invalid phone when reached is selected", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const phoneId = await database.phones.add(
        phone(studentId, {
          phone_status: "invalid",
          invalid_reason: "manual",
          invalidated_at: "2026-05-08T08:30:00.000Z",
          is_wrong: false
        })
      );

      await updatePhoneOutcome(phoneId, "reached", database);

      expect(await database.phones.get(phoneId)).toMatchObject({
        call_outcome: "reached",
        phone_status: "invalid",
        invalid_reason: "manual",
        invalidated_at: "2026-05-08T08:30:00.000Z",
        is_wrong: false
      });
      expect(await database.audit_logs.count()).toBe(1);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it.each([
    ["wrong_number", "no_answer", "wrong_number", true],
    ["unused", "reached", "not_in_use", false]
  ] as const)(
    "re-enables an outcome-invalid phone when %s changes to %s",
    async (initialOutcome, nextOutcome, invalidReason, isWrong) => {
      const database = await createDatabase();

      try {
        const studentId = await database.students.add(student());
        const phoneId = await database.phones.add(
          phone(studentId, {
            phone_status: "invalid",
            invalid_reason: invalidReason,
            invalidated_at: "2026-05-08T08:30:00.000Z",
            is_wrong: isWrong,
            call_outcome: initialOutcome,
            call_outcome_updated_at: "2026-05-08T08:30:00.000Z"
          })
        );

        await updatePhoneOutcome(phoneId, nextOutcome, database);

        expect(await database.phones.get(phoneId)).toMatchObject({
          call_outcome: nextOutcome,
          call_outcome_updated_at: expect.any(String),
          phone_status: nextOutcome === "reached" ? "contacted" : "active",
          invalid_reason: null,
          invalidated_at: null,
          is_wrong: false
        });
        const audit = (await database.audit_logs.toArray()).find((entry) => entry.field_name === "operational_status")!;
        expect(audit).toBeDefined();
        expect(audit).toMatchObject({ entity_type: "phone", entity_id: phoneId, field_name: "operational_status" });
        expect(JSON.parse(audit.old_value ?? "{}")).toMatchObject({
          phone_status: "invalid",
          invalid_reason: invalidReason,
          is_wrong: isWrong
        });
        expect(JSON.parse(audit.new_value ?? "{}")).toMatchObject({
          phone_status: nextOutcome === "reached" ? "contacted" : "active",
          invalid_reason: null,
          invalidated_at: null,
          is_wrong: false
        });
      } finally {
        database.close();
        await database.delete();
      }
    }
  );

  it("does not share outcome between duplicate normalized phones on different candidates", async () => {
    const database = await createDatabase();

    try {
      const firstStudentId = await database.students.add(student("Ayse Yilmaz"));
      const secondStudentId = await database.students.add(student("Elif Yilmaz"));
      const firstPhoneId = await database.phones.add(phone(firstStudentId));
      const secondPhoneId = await database.phones.add(phone(secondStudentId));

      await updatePhoneOutcome(firstPhoneId, "busy", database);
      const firstPhone = await database.phones.get(firstPhoneId);
      const secondPhone = await database.phones.get(secondPhoneId);

      expect(firstPhone?.normalized_phone_number).toBe(secondPhone?.normalized_phone_number);
      expect(firstPhone?.call_outcome).toBe("busy");
      expect(secondPhone?.call_outcome).toBeUndefined();
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("snapshots the current campaign on the attempt without storing personal data", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const phoneId = await database.phones.add(phone(studentId));
      await database.students.update(studentId, { campaign_id: 42 });

      await updatePhoneOutcome(phoneId, "no_answer", database);
      await database.students.update(studentId, { campaign_id: 99 });

      const event = (await database.audit_logs.toArray()).find((audit) => audit.entity_type === "phone_attempt");
      expect(event).toBeDefined();
      expect(JSON.parse(event?.new_value ?? "{}")).toEqual({
        event_version: 1,
        student_id: studentId,
        outcome: "no_answer",
        campaign_id_at_attempt: 42,
        contact_established: false
      });
      expect(event?.new_value).not.toContain("05321234567");
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("rolls back the phone outcome when the attempt event cannot be appended", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const phoneId = await database.phones.add(phone(studentId));
      const auditAdd = vi.spyOn(database.audit_logs, "add").mockRejectedValueOnce(new Error("event write failed"));

      await expect(updatePhoneOutcome(phoneId, "no_answer", database)).rejects.toThrow("event write failed");
      expect(await database.phones.get(phoneId)).not.toMatchObject({ call_outcome: "no_answer" });
      expect(await database.audit_logs.count()).toBe(0);
      auditAdd.mockRestore();
    } finally {
      database.close();
      await database.delete();
    }
  });
});

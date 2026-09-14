import { describe, expect, it, vi } from "vitest";
import { AppDatabase } from "../../src/db/db";
import type { PhoneRecord } from "../../src/domain/models/phone";
import type { StudentRecord } from "../../src/domain/models/student";
import { markPhoneAsContacted, markPhoneAsInvalid } from "../../src/features/students/services/studentPhoneStatus";
import { createSearchText, normalizeText } from "../../src/utils/normalizeText";

const timestamp = "2026-05-08T09:00:00.000Z";

async function createDatabase() {
  const database = new AppDatabase(`test-phone-status-${crypto.randomUUID()}`);
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

describe("studentPhoneStatus", () => {
  it("marks a phone as contacted", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const phoneId = await database.phones.add(phone(studentId));

      const result = await markPhoneAsContacted(phoneId, database);
      const updatedPhone = await database.phones.get(phoneId);

      expect(result.phone_status).toBe("contacted");
      expect(updatedPhone?.phone_status).toBe("contacted");
      expect(updatedPhone?.is_wrong).toBe(false);
      expect(await database.audit_logs.count()).toBe(1);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("removes contacted status when the same phone is selected again", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const phoneId = await database.phones.add(phone(studentId, { phone_status: "contacted" }));

      const result = await markPhoneAsContacted(phoneId, database);
      const updatedPhone = await database.phones.get(phoneId);

      expect(result.phone_status).toBe("active");
      expect(updatedPhone?.phone_status).toBe("active");
      expect(await database.audit_logs.count()).toBe(1);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("keeps only one contacted phone for the same student", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const firstPhoneId = await database.phones.add(phone(studentId, { phone_status: "contacted" }));
      const secondPhoneId = await database.phones.add(
        phone(studentId, {
          phone_number: "05327654321",
          normalized_phone_number: "05327654321",
          phone_label: "Telefon 2",
          phone_status: "active",
          is_primary: false
        })
      );

      await markPhoneAsContacted(secondPhoneId, database);

      expect((await database.phones.get(firstPhoneId))?.phone_status).toBe("active");
      expect((await database.phones.get(secondPhoneId))?.phone_status).toBe("contacted");
      expect(await database.audit_logs.count()).toBe(2);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("manually disables a phone with an explicit reason and audit without inventing an outcome", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const phoneId = await database.phones.add(phone(studentId));

      const result = await markPhoneAsInvalid(phoneId, database);
      const updatedPhone = await database.phones.get(phoneId);

      expect(result.phone_status).toBe("invalid");
      expect(updatedPhone?.phone_status).toBe("invalid");
      expect(updatedPhone?.invalid_reason).toBe("manual");
      expect(updatedPhone?.invalidated_at).toEqual(expect.any(String));
      expect(updatedPhone?.is_wrong).toBe(false);
      expect(updatedPhone?.call_outcome).toBeUndefined();

      const audit = await database.audit_logs.where("entity_id").equals(phoneId).first();
      expect(audit).toMatchObject({
        entity_type: "phone",
        action_type: "update",
        field_name: "operational_status",
        performed_by: "agent"
      });
      expect(JSON.parse(audit?.old_value ?? "{}")).toMatchObject({
        phone_status: "active",
        invalid_reason: null,
        invalidated_at: null,
        is_wrong: false
      });
      expect(JSON.parse(audit?.new_value ?? "{}")).toMatchObject({
        phone_status: "invalid",
        invalid_reason: "manual",
        is_wrong: false
      });
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("re-enables a wrong-number phone and resets its invalidating outcome without changing call history", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const phoneId = await database.phones.add(
        phone(studentId, {
          phone_status: "invalid",
          invalid_reason: "wrong_number",
          invalidated_at: "2026-05-09T09:00:00.000Z",
          is_wrong: true,
          call_outcome: "wrong_number",
          call_outcome_updated_at: "2026-05-09T09:00:00.000Z"
        })
      );
      const callLogId = await database.call_logs.add({
        uuid: crypto.randomUUID(),
        student_id: studentId,
        phone_id: phoneId,
        contacted_phone_id: phoneId,
        contacted_phone_number: "05321234567",
        call_time: "2026-05-09T09:00:00.000Z",
        call_result: "wrong_number",
        sync_status: "local",
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null
      });
      const historicalCallLog = await database.call_logs.get(callLogId);

      const result = await markPhoneAsInvalid(phoneId, database);
      const updatedPhone = await database.phones.get(phoneId);

      expect(result.phone_status).toBe("active");
      expect(updatedPhone?.phone_status).toBe("active");
      expect(updatedPhone?.invalid_reason).toBeNull();
      expect(updatedPhone?.invalidated_at).toBeNull();
      expect(updatedPhone?.is_wrong).toBe(false);
      expect(updatedPhone?.call_outcome).toBe("not_called");
      expect(updatedPhone?.call_outcome_updated_at).toEqual(expect.any(String));
      expect(updatedPhone?.call_outcome_updated_at).not.toBe("2026-05-09T09:00:00.000Z");
      expect(await database.call_logs.get(callLogId)).toEqual(historicalCallLog);
      expect(await database.audit_logs.count()).toBe(1);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("re-enables a not-in-use phone and resets its invalidating outcome", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const phoneId = await database.phones.add(
        phone(studentId, {
          phone_status: "invalid",
          invalid_reason: "not_in_use",
          invalidated_at: "2026-05-09T09:00:00.000Z",
          is_wrong: false,
          call_outcome: "unused",
          call_outcome_updated_at: "2026-05-09T09:00:00.000Z"
        })
      );

      await markPhoneAsInvalid(phoneId, database);

      expect(await database.phones.get(phoneId)).toMatchObject({
        phone_status: "active",
        invalid_reason: null,
        invalidated_at: null,
        is_wrong: false,
        call_outcome: "not_called",
        call_outcome_updated_at: expect.any(String)
      });
      expect(await database.audit_logs.count()).toBe(1);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("re-enables a legacy wrong-flag phone whose stored status is still active", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const phoneId = await database.phones.add(
        phone(studentId, {
          phone_status: "active",
          is_wrong: true
        })
      );

      const result = await markPhoneAsInvalid(phoneId, database);

      expect(result.phone_status).toBe("active");
      expect(await database.phones.get(phoneId)).toMatchObject({
        phone_status: "active",
        invalid_reason: null,
        invalidated_at: null,
        is_wrong: false
      });
      expect(await database.audit_logs.count()).toBe(1);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("re-enables a manually disabled phone while preserving a non-invalidating outcome", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const phoneId = await database.phones.add(
        phone(studentId, {
          phone_status: "invalid",
          invalid_reason: "manual",
          invalidated_at: "2026-05-09T09:00:00.000Z",
          is_wrong: false,
          call_outcome: "busy",
          call_outcome_updated_at: "2026-05-09T09:00:00.000Z"
        })
      );

      await markPhoneAsInvalid(phoneId, database);

      expect(await database.phones.get(phoneId)).toMatchObject({
        phone_status: "active",
        invalid_reason: null,
        invalidated_at: null,
        is_wrong: false,
        call_outcome: "busy",
        call_outcome_updated_at: "2026-05-09T09:00:00.000Z"
      });
      expect(await database.audit_logs.count()).toBe(1);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("rolls back an operational transition when its audit write fails", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const phoneId = await database.phones.add(phone(studentId));
      const before = await database.phones.get(phoneId);
      vi.spyOn(database.audit_logs, "add").mockRejectedValueOnce(new Error("audit failed"));

      await expect(markPhoneAsInvalid(phoneId, database)).rejects.toThrow("audit failed");

      expect(await database.phones.get(phoneId)).toEqual(before);
      expect(await database.audit_logs.count()).toBe(0);
    } finally {
      database.close();
      await database.delete();
    }
  });
});

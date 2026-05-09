import { describe, expect, it } from "vitest";
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
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("marks a phone as invalid and keeps is_wrong in sync", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const phoneId = await database.phones.add(phone(studentId));

      const result = await markPhoneAsInvalid(phoneId, database);
      const updatedPhone = await database.phones.get(phoneId);

      expect(result.phone_status).toBe("invalid");
      expect(updatedPhone?.phone_status).toBe("invalid");
      expect(updatedPhone?.is_wrong).toBe(true);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("removes invalid status when the same phone is selected again", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const phoneId = await database.phones.add(phone(studentId, { phone_status: "invalid", is_wrong: true }));

      const result = await markPhoneAsInvalid(phoneId, database);
      const updatedPhone = await database.phones.get(phoneId);

      expect(result.phone_status).toBe("active");
      expect(updatedPhone?.phone_status).toBe("active");
      expect(updatedPhone?.is_wrong).toBe(false);
    } finally {
      database.close();
      await database.delete();
    }
  });
});

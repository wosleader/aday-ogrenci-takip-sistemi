import type { AppDatabase } from "../../../db/db";
import { db } from "../../../db/db";
import type { PhoneStatus } from "../../../domain/models/phone";
import { nowIso } from "../../../utils/dateTime";

export type PhoneStatusUpdateResult = {
  phone_id: number;
  student_id: number;
  phone_status: PhoneStatus;
};

async function getPhoneOrThrow(database: AppDatabase, phoneId: number) {
  const phone = await database.phones.get(phoneId);

  if (!phone?.id) {
    throw new Error("Telefon kaydı bulunamadı.");
  }

  return phone as typeof phone & { id: number };
}

export async function markPhoneAsContacted(
  phoneId: number,
  database: AppDatabase = db
): Promise<PhoneStatusUpdateResult> {
  let result: PhoneStatusUpdateResult | undefined;

  await database.transaction("rw", database.phones, async () => {
    const phone = await getPhoneOrThrow(database, phoneId);
    const timestamp = nowIso();
    const studentPhones = await database.phones.where("student_id").equals(phone.student_id).toArray();
    const nextStatus: PhoneStatus = phone.phone_status === "contacted" ? "active" : "contacted";

    await Promise.all(
      studentPhones
        .filter((studentPhone) => studentPhone.id && studentPhone.id !== phone.id)
        .map((studentPhone) =>
          database.phones.update(studentPhone.id!, {
            phone_status: studentPhone.phone_status === "contacted" ? "active" : studentPhone.phone_status ?? "active",
            updated_at: timestamp
          })
        )
    );

    await database.phones.update(phone.id, {
      phone_status: nextStatus,
      is_wrong: nextStatus === "contacted" ? false : phone.is_wrong,
      updated_at: timestamp
    });

    result = {
      phone_id: phone.id,
      student_id: phone.student_id,
      phone_status: nextStatus
    };
  });

  if (!result) {
    throw new Error("Telefon durumu güncellenemedi.");
  }

  return result;
}

export async function markPhoneAsInvalid(
  phoneId: number,
  database: AppDatabase = db
): Promise<PhoneStatusUpdateResult> {
  let result: PhoneStatusUpdateResult | undefined;

  await database.transaction("rw", database.phones, async () => {
    const phone = await getPhoneOrThrow(database, phoneId);
    const nextStatus: PhoneStatus =
      phone.phone_status === "invalid" || phone.is_wrong ? "active" : "invalid";

    await database.phones.update(phone.id, {
      phone_status: nextStatus,
      is_wrong: nextStatus === "invalid",
      updated_at: nowIso()
    });

    result = {
      phone_id: phone.id,
      student_id: phone.student_id,
      phone_status: nextStatus
    };
  });

  if (!result) {
    throw new Error("Telefon durumu güncellenemedi.");
  }

  return result;
}

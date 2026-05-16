import type { AppDatabase } from "../../../db/db";
import { db } from "../../../db/db";
import type { CampaignRecord } from "../../../domain/models/campaign";
import type { CallLogRecord } from "../../../domain/models/callLog";
import type { GuardianRecord } from "../../../domain/models/guardian";
import type { PhoneRecord } from "../../../domain/models/phone";
import type { ReminderRecord } from "../../../domain/models/reminder";
import type { StudentRecord } from "../../../domain/models/student";
import { createSearchText, normalizeText } from "../../../utils/normalizeText";

export type StudentListFilter =
  | "all"
  | "missing_phone"
  | "has_reminder"
  | "duplicate_phone"
  | "not_called"
  | "has_note";

export type StudentListRow = {
  student_id: number;
  student_full_name: string;
  normalized_student_name: string;
  current_class?: string | null;
  student_group: string;
  category: string;
  campaign_id?: number | null;
  campaign_name?: string | null;
  guardian_id?: number | null;
  guardian_full_name?: string | null;
  phone_1_id?: number | null;
  phone_1?: string | null;
  phone_1_status: "active" | "contacted" | "invalid";
  phone_1_is_wrong: boolean;
  phone_1_is_contacted: boolean;
  phone_2_id?: number | null;
  phone_2?: string | null;
  phone_2_status: "active" | "contacted" | "invalid";
  phone_2_is_wrong: boolean;
  phone_2_is_contacted: boolean;
  phone_count: number;
  has_missing_phone: boolean;
  has_duplicate_phone: boolean;
  duplicate_group_key?: string | null;
  duplicate_phone_keys: string[];
  has_reminder: boolean;
  next_reminder_at?: string | null;
  lifecycle_status: string;
  last_call_result: string;
  general_note?: string | null;
  note_count: number;
  call_note_count: number;
  latest_call_note?: string | null;
  latest_call_note_at?: string | null;
  has_any_note: boolean;
  next_action_label: string;
  source_row_number?: number | null;
  created_at: string;
  updated_at: string;
  search_blob: string;
};

export const ALL_STUDENT_GROUPS_FILTER = "all";
export const UNSPECIFIED_STUDENT_GROUP_FILTER = "__unspecified__";

export type StudentGroupFilterValue = typeof ALL_STUDENT_GROUPS_FILTER | typeof UNSPECIFIED_STUDENT_GROUP_FILTER | string;

export type StudentGroupFilterOption = {
  value: StudentGroupFilterValue;
  label: string;
  group: "all" | "class_level" | "section" | "unspecified";
};

export type StudentListNoteSummary = {
  text: string;
  suffix?: string;
  title?: string;
};

type ParsedClassSection = {
  grade?: number;
  suffix?: string;
  label?: string;
};

const VALID_CLASS_LEVELS = new Set(Array.from({ length: 12 }, (_, index) => index + 1));
const CLASS_LEVEL_FILTER_PREFIX = "class:";
const SECTION_FILTER_PREFIX = "section:";

function isActive<T extends { deleted_at?: string | null }>(record: T): boolean {
  return !record.deleted_at;
}

function byCreatedAt<T extends { created_at: string; id?: number }>(left: T, right: T): number {
  return left.created_at.localeCompare(right.created_at) || (left.id ?? 0) - (right.id ?? 0);
}

function isSecondPhoneLabel(label?: string | null): boolean {
  const normalizedLabel = normalizeText(label ?? "");
  return normalizedLabel.includes("2") || normalizedLabel.includes("ikinci");
}

function isFirstPhoneCandidate(phone: PhoneRecord): boolean {
  const normalizedLabel = normalizeText(phone.phone_label ?? "");

  return phone.is_primary || normalizedLabel === "telefon" || normalizedLabel === "telefon 1";
}

function pickPhoneSlots(phones: PhoneRecord[]) {
  const sortedPhones = [...phones].sort(byCreatedAt);
  const secondByLabel = sortedPhones.find((phone) => isSecondPhoneLabel(phone.phone_label));

  if (secondByLabel && sortedPhones.length === 1) {
    return {
      phone_1: null,
      phone_2: secondByLabel
    };
  }

  const firstByLabel = sortedPhones.find(
    (phone) => phone.normalized_phone_number !== secondByLabel?.normalized_phone_number && isFirstPhoneCandidate(phone)
  );
  const phone1 = firstByLabel ?? sortedPhones.find((phone) => phone.id !== secondByLabel?.id) ?? sortedPhones[0];
  const phone2 =
    secondByLabel && secondByLabel.id !== phone1?.id
      ? secondByLabel
      : sortedPhones.find((phone) => phone.id !== phone1?.id);

  return {
    phone_1: phone1 ?? null,
    phone_2: phone2 ?? null
  };
}

function createPhoneDuplicateInfo(phones: PhoneRecord[]): Map<number, string[]> {
  const phoneOwners = new Map<string, Set<number>>();

  for (const phone of phones) {
    if (!phone.normalized_phone_number) {
      continue;
    }

    const owners = phoneOwners.get(phone.normalized_phone_number) ?? new Set<number>();
    owners.add(phone.student_id);
    phoneOwners.set(phone.normalized_phone_number, owners);
  }

  const duplicatedPhonesByStudent = new Map<number, string[]>();

  for (const [phoneNumber, owners] of phoneOwners.entries()) {
    if (!phoneNumber || owners.size < 2) {
      continue;
    }

    for (const studentId of owners) {
      const studentPhones = duplicatedPhonesByStudent.get(studentId) ?? [];
      studentPhones.push(phoneNumber);
      duplicatedPhonesByStudent.set(studentId, studentPhones);
    }
  }

  return duplicatedPhonesByStudent;
}

function groupByStudentId<T extends { student_id: number }>(records: T[]): Map<number, T[]> {
  const grouped = new Map<number, T[]>();

  for (const record of records) {
    const recordsForStudent = grouped.get(record.student_id) ?? [];
    recordsForStudent.push(record);
    grouped.set(record.student_id, recordsForStudent);
  }

  return grouped;
}

function buildCampaignMap(campaigns: CampaignRecord[]): Map<number, CampaignRecord> {
  return new Map(campaigns.flatMap((campaign) => (campaign.id ? [[campaign.id, campaign]] : [])));
}

function cleanClassSectionValue(value?: string | null): string {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return "";
  }

  return trimmedValue.replace(/\s+/g, " ");
}

function isSingleLetterSection(value: string): boolean {
  return /^[A-Za-zÇĞİÖŞÜçğıöşü]$/u.test(value.trim());
}

function isMeaninglessNumericValue(value: string): boolean {
  if (!/^\d+$/.test(value)) {
    return false;
  }

  return !VALID_CLASS_LEVELS.has(Number(value));
}

function normalizeClassSectionSuffix(value: string): string {
  const cleanValue = cleanClassSectionValue(value);

  return isSingleLetterSection(cleanValue) ? cleanValue.toLocaleUpperCase("tr-TR") : cleanValue;
}

function parseClassAndSection(value?: string | null): ParsedClassSection | null {
  const cleanValue = cleanClassSectionValue(value);

  if (!cleanValue || isMeaninglessNumericValue(cleanValue)) {
    return null;
  }

  if (/^mezun$/i.test(normalizeText(cleanValue))) {
    return { label: "Mezun" };
  }

  const match = cleanValue.match(/^(\d{1,2})(?:\s*\.?\s*(?:sınıf|sinif))?(?:\s*[-/ ]\s*|\s*)(.*)$/i);

  if (!match) {
    return { label: cleanValue };
  }

  const grade = Number(match[1]);

  if (!VALID_CLASS_LEVELS.has(grade)) {
    return null;
  }

  const suffix = normalizeClassSectionSuffix(match[2] ?? "");

  if (!suffix) {
    return {
      grade,
      label: `${grade}. Sınıf`
    };
  }

  if (isSingleLetterSection(suffix)) {
    return {
      grade,
      suffix,
      label: `${grade}-${suffix}`
    };
  }

  return {
    grade,
    suffix,
    label: `${grade}. Sınıf ${suffix}`
  };
}

export function normalizeClassSectionLabel(currentClass?: string | null, studentGroup?: string | null): string | null {
  const parsedClass = parseClassAndSection(currentClass);
  const parsedGroup = parseClassAndSection(studentGroup);
  const cleanGroup = cleanClassSectionValue(studentGroup);
  const hasMeaningfulGroup = Boolean(cleanGroup) && !isMeaninglessNumericValue(cleanGroup);

  if (parsedClass?.grade && hasMeaningfulGroup) {
    const groupSuffix = normalizeClassSectionSuffix(cleanGroup);

    if (parsedGroup?.grade && parsedGroup.grade === parsedClass.grade) {
      return parsedGroup.label ?? null;
    }

    if (parsedGroup?.grade && parsedGroup.grade !== parsedClass.grade && parsedClass.suffix) {
      return parsedClass.label ?? null;
    }

    if (isSingleLetterSection(groupSuffix)) {
      return `${parsedClass.grade}-${groupSuffix}`;
    }

    return `${parsedClass.grade}. Sınıf ${groupSuffix}`;
  }

  if (parsedClass?.label) {
    return parsedClass.label;
  }

  if (parsedGroup?.label) {
    return parsedGroup.label;
  }

  return null;
}

function getClassLevelFromLabel(label?: string | null): { value: string; label: string } | null {
  const cleanLabel = cleanClassSectionValue(label);

  if (!cleanLabel) {
    return null;
  }

  if (/^mezun\b/i.test(normalizeText(cleanLabel))) {
    return {
      value: `${CLASS_LEVEL_FILTER_PREFIX}mezun`,
      label: "Mezun"
    };
  }

  const gradeMatch = cleanLabel.match(/^(\d{1,2})(?:\s*[-/. ]|\s*\.?\s*sınıf|\s*\.?\s*sinif)?/i);

  if (!gradeMatch) {
    return null;
  }

  const grade = Number(gradeMatch[1]);

  if (!VALID_CLASS_LEVELS.has(grade)) {
    return null;
  }

  return {
    value: `${CLASS_LEVEL_FILTER_PREFIX}${grade}`,
    label: `${grade}. Sınıf`
  };
}

function getSectionFilterValue(label: string): string {
  return `${SECTION_FILTER_PREFIX}${normalizeText(label).replace(/\s+/g, " ")}`;
}

export function getClassLevelFilterKey(currentClass?: string | null, studentGroup?: string | null): StudentGroupFilterValue {
  const label = normalizeClassSectionLabel(currentClass, studentGroup);
  const classLevel = getClassLevelFromLabel(label);

  return classLevel?.value ?? UNSPECIFIED_STUDENT_GROUP_FILTER;
}

export function getStudentGroupFilterKey(
  currentClass?: string | null,
  studentGroup?: string | null
): StudentGroupFilterValue {
  const label = normalizeClassSectionLabel(currentClass, studentGroup);

  if (!label) {
    return UNSPECIFIED_STUDENT_GROUP_FILTER;
  }

  return getSectionFilterValue(label);
}

export function getStudentGroupFilterLabel(value: StudentGroupFilterValue, fallbackLabel?: string | null): string {
  if (value === ALL_STUDENT_GROUPS_FILTER) {
    return "Tüm Sınıf / Şubeler";
  }

  if (value === UNSPECIFIED_STUDENT_GROUP_FILTER) {
    return "Belirtilmemiş";
  }

  return fallbackLabel?.trim() || value;
}

export function createStudentGroupFilterOptions(rows: StudentListRow[]): StudentGroupFilterOption[] {
  const classLevelOptions = new Map<StudentGroupFilterValue, StudentGroupFilterOption>();
  const sectionOptions = new Map<StudentGroupFilterValue, StudentGroupFilterOption>();
  let hasUnspecified = false;

  for (const row of rows) {
    const label = normalizeClassSectionLabel(row.current_class, row.student_group);
    const value = getStudentGroupFilterKey(row.current_class, row.student_group);

    if (value === UNSPECIFIED_STUDENT_GROUP_FILTER || !label) {
      hasUnspecified = true;
      continue;
    }

    const classLevel = getClassLevelFromLabel(label);

    if (classLevel && !classLevelOptions.has(classLevel.value)) {
      classLevelOptions.set(classLevel.value, {
        value: classLevel.value,
        label: classLevel.label,
        group: "class_level"
      });
    }

    if (!sectionOptions.has(value)) {
      sectionOptions.set(value, {
        value,
        label: getStudentGroupFilterLabel(value, label),
        group: "section"
      });
    }
  }

  const sortedClassLevelOptions = [...classLevelOptions.values()].sort((left, right) => {
    const leftIsMezun = left.value === `${CLASS_LEVEL_FILTER_PREFIX}mezun`;
    const rightIsMezun = right.value === `${CLASS_LEVEL_FILTER_PREFIX}mezun`;

    if (leftIsMezun || rightIsMezun) {
      return leftIsMezun === rightIsMezun ? 0 : 1;
    }

    return Number(left.value.replace(CLASS_LEVEL_FILTER_PREFIX, "")) - Number(right.value.replace(CLASS_LEVEL_FILTER_PREFIX, ""));
  });
  const sortedSectionOptions = [...sectionOptions.values()].sort((left, right) =>
    left.label.localeCompare(right.label, "tr")
  );
  const unspecifiedOptions: StudentGroupFilterOption[] = hasUnspecified
    ? [{ value: UNSPECIFIED_STUDENT_GROUP_FILTER, label: "Belirtilmemiş", group: "unspecified" }]
    : [];

  return [
    { value: ALL_STUDENT_GROUPS_FILTER, label: "Tüm Sınıf / Şubeler", group: "all" },
    ...sortedClassLevelOptions,
    ...sortedSectionOptions,
    ...unspecifiedOptions
  ];
}

export function filterRowsByStudentGroup(
  rows: StudentListRow[],
  studentGroupFilter: StudentGroupFilterValue = ALL_STUDENT_GROUPS_FILTER
): StudentListRow[] {
  if (studentGroupFilter === ALL_STUDENT_GROUPS_FILTER) {
    return rows;
  }

  if (studentGroupFilter.startsWith(CLASS_LEVEL_FILTER_PREFIX)) {
    return rows.filter((row) => getClassLevelFilterKey(row.current_class, row.student_group) === studentGroupFilter);
  }

  return rows.filter((row) => getStudentGroupFilterKey(row.current_class, row.student_group) === studentGroupFilter);
}

function pickGuardian(guardians: GuardianRecord[]): GuardianRecord | undefined {
  return [...guardians].sort(byCreatedAt)[0];
}

function pickNextPendingReminder(reminders: ReminderRecord[]): ReminderRecord | undefined {
  return reminders
    .filter((reminder) => reminder.status === "pending")
    .sort((left, right) => left.reminder_at.localeCompare(right.reminder_at) || byCreatedAt(left, right))[0];
}

function callLogSortTime(callLog: CallLogRecord): string {
  return callLog.call_time || callLog.created_at;
}

function pickLatestCallNote(callLogs: CallLogRecord[]): { note?: string | null; at?: string | null; count: number; notes: string[] } {
  const notes = callLogs
    .flatMap((log) => {
      const note = log.note?.trim();

      return note
        ? [
            {
              note,
              at: callLogSortTime(log),
              id: log.id ?? 0
            }
          ]
        : [];
    })
    .sort((left, right) => right.at.localeCompare(left.at) || right.id - left.id);

  return {
    note: notes[0]?.note ?? null,
    at: notes[0]?.at ?? null,
    count: notes.length,
    notes: notes.map((item) => item.note)
  };
}

function truncateListNote(value: string, maxLength = 72): string {
  return value.length > maxLength ? `${value.slice(0, maxLength).trimEnd()}...` : value;
}

export function createStudentListNoteSummary(row: StudentListRow, filter: StudentListFilter = "all"): StudentListNoteSummary {
  const hasGeneralNote = Boolean(row.general_note?.trim());
  const callNoteCount = row.call_note_count;

  if (filter === "has_note") {
    const detailText = row.latest_call_note?.trim() || row.general_note?.trim();

    if (!detailText) {
      return { text: "—" };
    }

    return {
      text: truncateListNote(detailText),
      suffix: callNoteCount > 1 ? `${callNoteCount} not` : undefined,
      title: detailText
    };
  }

  if (!hasGeneralNote && callNoteCount === 0) {
    return { text: "—" };
  }

  if (hasGeneralNote && callNoteCount === 0) {
    return {
      text: "Genel not var",
      title: row.general_note?.trim()
    };
  }

  if (!hasGeneralNote) {
    return {
      text: `${callNoteCount} not`,
      title: row.latest_call_note?.trim() || undefined
    };
  }

  return {
    text: `Genel + ${callNoteCount} not`,
    title: [row.general_note?.trim(), row.latest_call_note?.trim()].filter(Boolean).join(" | ")
  };
}

function mapStudentToRow(
  student: StudentRecord & { id: number },
  guardiansByStudent: Map<number, GuardianRecord[]>,
  phonesByStudent: Map<number, PhoneRecord[]>,
  remindersByStudent: Map<number, ReminderRecord[]>,
  callLogsByStudent: Map<number, CallLogRecord[]>,
  campaignMap: Map<number, CampaignRecord>,
  duplicatedPhonesByStudent: Map<number, string[]>
): StudentListRow {
  const guardians = guardiansByStudent.get(student.id) ?? [];
  const phones = phonesByStudent.get(student.id) ?? [];
  const pendingReminder = pickNextPendingReminder(remindersByStudent.get(student.id) ?? []);
  const callLogs = callLogsByStudent.get(student.id) ?? [];
  const callLogNoteInfo = pickLatestCallNote(callLogs);
  const guardian = pickGuardian(guardians);
  const { phone_1: phone1, phone_2: phone2 } = pickPhoneSlots(phones);
  const campaign = student.campaign_id ? campaignMap.get(student.campaign_id) : undefined;
  const phone1Status = phone1?.phone_status ?? (phone1?.is_wrong ? "invalid" : "active");
  const phone2Status = phone2?.phone_status ?? (phone2?.is_wrong ? "invalid" : "active");
  const duplicatePhoneKeys = duplicatedPhonesByStudent.get(student.id) ?? [];
  const hasGeneralNote = Boolean(student.general_note?.trim());

  return {
    student_id: student.id,
    student_full_name: student.student_full_name,
    normalized_student_name: student.normalized_student_name,
    current_class: student.current_class ?? null,
    student_group: student.student_group,
    category: student.category,
    campaign_id: student.campaign_id ?? null,
    campaign_name: campaign?.name ?? null,
    guardian_id: guardian?.id ?? null,
    guardian_full_name: guardian?.guardian_full_name ?? null,
    phone_1_id: phone1?.id ?? null,
    phone_1: phone1?.phone_number ?? null,
    phone_1_status: phone1Status,
    phone_1_is_wrong: phone1Status === "invalid" || Boolean(phone1?.is_wrong),
    phone_1_is_contacted: phone1Status === "contacted",
    phone_2_id: phone2?.id ?? null,
    phone_2: phone2?.phone_number ?? null,
    phone_2_status: phone2Status,
    phone_2_is_wrong: phone2Status === "invalid" || Boolean(phone2?.is_wrong),
    phone_2_is_contacted: phone2Status === "contacted",
    phone_count: phones.length,
    has_missing_phone: phones.length === 0,
    has_duplicate_phone: duplicatePhoneKeys.length > 0,
    duplicate_group_key: duplicatePhoneKeys[0] ?? null,
    duplicate_phone_keys: duplicatePhoneKeys,
    has_reminder: Boolean(pendingReminder),
    next_reminder_at: pendingReminder?.reminder_at ?? null,
    lifecycle_status: student.lifecycle_status,
    last_call_result: student.last_call_result,
    general_note: student.general_note ?? null,
    note_count: (hasGeneralNote ? 1 : 0) + callLogNoteInfo.count,
    call_note_count: callLogNoteInfo.count,
    latest_call_note: callLogNoteInfo.note ?? null,
    latest_call_note_at: callLogNoteInfo.at ?? null,
    has_any_note: hasGeneralNote || callLogNoteInfo.count > 0,
    next_action_label: pendingReminder ? `Tekrar ara: ${pendingReminder.reminder_at}` : "-",
    source_row_number: student.source_row_number ?? null,
    created_at: student.created_at,
    updated_at: student.updated_at,
    search_blob: createSearchText([
      student.search_text,
      student.student_full_name,
      guardian?.guardian_full_name,
      phone1?.phone_number,
      phone2?.phone_number,
      student.general_note,
      ...callLogNoteInfo.notes
    ])
  };
}

export async function readStudentListRows(database: AppDatabase = db): Promise<StudentListRow[]> {
  const [students, guardians, phones, reminders, campaigns, callLogs] = await Promise.all([
    database.students.toArray(),
    database.guardians.toArray(),
    database.phones.toArray(),
    database.reminders.toArray(),
    database.campaigns.toArray(),
    database.call_logs.toArray()
  ]);
  const activeStudents = students.filter(isActive).flatMap((student) => (student.id ? [student as StudentRecord & { id: number }] : []));
  const activeGuardians = guardians.filter(isActive);
  const activePhones = phones.filter(isActive);
  const activeReminders = reminders.filter(isActive);

  const guardiansByStudent = groupByStudentId(activeGuardians);
  const phonesByStudent = groupByStudentId(activePhones);
  const remindersByStudent = groupByStudentId(activeReminders);
  const callLogsByStudent = groupByStudentId(callLogs.filter(isActive));
  const campaignMap = buildCampaignMap(campaigns.filter(isActive));
  const duplicatedPhonesByStudent = createPhoneDuplicateInfo(activePhones);

  return activeStudents
    .sort((left, right) => byCreatedAt(right, left))
    .map((student) =>
      mapStudentToRow(
        student,
        guardiansByStudent,
        phonesByStudent,
        remindersByStudent,
        callLogsByStudent,
        campaignMap,
        duplicatedPhonesByStudent
      )
    );
}

export function filterStudentListRows(
  rows: StudentListRow[],
  query: string,
  filter: StudentListFilter = "all"
): StudentListRow[] {
  const normalizedQuery = normalizeText(query);

  return rows.filter((row) => {
    const matchesQuery = !normalizedQuery || row.search_blob.includes(normalizedQuery);

    if (!matchesQuery) {
      return false;
    }

    if (filter === "missing_phone") {
      return row.has_missing_phone;
    }

    if (filter === "has_reminder") {
      return row.has_reminder;
    }

    if (filter === "duplicate_phone") {
      return row.has_duplicate_phone;
    }

    if (filter === "not_called") {
      return row.last_call_result === "not_called";
    }

    if (filter === "has_note") {
      return row.has_any_note;
    }

    return true;
  });
}

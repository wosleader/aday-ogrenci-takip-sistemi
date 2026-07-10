import { afterEach, describe, expect, it } from "vitest";
import { AppDatabase } from "../../src/db/db";
import type { CallResult } from "../../src/domain/constants/statuses";
import type { CallLogRecord } from "../../src/domain/models/callLog";
import type { CampaignRecord } from "../../src/domain/models/campaign";
import type { StudentRecord } from "../../src/domain/models/student";
import { readDailyReport } from "../../src/features/reports/services/dailyReportReader";
import { readReportingV2Summary } from "../../src/features/reports/services/reportingV2Reader";
import { createSearchText, normalizeText } from "../../src/utils/normalizeText";

const timestamp = "2026-05-10T09:00:00.000";

let database: AppDatabase | null = null;

async function createDatabase() {
  database = new AppDatabase(`test-reporting-v2-${crypto.randomUUID()}`);
  await database.open();
  return database;
}

function campaign(name: string, overrides: Partial<CampaignRecord> = {}): CampaignRecord {
  return {
    uuid: crypto.randomUUID(),
    name,
    is_default: false,
    is_active: true,
    sync_status: "local",
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    ...overrides,
  };
}

function student(name: string, overrides: Partial<StudentRecord> = {}): StudentRecord {
  return {
    uuid: crypto.randomUUID(),
    student_full_name: name,
    normalized_student_name: normalizeText(name),
    search_text: createSearchText([name]),
    current_class: "11",
    student_group: "YKS",
    category: "YKS",
    campaign_id: null,
    lifecycle_status: "candidate",
    last_call_result: "not_called",
    sync_status: "local",
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    ...overrides,
  };
}

function callLog(studentId: number, overrides: Partial<CallLogRecord> = {}): CallLogRecord {
  return {
    uuid: crypto.randomUUID(),
    student_id: studentId,
    call_time: "2026-05-10T10:00:00.000",
    call_result: "reached",
    note: null,
    sync_status: "local",
    created_at: "2026-05-10T10:00:00.000",
    updated_at: "2026-05-10T10:00:00.000",
    deleted_at: null,
    ...overrides,
  };
}

async function seedStudent(name: string, overrides: Partial<StudentRecord> = {}) {
  const testDb = database ?? (await createDatabase());
  return testDb.students.add(student(name, overrides));
}

async function seedCampaign(name: string, overrides: Partial<CampaignRecord> = {}) {
  const testDb = database ?? (await createDatabase());
  return testDb.campaigns.add(campaign(name, overrides));
}

describe("reportingV2Reader", () => {
  afterEach(async () => {
    if (database) {
      database.close();
      await database.delete();
      database = null;
    }
  });

  it("counts active call logs inside the selected date range", async () => {
    const testDb = await createDatabase();
    const studentId = await seedStudent("Tarih Adayi");
    await testDb.call_logs.bulkAdd([
      callLog(studentId, { call_time: "2026-05-09T23:59:00.000", call_result: "reached" }),
      callLog(studentId, { call_time: "2026-05-10T10:00:00.000", call_result: "reached" }),
      callLog(studentId, { call_time: "2026-05-11T11:00:00.000", call_result: "appointment" }),
      callLog(studentId, { call_time: "2026-05-12T00:01:00.000", call_result: "registered" }),
    ]);

    const summary = await readReportingV2Summary({ fromDate: "2026-05-10", toDate: "2026-05-11", database: testDb });

    expect(summary.totals.totalCallLogs).toBe(2);
    expect(summary.totals.reached).toBe(1);
    expect(summary.totals.appointmentResults).toBe(1);
    expect(summary.dailyTrend).toEqual([
      expect.objectContaining({ date: "2026-05-10", totalCallLogs: 1 }),
      expect.objectContaining({ date: "2026-05-11", totalCallLogs: 1 }),
    ]);
  });

  it("matches the daily report call counts for the same one-day range", async () => {
    const testDb = await createDatabase();
    const firstStudentId = await seedStudent("Gunluk Bir");
    const secondStudentId = await seedStudent("Gunluk Iki");
    await testDb.call_logs.bulkAdd([
      callLog(firstStudentId, { call_time: "2026-05-10T09:00:00.000", call_result: "reached" }),
      callLog(firstStudentId, { call_time: "2026-05-10T10:00:00.000", call_result: "not_reached" }),
      callLog(secondStudentId, { call_time: "2026-05-10T11:00:00.000", call_result: "registered" }),
    ]);

    const dailyReport = await readDailyReport("2026-05-10", {
      database: testDb,
      now: "2026-05-10T12:00:00.000",
    });
    const v2Summary = await readReportingV2Summary({
      fromDate: "2026-05-10",
      toDate: "2026-05-10",
      database: testDb,
    });

    expect(v2Summary.totals.totalCallLogs).toBe(dailyReport.summary.call_log_count);
    expect(v2Summary.totals.uniqueStudentsWithCallLogs).toBe(dailyReport.summary.unique_student_count);
    expect(v2Summary.totals.reached).toBe(dailyReport.summary.reached_count);
    expect(v2Summary.totals.notReached).toBe(dailyReport.summary.not_reached_count);
    expect(v2Summary.totals.registeredResults).toBe(dailyReport.summary.registered_count);
  });

  it("excludes soft-deleted call logs", async () => {
    const testDb = await createDatabase();
    const studentId = await seedStudent("Silinen Kayit");
    await testDb.call_logs.bulkAdd([
      callLog(studentId, { call_time: "2026-05-10T09:00:00.000", call_result: "reached" }),
      callLog(studentId, {
        call_time: "2026-05-10T10:00:00.000",
        call_result: "registered",
        deleted_at: "2026-05-10T11:00:00.000",
      }),
    ]);

    const summary = await readReportingV2Summary({ fromDate: "2026-05-10", toDate: "2026-05-10", database: testDb });

    expect(summary.totals.totalCallLogs).toBe(1);
    expect(summary.totals.registeredResults).toBe(0);
  });

  it("reflects corrected call_result values from current call log data", async () => {
    const testDb = await createDatabase();
    const studentId = await seedStudent("Duzeltilen Sonuc");
    await testDb.call_logs.add(callLog(studentId, { call_result: "registered" }));

    const summary = await readReportingV2Summary({ fromDate: "2026-05-10", toDate: "2026-05-10", database: testDb });

    expect(summary.totals.registeredResults).toBe(1);
    expect(summary.totals.reached).toBe(0);
  });

  it("uses corrected call_time values for date range filtering", async () => {
    const testDb = await createDatabase();
    const studentId = await seedStudent("Duzeltilen Tarih");
    await testDb.call_logs.add(
      callLog(studentId, {
        call_time: "2026-05-11T10:00:00.000",
        created_at: "2026-05-10T10:00:00.000",
        call_result: "appointment",
      })
    );

    const may10 = await readReportingV2Summary({ fromDate: "2026-05-10", toDate: "2026-05-10", database: testDb });
    const may11 = await readReportingV2Summary({ fromDate: "2026-05-11", toDate: "2026-05-11", database: testDb });

    expect(may10.totals.totalCallLogs).toBe(0);
    expect(may11.totals.appointmentResults).toBe(1);
  });

  it("filters by the student's current campaign", async () => {
    const testDb = await createDatabase();
    const yksCampaignId = await seedCampaign("11. Sınıf YKS");
    const lgsCampaignId = await seedCampaign("8. Sınıf LGS");
    const yksStudentId = await seedStudent("YKS Aday", { campaign_id: yksCampaignId });
    const lgsStudentId = await seedStudent("LGS Aday", { campaign_id: lgsCampaignId });
    await testDb.call_logs.bulkAdd([
      callLog(yksStudentId, { call_result: "reached" }),
      callLog(lgsStudentId, { call_result: "appointment" }),
    ]);

    const summary = await readReportingV2Summary({
      fromDate: "2026-05-10",
      toDate: "2026-05-10",
      campaignId: lgsCampaignId,
      database: testDb,
    });

    expect(summary.totals.totalCallLogs).toBe(1);
    expect(summary.totals.appointmentResults).toBe(1);
    expect(summary.filters.campaignName).toBe("8. Sınıf LGS");
  });

  it("creates a campaign breakdown with result counts", async () => {
    const testDb = await createDatabase();
    const yksCampaignId = await seedCampaign("YKS Kampanyasi");
    const lgsCampaignId = await seedCampaign("LGS Kampanyasi");
    const yksStudentId = await seedStudent("YKS Aday", { campaign_id: yksCampaignId });
    const lgsStudentId = await seedStudent("LGS Aday", { campaign_id: lgsCampaignId });
    await testDb.call_logs.bulkAdd([
      callLog(yksStudentId, { call_result: "registered" }),
      callLog(yksStudentId, { call_result: "appointment" }),
      callLog(lgsStudentId, { call_result: "not_reached" }),
    ]);

    const summary = await readReportingV2Summary({ fromDate: "2026-05-10", toDate: "2026-05-10", database: testDb });
    const yksRow = summary.byCampaign.find((row) => row.campaignName === "YKS Kampanyasi");
    const lgsRow = summary.byCampaign.find((row) => row.campaignName === "LGS Kampanyasi");

    expect(yksRow).toMatchObject({ totalCallLogs: 2, uniqueStudentsWithCallLogs: 1 });
    expect(yksRow?.byCallResult.find((row) => row.callResult === "registered")?.count).toBe(1);
    expect(lgsRow?.byCallResult.find((row) => row.callResult === "not_reached")?.count).toBe(1);
  });

  it("groups students without a campaign under the default campaign label", async () => {
    const testDb = await createDatabase();
    const studentId = await seedStudent("Kampanyasiz Aday", { campaign_id: null });
    await testDb.call_logs.add(callLog(studentId));

    const summary = await readReportingV2Summary({ fromDate: "2026-05-10", toDate: "2026-05-10", database: testDb });

    expect(summary.byCampaign).toContainEqual(expect.objectContaining({ campaignId: null, campaignName: "Diğer" }));
  });

  it("uses a legacy campaign fallback when the student's campaign is missing or inactive", async () => {
    const testDb = await createDatabase();
    const deletedCampaignId = await seedCampaign("Silinmis Kampanya", {
      is_active: false,
      deleted_at: "2026-05-10T11:00:00.000",
    });
    const studentId = await seedStudent("Eski Kampanya Aday", { campaign_id: deletedCampaignId });
    await testDb.call_logs.add(callLog(studentId));

    const summary = await readReportingV2Summary({ fromDate: "2026-05-10", toDate: "2026-05-10", database: testDb });

    expect(summary.byCampaign).toContainEqual(
      expect.objectContaining({ campaignId: deletedCampaignId, campaignName: "Kampanyasız / Eski kampanya" })
    );
  });

  it("keeps null phone-context call logs in the summary", async () => {
    const testDb = await createDatabase();
    const studentId = await seedStudent("Telefonsuz Context");
    await testDb.call_logs.add(
      callLog(studentId, {
        phone_id: null,
        contacted_phone_id: null,
        contacted_phone_number: null,
        phone_snapshot: null,
        call_result: "wrong_number",
      })
    );

    const summary = await readReportingV2Summary({ fromDate: "2026-05-10", toDate: "2026-05-10", database: testDb });

    expect(summary.totals.totalCallLogs).toBe(1);
    expect(summary.totals.wrongNumber).toBe(1);
  });

  it("tracks registered and appointment result totals separately", async () => {
    const testDb = await createDatabase();
    const studentId = await seedStudent("Randevu Kayit");
    await testDb.call_logs.bulkAdd([
      callLog(studentId, { call_result: "appointment" }),
      callLog(studentId, { call_result: "registered" }),
    ]);

    const summary = await readReportingV2Summary({ fromDate: "2026-05-10", toDate: "2026-05-10", database: testDb });

    expect(summary.totals.appointmentResults).toBe(1);
    expect(summary.totals.registeredResults).toBe(1);
  });

  it("counts unique students separately from total call logs", async () => {
    const testDb = await createDatabase();
    const firstStudentId = await seedStudent("Tekil Bir");
    const secondStudentId = await seedStudent("Tekil Iki");
    await testDb.call_logs.bulkAdd([
      callLog(firstStudentId, { call_result: "reached" as CallResult }),
      callLog(firstStudentId, { call_time: "2026-05-10T11:00:00.000", call_result: "not_reached" as CallResult }),
      callLog(secondStudentId, { call_result: "registered" as CallResult }),
    ]);

    const summary = await readReportingV2Summary({ fromDate: "2026-05-10", toDate: "2026-05-10", database: testDb });

    expect(summary.totals.totalCallLogs).toBe(3);
    expect(summary.totals.uniqueStudentsWithCallLogs).toBe(2);
  });
});

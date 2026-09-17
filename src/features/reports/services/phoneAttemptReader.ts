import type { AppDatabase } from "../../../db/db";
import { db } from "../../../db/db";
import type { CampaignRecord } from "../../../domain/models/campaign";
import { parsePhoneAttemptEvent, type PhoneAttemptEvent } from "./phoneAttemptContract";

export type PhoneAttemptDateRange = {
  start: string;
  end: string;
};

export type PhoneAttemptMetrics = {
  attemptedStudents: number;
  contactedStudents: number;
  uncontactedStudents: number;
  contactRate: number | null;
  averageHealthyAttempts: number | null;
  averageFailedDistinct: number | null;
  firstPhoneRate: number | null;
  withinFirstThreeRate: number | null;
  fourPlusRate: number | null;
};

export type PhoneAttemptCampaignMetrics = PhoneAttemptMetrics & {
  campaign_id: number | null;
  campaign_name: string;
};

export type PhoneAttemptEfficiency = PhoneAttemptMetrics & {
  events: PhoneAttemptEvent[];
  byCampaign: PhoneAttemptCampaignMetrics[];
};

type Sequence = {
  key: string;
  events: PhoneAttemptEvent[];
};

function sortEvents(events: PhoneAttemptEvent[]): PhoneAttemptEvent[] {
  return [...events].sort((left, right) => {
    const byTime = left.occurred_at.localeCompare(right.occurred_at);
    if (byTime !== 0) {
      return byTime;
    }

    return (left.id ?? 0) - (right.id ?? 0);
  });
}

function sequenceMetrics(sequences: Sequence[]): PhoneAttemptMetrics {
  const attemptedStudents = sequences.length;
  const contactedSequences = sequences.filter((sequence) =>
    sequence.events.some((event) => event.contact_established)
  );
  const contactedStudents = contactedSequences.length;
  const healthyCounts = contactedSequences.map((sequence) => {
    const ordered = sortEvents(sequence.events);
    const firstContactIndex = ordered.findIndex((event) => event.contact_established);
    return new Set(ordered.slice(0, firstContactIndex + 1).map((event) => event.phone_id)).size;
  });

  const average = (values: number[]): number | null =>
    values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0) / values.length;
  const ratio = (numerator: number): number | null => (attemptedStudents === 0 ? null : numerator / attemptedStudents);

  return {
    attemptedStudents,
    contactedStudents,
    uncontactedStudents: attemptedStudents - contactedStudents,
    contactRate: attemptedStudents === 0 ? null : contactedStudents / attemptedStudents,
    averageHealthyAttempts: average(healthyCounts),
    averageFailedDistinct: average(healthyCounts.map((count) => count - 1)),
    firstPhoneRate: ratio(healthyCounts.filter((count) => count === 1).length),
    withinFirstThreeRate: ratio(healthyCounts.filter((count) => count <= 3).length),
    fourPlusRate: ratio(healthyCounts.filter((count) => count >= 4).length)
  };
}

function groupByStudent(events: PhoneAttemptEvent[]): Sequence[] {
  const grouped = new Map<number, PhoneAttemptEvent[]>();
  for (const event of events) {
    const current = grouped.get(event.student_id) ?? [];
    current.push(event);
    grouped.set(event.student_id, current);
  }

  return [...grouped.entries()].map(([studentId, studentEvents]) => ({
    key: String(studentId),
    events: studentEvents
  }));
}

function groupByStudentAndCampaign(events: PhoneAttemptEvent[]): Sequence[] {
  const grouped = new Map<string, PhoneAttemptEvent[]>();
  for (const event of events) {
    const key = `${event.student_id}:${event.campaign_id_at_attempt ?? "null"}`;
    const current = grouped.get(key) ?? [];
    current.push(event);
    grouped.set(key, current);
  }

  return [...grouped.entries()].map(([key, sequenceEvents]) => ({ key, events: sequenceEvents }));
}

function campaignIdForSequence(sequence: Sequence): number | null {
  return sequence.events[0]?.campaign_id_at_attempt ?? null;
}

function groupSequencesByCampaign(sequences: Sequence[]): Array<{ campaign_id: number | null; sequences: Sequence[] }> {
  const grouped = new Map<string, { campaign_id: number | null; sequences: Sequence[] }>();
  for (const sequence of sequences) {
    const campaignId = campaignIdForSequence(sequence);
    const key = campaignId === null ? "null" : String(campaignId);
    const current = grouped.get(key) ?? { campaign_id: campaignId, sequences: [] };
    current.sequences.push(sequence);
    grouped.set(key, current);
  }

  return [...grouped.values()];
}

export async function readPhoneAttemptEvents(
  range: PhoneAttemptDateRange,
  database: AppDatabase = db
): Promise<PhoneAttemptEvent[]> {
  const records = await database.audit_logs.where("created_at").between(range.start, range.end, true, true).toArray();
  return sortEvents(records.map(parsePhoneAttemptEvent).filter((event): event is PhoneAttemptEvent => event !== null));
}

export async function readFirstPhoneAttemptAt(database: AppDatabase = db): Promise<string | null> {
  const first = await database.audit_logs
    .orderBy("created_at")
    .filter((record) => parsePhoneAttemptEvent(record) !== null)
    .first();
  return first?.created_at ?? null;
}

export async function readPhoneAttemptEfficiency(
  range: PhoneAttemptDateRange,
  database: AppDatabase = db
): Promise<PhoneAttemptEfficiency> {
  const events = await readPhoneAttemptEvents(range, database);
  const campaignSequences = groupByStudentAndCampaign(events);
  const campaignIds = [...new Set(campaignSequences.map(campaignIdForSequence).filter((id): id is number => id !== null))];
  const campaigns = await database.campaigns.bulkGet(campaignIds);
  const campaignById = new Map<number, CampaignRecord>();
  campaigns.forEach((campaign) => {
    if (campaign?.id) {
      campaignById.set(campaign.id, campaign);
    }
  });

  const byCampaign = groupSequencesByCampaign(campaignSequences).map((group) => {
    const campaignId = group.campaign_id;
    return {
      ...sequenceMetrics(group.sequences),
      campaign_id: campaignId,
      campaign_name: campaignId === null
        ? "Kampanyasız / Eski kampanya"
        : campaignById.get(campaignId)?.name ?? "Kampanyasız / Eski kampanya"
    };
  });

  return {
    ...sequenceMetrics(groupByStudent(events)),
    events,
    byCampaign
  };
}

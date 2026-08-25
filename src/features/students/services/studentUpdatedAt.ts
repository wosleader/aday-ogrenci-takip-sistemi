import { nowIso } from "../../../utils/dateTime";

export function createNextStudentUpdatedAt(currentUpdatedAt: string): string {
  const currentTimestamp = new Date(currentUpdatedAt).getTime();
  const nowTimestamp = new Date(nowIso()).getTime();

  return new Date(Math.max(nowTimestamp, currentTimestamp + 1)).toISOString();
}

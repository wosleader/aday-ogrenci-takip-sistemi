import { createLocalDayRange, type LocalDayRange } from "./dailyReportReader";

export type DashboardDateRange = LocalDayRange & {
  fromDate: string;
  toDate: string;
  dayCount: number;
};

function countCalendarDays(start: Date, end: Date): number {
  const cursor = new Date(start);
  let count = 0;

  while (cursor.getTime() <= end.getTime()) {
    count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }

  return count;
}

function createRange(start: LocalDayRange, end: LocalDayRange): DashboardDateRange {
  return {
    date_input_value: start.date_input_value,
    start: start.start,
    end: end.end,
    start_iso: start.start_iso,
    end_iso: end.end_iso,
    fromDate: start.date_input_value,
    toDate: end.date_input_value,
    dayCount: countCalendarDays(start.start, end.start)
  };
}

export function normalizeDashboardDateRange(fromDate: string, toDate: string): DashboardDateRange {
  const from = createLocalDayRange(fromDate);
  const to = createLocalDayRange(toDate);

  return from.start.getTime() <= to.start.getTime() ? createRange(from, to) : createRange(to, from);
}

export function createPreviousDashboardDateRange(range: DashboardDateRange): DashboardDateRange {
  const previousEnd = new Date(range.start);
  previousEnd.setDate(previousEnd.getDate() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousStart.getDate() - range.dayCount + 1);

  return createRange(createLocalDayRange(previousStart), createLocalDayRange(previousEnd));
}

export function getDashboardRangeDates(range: DashboardDateRange): string[] {
  const dates: string[] = [];
  const cursor = new Date(range.start);

  while (cursor.getTime() <= range.end.getTime()) {
    dates.push(createLocalDayRange(cursor).date_input_value);
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

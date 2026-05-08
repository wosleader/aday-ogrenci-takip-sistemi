export type ReminderDateNormalization = {
  reminder_at?: string;
  default_time_assigned: boolean;
  outside_call_hours: boolean;
};

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function normalizeDatePart(value: Date): string {
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

function normalizeStringDate(value: string): { datePart: string; timePart?: string } | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const isoLike = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[T\s]+(\d{1,2}):(\d{2}))?/);

  if (isoLike) {
    return {
      datePart: `${isoLike[1]}-${pad(Number(isoLike[2]))}-${pad(Number(isoLike[3]))}`,
      timePart: isoLike[4] ? `${pad(Number(isoLike[4]))}:${isoLike[5]}` : undefined
    };
  }

  const localDate = trimmed.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);

  if (localDate) {
    return {
      datePart: `${localDate[3]}-${pad(Number(localDate[2]))}-${pad(Number(localDate[1]))}`,
      timePart: localDate[4] ? `${pad(Number(localDate[4]))}:${localDate[5]}` : undefined
    };
  }

  return null;
}

function isOutsideCallHours(time: string, start: string, end: string): boolean {
  return time < start || time > end;
}

export function normalizeReminderDate(
  value: unknown,
  defaultReminderTime: string,
  callStartTime: string,
  callEndTime: string
): ReminderDateNormalization {
  let datePart: string | undefined;
  let timePart: string | undefined;

  if (value instanceof Date) {
    datePart = normalizeDatePart(value);
    timePart = `${pad(value.getHours())}:${pad(value.getMinutes())}`;
  } else if (typeof value === "string") {
    const parsed = normalizeStringDate(value);
    datePart = parsed?.datePart;
    timePart = parsed?.timePart;
  }

  if (!datePart) {
    return {
      default_time_assigned: false,
      outside_call_hours: false
    };
  }

  const default_time_assigned = !timePart;
  const effectiveTime = timePart ?? defaultReminderTime;

  return {
    reminder_at: `${datePart}T${effectiveTime}:00`,
    default_time_assigned,
    outside_call_hours: isOutsideCallHours(effectiveTime, callStartTime, callEndTime)
  };
}

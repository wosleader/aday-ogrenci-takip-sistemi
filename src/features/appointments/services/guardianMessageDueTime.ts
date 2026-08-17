const ISTANBUL_TIME_ZONE = "Europe/Istanbul";

type IstanbulDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const istanbulFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: ISTANBUL_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23"
});

function parseIsoInstant(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value)) {
    throw new Error("Randevu tarihi/saat bilgisi geçersiz.");
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Randevu tarihi/saat bilgisi geçersiz.");
  }

  return date;
}

function getIstanbulParts(date: Date): IstanbulDateTimeParts {
  const values = Object.fromEntries(
    istanbulFormatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)])
  );

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second
  };
}

/**
 * Converts a persisted appointment instant into the business-timezone values
 * required by the appointment management form. Both values must come from the
 * same Europe/Istanbul conversion so an edit cannot move the appointment date.
 */
export function getIstanbulAppointmentInputValues(appointmentAt: string): { dateValue: string; timeValue: string } {
  const parts = getIstanbulParts(parseIsoInstant(appointmentAt));
  const pad = (value: number) => String(value).padStart(2, "0");

  return {
    dateValue: `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`,
    timeValue: `${pad(parts.hour)}:${pad(parts.minute)}`
  };
}

function sameIstanbulDateTime(left: IstanbulDateTimeParts, right: IstanbulDateTimeParts): boolean {
  return (
    left.year === right.year &&
    left.month === right.month &&
    left.day === right.day &&
    left.hour === right.hour &&
    left.minute === right.minute &&
    left.second === right.second
  );
}

function istanbulDateTimeToInstant(parts: IstanbulDateTimeParts): Date {
  const requestedAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  let candidate = requestedAsUtc;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const candidateDate = new Date(candidate);
    const formatted = getIstanbulParts(candidateDate);
    const formattedAsUtc = Date.UTC(
      formatted.year,
      formatted.month - 1,
      formatted.day,
      formatted.hour,
      formatted.minute,
      formatted.second
    );
    candidate = requestedAsUtc - (formattedAsUtc - candidate);
  }

  const resolved = new Date(candidate);

  if (!sameIstanbulDateTime(getIstanbulParts(resolved), parts)) {
    throw new Error("Randevu tarihi/saat bilgisi geçersiz.");
  }

  return resolved;
}

export function createIstanbulAppointmentAt(dateValue: string, timeValue: string): string {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue.trim());
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeValue.trim());

  if (!dateMatch || !timeMatch) {
    throw new Error("Randevu tarihi/saat bilgisi geçersiz.");
  }

  const parts: IstanbulDateTimeParts = {
    year: Number(dateMatch[1]),
    month: Number(dateMatch[2]),
    day: Number(dateMatch[3]),
    hour: Number(timeMatch[1]),
    minute: Number(timeMatch[2]),
    second: 0
  };

  if (
    parts.month < 1 ||
    parts.month > 12 ||
    parts.day < 1 ||
    parts.day > 31 ||
    parts.hour > 23 ||
    parts.minute > 59
  ) {
    throw new Error("Randevu tarihi/saat bilgisi geçersiz.");
  }

  return istanbulDateTimeToInstant(parts).toISOString();
}

export function assertFutureAppointmentAt(
  appointmentAt: string,
  now: string = new Date().toISOString()
): string {
  const appointmentDate = parseIsoInstant(appointmentAt);
  const nowDate = parseIsoInstant(now);

  if (appointmentDate.getTime() <= nowDate.getTime()) {
    throw new Error("Randevu tarihi/saat bilgisi gelecekte olmalıdır.");
  }

  return appointmentAt;
}

export type GuardianMessageDueTime = {
  dueAt: string;
  isDue: boolean;
};

export function calculateGuardianMessageDueTime(
  appointmentAt: string,
  now: string = new Date().toISOString()
): GuardianMessageDueTime {
  const appointmentDate = parseIsoInstant(appointmentAt);
  const nowDate = parseIsoInstant(now);
  const appointmentParts = getIstanbulParts(appointmentDate);
  const leadTimeHours = appointmentParts.hour < 12 ? 24 : 22;
  let dueDate = new Date(appointmentDate.getTime() - leadTimeHours * 60 * 60 * 1000);
  const dueParts = getIstanbulParts(dueDate);

  if (dueParts.hour > 19 || (dueParts.hour === 19 && (dueParts.minute > 0 || dueParts.second > 0))) {
    dueDate = istanbulDateTimeToInstant({ ...dueParts, hour: 19, minute: 0, second: 0 });
  }

  return {
    dueAt: dueDate.toISOString(),
    isDue: dueDate.getTime() <= nowDate.getTime()
  };
}

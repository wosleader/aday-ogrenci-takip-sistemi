export function nowIso(): string {
  return new Date().toISOString();
}

export function mergeDateWithDefaultTime(dateValue: string, defaultTime: string): string {
  const trimmed = dateValue.trim();

  if (/\d{1,2}:\d{2}/.test(trimmed)) {
    return new Date(trimmed).toISOString();
  }

  return new Date(`${trimmed}T${defaultTime}:00`).toISOString();
}

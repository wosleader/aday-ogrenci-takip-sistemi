export const DASHBOARD_DEFAULT_RANGE_KEY = "aday.dashboard.defaultRange.v1";
export const DASHBOARD_DEFAULT_RANGE_MIN = 1;
export const DASHBOARD_DEFAULT_RANGE_DEFAULT = 7;
export const DASHBOARD_DEFAULT_RANGE_MAX = 30;

function isValidDashboardRange(value: number): boolean {
  return Number.isInteger(value) && value >= DASHBOARD_DEFAULT_RANGE_MIN && value <= DASHBOARD_DEFAULT_RANGE_MAX;
}

export function readDashboardDefaultRange(storage: Storage = window.localStorage): number {
  const raw = storage.getItem(DASHBOARD_DEFAULT_RANGE_KEY);
  if (raw === null) {
    return DASHBOARD_DEFAULT_RANGE_DEFAULT;
  }

  const value = Number(raw);
  return isValidDashboardRange(value) ? value : DASHBOARD_DEFAULT_RANGE_DEFAULT;
}

export function writeDashboardDefaultRange(value: number, storage: Storage = window.localStorage): boolean {
  if (!isValidDashboardRange(value)) {
    return false;
  }

  storage.setItem(DASHBOARD_DEFAULT_RANGE_KEY, String(value));
  return true;
}

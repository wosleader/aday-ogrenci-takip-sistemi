import { beforeEach, describe, expect, it } from "vitest";
import {
  DASHBOARD_DEFAULT_RANGE_KEY,
  readDashboardDefaultRange,
  writeDashboardDefaultRange
} from "../../src/features/reports/services/dashboardPreferences";

describe("dashboardPreferences", () => {
  beforeEach(() => {
    window.localStorage.removeItem(DASHBOARD_DEFAULT_RANGE_KEY);
  });

  it("uses seven days by default and persists valid integer ranges", () => {
    expect(readDashboardDefaultRange()).toBe(7);
    expect(writeDashboardDefaultRange(30)).toBe(true);
    expect(readDashboardDefaultRange()).toBe(30);
    expect(writeDashboardDefaultRange(1)).toBe(true);
    expect(readDashboardDefaultRange()).toBe(1);
  });

  it("rejects malformed, decimal, and out-of-range values", () => {
    for (const value of ["", "0", "31", "1.5", "not-a-number"]) {
      window.localStorage.setItem(DASHBOARD_DEFAULT_RANGE_KEY, value);
      expect(readDashboardDefaultRange()).toBe(7);
    }

    expect(writeDashboardDefaultRange(0)).toBe(false);
    expect(writeDashboardDefaultRange(1.5)).toBe(false);
    expect(writeDashboardDefaultRange(31)).toBe(false);
    expect(readDashboardDefaultRange()).toBe(7);
  });
});

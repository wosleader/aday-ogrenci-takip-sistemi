import { describe, expect, it } from "vitest";
import {
  createPreviousDashboardDateRange,
  getDashboardRangeDates,
  normalizeDashboardDateRange
} from "../../src/features/reports/services/dashboardDateRange";

describe("dashboardDateRange", () => {
  it("normalizes reversed inclusive ranges and creates an equal previous period", () => {
    const range = normalizeDashboardDateRange("2026-05-16", "2026-05-10");
    const previous = createPreviousDashboardDateRange(range);

    expect(range.fromDate).toBe("2026-05-10");
    expect(range.toDate).toBe("2026-05-16");
    expect(range.dayCount).toBe(7);
    expect(previous.fromDate).toBe("2026-05-03");
    expect(previous.toDate).toBe("2026-05-09");
    expect(getDashboardRangeDates(range)).toHaveLength(7);
    expect(getDashboardRangeDates(previous)).toHaveLength(7);
    expect(getDashboardRangeDates(range)).not.toContain("2026-05-09");
  });
});

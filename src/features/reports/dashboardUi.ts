export const DASHBOARD_WIDGET_KEYS = [
  "overview",
  "distribution",
  "dailyTrend",
  "campaignPerformance",
  "reminderHealth",
  "appointmentLifecycle",
  "attention",
  "contactEfficiency",
  "campaignContactEfficiency"
] as const;

export type DashboardWidgetKey = (typeof DASHBOARD_WIDGET_KEYS)[number];
export type DashboardWidgetVisibility = Record<DashboardWidgetKey, boolean>;

export const DASHBOARD_WIDGET_LABELS: Record<DashboardWidgetKey, string> = {
  overview: "Genel KPI",
  distribution: "Görüşme Sonucu Dağılımı",
  dailyTrend: "Günlük Trend",
  campaignPerformance: "Kampanya Performansı",
  reminderHealth: "Hatırlatma Sağlığı",
  appointmentLifecycle: "Randevu Durumu",
  attention: "Yönetici Dikkat Alanları",
  contactEfficiency: "Temas Verimliliği",
  campaignContactEfficiency: "Kampanya Bazlı Temas Verimliliği"
};

export const DEFAULT_DASHBOARD_WIDGET_VISIBILITY: DashboardWidgetVisibility = {
  overview: true,
  distribution: true,
  dailyTrend: true,
  campaignPerformance: true,
  reminderHealth: true,
  appointmentLifecycle: true,
  attention: true,
  contactEfficiency: true,
  campaignContactEfficiency: true
};

const DASHBOARD_WIDGETS_STORAGE_KEY = "aday.dashboard.widgets.v1";

export function readDashboardWidgetVisibility(storage: Storage = window.localStorage): DashboardWidgetVisibility {
  try {
    const raw = storage.getItem(DASHBOARD_WIDGETS_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_DASHBOARD_WIDGET_VISIBILITY };
    }

    const parsed = JSON.parse(raw) as Partial<DashboardWidgetVisibility>;
    return DASHBOARD_WIDGET_KEYS.reduce(
      (visibility, key) => {
        visibility[key] = typeof parsed[key] === "boolean" ? parsed[key]! : DEFAULT_DASHBOARD_WIDGET_VISIBILITY[key];
        return visibility;
      },
      {} as DashboardWidgetVisibility
    );
  } catch {
    return { ...DEFAULT_DASHBOARD_WIDGET_VISIBILITY };
  }
}

export function writeDashboardWidgetVisibility(
  visibility: DashboardWidgetVisibility,
  storage: Storage = window.localStorage
): void {
  storage.setItem(DASHBOARD_WIDGETS_STORAGE_KEY, JSON.stringify(visibility));
}

export function resetDashboardWidgetVisibility(storage: Storage = window.localStorage): DashboardWidgetVisibility {
  const defaults = { ...DEFAULT_DASHBOARD_WIDGET_VISIBILITY };
  writeDashboardWidgetVisibility(defaults, storage);
  return defaults;
}

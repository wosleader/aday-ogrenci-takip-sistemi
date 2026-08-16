import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OperationalAlertItem } from "../../src/features/reminders/services/operationalAlertReader";
import { OperationalAlertHost } from "../../src/features/reminders/OperationalAlertHost";
import { readDismissedReminderSummaries } from "../../src/features/reminders/services/reminderDismissalStore";

const mocks = vi.hoisted(() => ({
  readDueOperationalAlerts: vi.fn(),
  readReminderNotificationSettings: vi.fn()
}));

vi.mock("dexie-react-hooks", async () => {
  const React = await import("react");

  return {
    useLiveQuery: (querier: () => unknown | Promise<unknown>, dependencies: React.DependencyList, defaultValue: unknown) => {
      const [value, setValue] = React.useState(defaultValue);

      React.useEffect(() => {
        let isActive = true;

        void Promise.resolve(querier()).then((nextValue) => {
          if (isActive) {
            setValue(nextValue);
          }
        });

        return () => {
          isActive = false;
        };
      }, dependencies);

      return value;
    }
  };
});

vi.mock("../../src/features/reminders/services/operationalAlertReader", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/features/reminders/services/operationalAlertReader")>();

  return { ...actual, readDueOperationalAlerts: mocks.readDueOperationalAlerts };
});

vi.mock("../../src/features/reminders/services/reminderSettings", () => ({
  readReminderNotificationSettings: mocks.readReminderNotificationSettings
}));

const timestamp = "2026-05-10T08:00:00.000Z";

function alert(overrides: Partial<OperationalAlertItem> = {}): OperationalAlertItem {
  return {
    identity: "1|2026-05-10T11:00:00.000Z",
    kind: "call_reminder",
    source_type: "reminder",
    source_id: 1,
    student_id: 1,
    student_full_name: "ZEYNEP SUBAŞI",
    guardian_full_name: "FATMA SUBAŞI",
    due_at: "2026-05-10T11:00:00.000Z",
    title: "Arama hatırlatması",
    note: "Tekrar aranacak",
    bucket: "overdue",
    bucket_label: "Süresi geçti",
    due_date_label: "10.05.2026",
    due_time_label: "11:00",
    phone_1: "05321112233",
    phone_2: null,
    phone_context_label: null,
    phone_context_number: null,
    last_call_result: "not_called",
    last_call_result_label: "Aranmadı",
    note_preview: "Tekrar aranacak",
    ...overrides
  };
}

function installAudioContextStub() {
  const audioContextConstructor = vi.fn(function AudioContextStub() {
    return {
    createGain: () => ({
      connect: vi.fn(),
      gain: {
        exponentialRampToValueAtTime: vi.fn(),
        setValueAtTime: vi.fn()
      }
    }),
    createOscillator: () => ({
      connect: vi.fn(),
      frequency: { setValueAtTime: vi.fn() },
      start: vi.fn(),
      stop: vi.fn(),
      type: "sine"
    }),
    currentTime: 0,
    destination: {}
    };
  });

  Object.defineProperty(window, "AudioContext", { configurable: true, value: audioContextConstructor });

  return audioContextConstructor;
}

async function advanceOperationalPolling() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(30_000);
  });
  await flushOperationalHost();
}

async function flushOperationalHost() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("OperationalAlertHost", () => {
  const originalAudioContext = window.AudioContext;

  beforeEach(() => {
    window.localStorage.clear();
    mocks.readDueOperationalAlerts.mockReset();
    mocks.readReminderNotificationSettings.mockReset();
    mocks.readReminderNotificationSettings.mockResolvedValue({ popup_enabled: true, sound_enabled: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    window.localStorage.clear();

    if (originalAudioContext) {
      Object.defineProperty(window, "AudioContext", { configurable: true, value: originalAudioContext });
    } else {
      Reflect.deleteProperty(window, "AudioContext");
    }
  });

  it("reads and shows an alert during the initial global poll, then opens the linked student", async () => {
    const dueAlerts = [alert()];
    const openStudentById = vi.fn();
    mocks.readDueOperationalAlerts.mockResolvedValue(dueAlerts);
    render(<OperationalAlertHost openStudentById={openStudentById} />);

    await flushOperationalHost();

    expect(screen.getByRole("status", { name: "Operasyon bildirimi" })).toBeInTheDocument();
    expect(mocks.readDueOperationalAlerts).toHaveBeenCalled();
    expect(screen.getByText("Tekrar arama zamanı geldi")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Adayı Aç" }));

    expect(openStudentById).toHaveBeenCalledWith(dueAlerts[0].student_id);
    expect(screen.queryByRole("status", { name: "Operasyon bildirimi" })).not.toBeInTheDocument();
  });

  it("polls every 30 seconds and stops polling after unmount", async () => {
    vi.useFakeTimers();
    mocks.readDueOperationalAlerts.mockResolvedValue([alert()]);
    const view = render(<OperationalAlertHost openStudentById={vi.fn()} />);

    await flushOperationalHost();
    expect(screen.getByRole("status", { name: "Operasyon bildirimi" })).toBeInTheDocument();
    const initialReadCount = mocks.readDueOperationalAlerts.mock.calls.length;

    await advanceOperationalPolling();
    expect(mocks.readDueOperationalAlerts.mock.calls.length).toBeGreaterThan(initialReadCount);

    view.unmount();
    const readsBeforeUnmountedInterval = mocks.readDueOperationalAlerts.mock.calls.length;
    await advanceOperationalPolling();

    expect(mocks.readDueOperationalAlerts).toHaveBeenCalledTimes(readsBeforeUnmountedInterval);
  });

  it("plays one chime for the same identity across successive polls", async () => {
    vi.useFakeTimers();
    const audioContextConstructor = installAudioContextStub();
    mocks.readDueOperationalAlerts.mockResolvedValue([alert()]);
    render(<OperationalAlertHost openStudentById={vi.fn()} />);

    await flushOperationalHost();
    expect(screen.getByRole("status", { name: "Operasyon bildirimi" })).toBeInTheDocument();
    expect(audioContextConstructor).toHaveBeenCalledTimes(1);

    await advanceOperationalPolling();

    expect(mocks.readDueOperationalAlerts.mock.calls.length).toBeGreaterThan(1);
    expect(audioContextConstructor).toHaveBeenCalledTimes(1);
  });

  it("plays one additional chime only when a new identity is added", async () => {
    vi.useFakeTimers();
    const audioContextConstructor = installAudioContextStub();
    const firstAlert = alert();
    const secondAlert = alert({
      identity: "2|2026-05-10T11:05:00.000Z",
      source_id: 2,
      student_id: 2,
      student_full_name: "MERT ASLAN",
      due_at: "2026-05-10T11:05:00.000Z"
    });
    let dueAlerts = [firstAlert];
    mocks.readDueOperationalAlerts.mockImplementation(() => Promise.resolve(dueAlerts));
    render(<OperationalAlertHost openStudentById={vi.fn()} />);

    await flushOperationalHost();
    expect(screen.getByRole("status", { name: "Operasyon bildirimi" })).toBeInTheDocument();
    expect(audioContextConstructor).toHaveBeenCalledTimes(1);

    dueAlerts = [firstAlert, secondAlert];
    await advanceOperationalPolling();

    expect(audioContextConstructor).toHaveBeenCalledTimes(2);
    expect(screen.getByText("2 operasyon bildirimi zamanı geldi")).toBeInTheDocument();
  });

  it("does not show or chime a dismissed identity after a later poll", async () => {
    vi.useFakeTimers();
    const audioContextConstructor = installAudioContextStub();
    const dueAlert = alert();
    mocks.readDueOperationalAlerts.mockResolvedValue([dueAlert]);
    render(<OperationalAlertHost openStudentById={vi.fn()} />);

    await flushOperationalHost();
    expect(screen.getByRole("status", { name: "Operasyon bildirimi" })).toBeInTheDocument();
    expect(audioContextConstructor).toHaveBeenCalledTimes(1);
    act(() => {
      screen.getByRole("button", { name: "Bu Bildirimi Kapat" }).click();
    });
    await flushOperationalHost();

    expect(screen.queryByRole("status", { name: "Operasyon bildirimi" })).not.toBeInTheDocument();
    expect(readDismissedReminderSummaries()).toEqual([expect.objectContaining({ dismissal_key: dueAlert.identity })]);

    await advanceOperationalPolling();

    expect(screen.queryByRole("status", { name: "Operasyon bildirimi" })).not.toBeInTheDocument();
    expect(audioContextConstructor).toHaveBeenCalledTimes(1);
  });

  it("treats guardian-message and appointment-start identities as separate chime candidates", async () => {
    vi.useFakeTimers();
    const audioContextConstructor = installAudioContextStub();
    const guardianMessage = alert({
      identity: "appointment_guardian_message|7|1|2026-05-10T11:00:00.000Z",
      kind: "appointment_guardian_message",
      source_type: "appointment",
      source_id: 7,
      title: "Veli mesajı hatırlatması"
    });
    const appointmentStart = alert({
      identity: "appointment_start|7|2026-05-10T11:00:00.000Z",
      kind: "appointment_start",
      source_type: "appointment",
      source_id: 7,
      title: "Randevu zamanı"
    });
    let dueAlerts = [guardianMessage];
    mocks.readDueOperationalAlerts.mockImplementation(() => Promise.resolve(dueAlerts));
    render(<OperationalAlertHost openStudentById={vi.fn()} />);

    await flushOperationalHost();
    expect(screen.getByRole("status", { name: "Operasyon bildirimi" })).toBeInTheDocument();
    expect(audioContextConstructor).toHaveBeenCalledTimes(1);

    dueAlerts = [guardianMessage, appointmentStart];
    await advanceOperationalPolling();

    expect(audioContextConstructor).toHaveBeenCalledTimes(2);
  });

  it("dismisses the active popup with Escape without consuming Escape when no popup exists", async () => {
    vi.useFakeTimers();
    const audioContextConstructor = installAudioContextStub();
    const dueAlert = alert();
    mocks.readDueOperationalAlerts.mockResolvedValue([dueAlert]);
    render(<OperationalAlertHost openStudentById={vi.fn()} />);

    await flushOperationalHost();
    expect(screen.getByRole("status", { name: "Operasyon bildirimi" })).toBeInTheDocument();
    const drawerEscapeHandler = vi.fn();
    window.addEventListener("keydown", drawerEscapeHandler);
    const activeEscape = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" });

    act(() => {
      window.dispatchEvent(activeEscape);
    });
    await flushOperationalHost();

    expect(activeEscape.defaultPrevented).toBe(true);
    expect(drawerEscapeHandler).not.toHaveBeenCalled();
    expect(screen.queryByRole("status", { name: "Operasyon bildirimi" })).not.toBeInTheDocument();
    expect(readDismissedReminderSummaries()).toEqual([expect.objectContaining({ dismissal_key: dueAlert.identity })]);

    await advanceOperationalPolling();
    expect(audioContextConstructor).toHaveBeenCalledTimes(1);

    window.removeEventListener("keydown", drawerEscapeHandler);
    mocks.readDueOperationalAlerts.mockResolvedValue([]);
    await advanceOperationalPolling();
    const inactiveEscape = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" });

    expect(window.dispatchEvent(inactiveEscape)).toBe(true);
    expect(inactiveEscape.defaultPrevented).toBe(false);
  });
});

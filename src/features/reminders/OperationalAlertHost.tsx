import { useLiveQuery } from "dexie-react-hooks";
import { Bell } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  dismissOperationalAlert,
  filterDismissedOperationalAlerts,
  readDueOperationalAlerts
} from "./services/operationalAlertReader";
import {
  persistDismissedOperationalAlert,
  persistDismissedOperationalAlerts,
  readPersistedDismissedReminderKeys,
  writePersistedDismissedReminderKeys
} from "./services/reminderDismissalStore";
import { readReminderNotificationSettings } from "./services/reminderSettings";
import {
  createOperationalAlertPopupViewModel,
  DISMISS_FOLLOWING_REMINDERS_LABEL
} from "./services/reminderPopupViewModel";

const POLL_INTERVAL_MS = 30_000;

function playOperationalAlertChime() {
  try {
    const audioWindow = window as Window &
      typeof globalThis & { webkitAudioContext?: typeof AudioContext };
    const AudioContextClass = audioWindow.AudioContext || audioWindow.webkitAudioContext;

    if (!AudioContextClass) {
      return;
    }

    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(660, context.currentTime);
    oscillator.frequency.setValueAtTime(880, context.currentTime + 0.12);
    gain.gain.setValueAtTime(0.001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.35);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.38);
  } catch (error) {
    console.debug("Operational alert chime could not play.", error);
  }
}

export function OperationalAlertHost({ openStudentById }: { openStudentById: (studentId: number) => void }) {
  const [dismissedKeys, setDismissedKeys] = useState(() => readPersistedDismissedReminderKeys());
  const [chimedAlertIdentities, setChimedAlertIdentities] = useState<string[]>([]);
  const [tick, setTick] = useState(() => Date.now());
  const reminderSettings = useLiveQuery(() => readReminderNotificationSettings(), [], undefined);
  const dueAlerts = useLiveQuery(() => readDueOperationalAlerts(new Date(tick).toISOString()), [tick], []);
  const visibleAlerts = useMemo(
    () => filterDismissedOperationalAlerts(dueAlerts ?? [], dismissedKeys, reminderSettings?.popup_enabled ?? true),
    [dismissedKeys, dueAlerts, reminderSettings?.popup_enabled]
  );
  const activeAlert = visibleAlerts[0];
  const popupView = activeAlert ? createOperationalAlertPopupViewModel(activeAlert, visibleAlerts.length) : null;

  useEffect(() => {
    const intervalId = window.setInterval(() => setTick(Date.now()), POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!activeAlert) {
      return;
    }

    const dismissWithEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      setDismissedKeys((current) => persistDismissedOperationalAlert(current, activeAlert));
    };

    window.addEventListener("keydown", dismissWithEscape, true);

    return () => window.removeEventListener("keydown", dismissWithEscape, true);
  }, [activeAlert]);

  useEffect(() => {
    if (!visibleAlerts.length || !reminderSettings?.sound_enabled) {
      return;
    }

    const visibleIdentities = visibleAlerts.map((alert) => alert.identity);
    const hasNewAlert = visibleIdentities.some((identity) => !chimedAlertIdentities.includes(identity));

    if (hasNewAlert) {
      playOperationalAlertChime();
      setChimedAlertIdentities((current) => [...new Set([...current, ...visibleIdentities])]);
    }
  }, [chimedAlertIdentities, reminderSettings?.sound_enabled, visibleAlerts]);

  function openAlertStudent() {
    if (!activeAlert) {
      return;
    }

    setDismissedKeys((current) => {
      const nextKeys = dismissOperationalAlert(current, activeAlert);
      writePersistedDismissedReminderKeys(nextKeys);

      return nextKeys;
    });
    openStudentById(activeAlert.student_id);
  }

  function dismissActiveAlert() {
    if (!activeAlert) {
      return;
    }

    setDismissedKeys((current) => persistDismissedOperationalAlert(current, activeAlert));
  }

  function dismissAllVisibleAlerts() {
    if (!visibleAlerts.length) {
      return;
    }

    setDismissedKeys((current) => persistDismissedOperationalAlerts(current, visibleAlerts));
  }

  if (!activeAlert || !popupView) {
    return null;
  }

  return (
    <section className="reminder-toast" role="status" aria-label="Operasyon bildirimi">
      <div className="reminder-toast-icon">
        <Bell aria-hidden="true" size={17} />
      </div>
      <div className="reminder-toast-body">
        <strong>{popupView.title}</strong>
        <span>{popupView.student_name}</span>
        {popupView.guardian_line ? <small>{popupView.guardian_line}</small> : null}
        <small>{popupView.due_line}</small>
        {popupView.context_line ? <small title={activeAlert.note ?? undefined}>{popupView.context_line}</small> : null}
      </div>
      <div className="reminder-toast-actions">
        <button onClick={openAlertStudent} type="button">
          Adayı Aç
        </button>
        <button onClick={dismissActiveAlert} type="button">
          Bu Bildirimi Kapat
        </button>
        <button onClick={dismissAllVisibleAlerts} type="button">
          {DISMISS_FOLLOWING_REMINDERS_LABEL}
        </button>
      </div>
    </section>
  );
}

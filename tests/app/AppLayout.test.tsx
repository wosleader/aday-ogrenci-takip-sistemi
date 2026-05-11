import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useOutletContext } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { AppLayout, type AppOutletContext } from "../../src/app/AppLayout";
import {
  markDismissedReminderBadge,
  persistDismissedReminderAlert,
  readDismissedReminderSummaries,
  readDismissedReminderBadge
} from "../../src/features/reminders/services/reminderDismissalStore";
import type { DueReminderAlert } from "../../src/features/reminders/services/reminderAlarmReader";

const alert: DueReminderAlert = {
  reminder_id: 1,
  student_id: 10,
  student_full_name: "ZEYNEP SUBAŞI",
  guardian_full_name: "RAMAZAN SUBAŞI",
  reminder_at: "2026-05-09T11:00:00"
};

function StudentsProbe() {
  const { pendingOpenStudentId } = useOutletContext<AppOutletContext>();

  return <div>Aday: {pendingOpenStudentId ?? "yok"}</div>;
}

function renderLayout() {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<div>İçerik</div>} />
          <Route path="/students" element={<StudentsProbe />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe("AppLayout notifications", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows dismissed reminder details from the bell and clears only the badge", async () => {
    persistDismissedReminderAlert([], alert);
    markDismissedReminderBadge();
    renderLayout();

    const bellButton = screen.getByRole("button", { name: "Bildirimler" });
    expect(bellButton).toHaveClass("has-alert");

    await userEvent.click(bellButton);

    expect(screen.getByText("Kapatılmış hatırlatmalar")).toBeInTheDocument();
    expect(screen.getByText("ZEYNEP SUBAŞI")).toBeInTheDocument();
    expect(screen.getByText("Veli: RAMAZAN SUBAŞI")).toBeInTheDocument();
    expect(screen.getByText("Bildirim kapatıldı")).toBeInTheDocument();
    expect(readDismissedReminderBadge()).toBe(false);
  });

  it("closes the notification panel when clicking outside", async () => {
    persistDismissedReminderAlert([], alert);
    renderLayout();

    await userEvent.click(screen.getByRole("button", { name: "Bildirimler" }));
    expect(screen.getByRole("dialog", { name: /hatırlatmalar/i })).toBeInTheDocument();

    await userEvent.click(document.body);

    expect(screen.queryByRole("dialog", { name: /hatırlatmalar/i })).not.toBeInTheDocument();
  });

  it("removes one notification panel summary", async () => {
    persistDismissedReminderAlert([], alert);
    renderLayout();

    await userEvent.click(screen.getByRole("button", { name: "Bildirimler" }));
    await userEvent.click(screen.getByRole("button", { name: /panelden/ }));

    expect(readDismissedReminderSummaries()).toEqual([]);
  });

  it("clears all notification panel summaries", async () => {
    persistDismissedReminderAlert([], alert);
    renderLayout();

    await userEvent.click(screen.getByRole("button", { name: "Bildirimler" }));
    await userEvent.click(screen.getByRole("button", { name: "Hepsini temizle" }));

    expect(readDismissedReminderSummaries()).toEqual([]);
  });

  it("opens the student route from a dismissed reminder name", async () => {
    persistDismissedReminderAlert([], alert);
    renderLayout();

    await userEvent.click(screen.getByRole("button", { name: "Bildirimler" }));
    await userEvent.click(screen.getByRole("button", { name: alert.student_full_name }));

    expect(screen.getByText("Aday: 10")).toBeInTheDocument();
  });

  it("shows only the first 10 dismissed reminders in the panel", async () => {
    let keys: string[] = [];

    for (let index = 1; index <= 12; index += 1) {
      keys = persistDismissedReminderAlert(keys, {
        ...alert,
        reminder_id: index,
        student_id: index,
        student_full_name: `Aday ${index}`,
        reminder_at: `2026-05-09T11:${String(index).padStart(2, "0")}:00`
      });
    }

    renderLayout();
    await userEvent.click(screen.getByRole("button", { name: "Bildirimler" }));

    expect(screen.getByText("Son 10 bildirim gÃ¶steriliyor.")).toBeInTheDocument();
    expect(screen.getByText("Aday 12")).toBeInTheDocument();
    expect(screen.queryByText("Aday 2")).not.toBeInTheDocument();
  });
});

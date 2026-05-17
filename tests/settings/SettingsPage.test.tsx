import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { TABLE_NAMES } from "../../src/db/backup";
import { db } from "../../src/db/db";
import { SettingsPage } from "../../src/features/settings/SettingsPage";
import { RESTORE_SYSTEM_BACKUP_CONFIRMATION } from "../../src/features/settings/services/dataManagement";

function createEmptyBackupJson() {
  return JSON.stringify({
    metadata: {
      app_name: "Aday Öğrenci Takip Sistemi",
      backup_type: "full_system_backup",
      backup_version: 1,
      app_version: "0.1.0",
      app_schema_version: 1,
      created_at: "2026-05-17T10:00:00.000Z",
      counts: Object.fromEntries(TABLE_NAMES.map((tableName) => [tableName, 0]))
    },
    tables: Object.fromEntries(TABLE_NAMES.map((tableName) => [tableName, []]))
  });
}

function getRestoreFileInput(): HTMLInputElement {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]');
  expect(input).not.toBeNull();
  return input as HTMLInputElement;
}

describe("SettingsPage", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  afterEach(async () => {
    await db.delete();
  });

  it("shows settings sections behind top tabs", async () => {
    render(<SettingsPage />);

    expect(screen.getByRole("tab", { name: "Genel" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText(/Bu bölüm uygulamanın genel çalışma tercihleri için ayrıldı/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "Klavye Kısayolları" }));

    expect(screen.getByRole("tab", { name: "Klavye Kısayolları" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Arama operasyonunda kullanılan kısayolları buradan değiştirebilirsiniz.")).toBeInTheDocument();
    expect(screen.getByText("Aynı kısayol birden fazla işleme atanamaz.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "Hatırlatmalar" }));

    expect(screen.getByRole("tab", { name: "Hatırlatmalar" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Bildirimler / Hatırlatmalar")).toBeInTheDocument();
    expect(screen.getByText("Ekran içi hatırlatma uyarıları")).toBeInTheDocument();
    expect(screen.getByText("Hatırlatma sesi")).toBeInTheDocument();
    expect(screen.queryByText(/Reminder/i)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "Veri Yönetimi" }));

    expect(screen.getByRole("tab", { name: "Veri Yönetimi" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Tam Sistem Yedeği Al")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sistem Yedeğinden Geri Yükle" })).toBeEnabled();
    expect(screen.queryByText(/JSON yedek/i)).not.toBeInTheDocument();
  });

  it("shows visible shortcut validation messages", async () => {
    render(<SettingsPage />);
    await userEvent.click(screen.getByRole("tab", { name: "Klavye Kısayolları" }));

    const phoneOneRow = screen.getByText("Telefon 1'i görüşülen numara yap").closest(".shortcut-row");
    expect(phoneOneRow).not.toBeNull();

    await userEvent.click(within(phoneOneRow as HTMLElement).getByRole("button", { name: "Değiştir" }));
    await userEvent.keyboard("Y");

    expect(await screen.findByText("Bu kısayol zaten 'Telefon 2'yi görüşülen numara yap' işlemi için kullanılıyor.")).toBeInTheDocument();

    await userEvent.keyboard("3");

    expect(await screen.findByText("3 tuşu bu projede kritik işlem kısayolu olarak kullanılamaz. Lütfen başka bir tuş seçin.")).toBeInTheDocument();
  });

  it("shows a visible warning when the selected system backup file is invalid", async () => {
    render(<SettingsPage />);
    await userEvent.click(screen.getByRole("tab", { name: "Veri Yönetimi" }));

    fireEvent.change(getRestoreFileInput(), {
      target: {
        files: [new File([JSON.stringify({ headers: ["Sıra No"], rows: [] })], "wrong.json", { type: "application/json" })]
      }
    });

    const warningDialog = await screen.findByRole("alertdialog", { name: "Tam Sistem Yedeği okunamadı" });
    expect(warningDialog).toBeInTheDocument();
    expect(within(warningDialog).getByText(/Bu dosya Tam Sistem Yedeği dosyası gibi görünmüyor/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Tamam" }));

    expect(screen.queryByRole("alertdialog", { name: "Tam Sistem Yedeği okunamadı" })).not.toBeInTheDocument();
  });

  it("shows a visible success notice after restoring a valid system backup", async () => {
    render(<SettingsPage />);
    await userEvent.click(screen.getByRole("tab", { name: "Veri Yönetimi" }));

    fireEvent.change(getRestoreFileInput(), {
      target: {
        files: [new File([createEmptyBackupJson()], "backup.json", { type: "application/json" })]
      }
    });

    expect(await screen.findByText("Sistem yedeği analiz edildi. Geri yüklemeden önce özeti kontrol edin.")).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText(RESTORE_SYSTEM_BACKUP_CONFIRMATION), RESTORE_SYSTEM_BACKUP_CONFIRMATION);
    await userEvent.click(screen.getByRole("button", { name: "Sistem yedeğini geri yükle" }));

    expect(await screen.findByRole("alertdialog", { name: "Geri yükleme tamamlandı" })).toBeInTheDocument();
    expect(screen.getByText(/Tam Sistem Yedeği başarıyla geri yüklendi/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Tamam" }));

    await waitFor(() => {
      expect(screen.queryByRole("alertdialog", { name: "Geri yükleme tamamlandı" })).not.toBeInTheDocument();
    });
  });
});

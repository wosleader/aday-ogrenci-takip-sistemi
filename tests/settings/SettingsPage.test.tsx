import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SettingsPage } from "../../src/features/settings/SettingsPage";

describe("SettingsPage", () => {
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

    await userEvent.click(screen.getByRole("tab", { name: "Veri Yönetimi" }));

    expect(screen.getByRole("tab", { name: "Veri Yönetimi" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Tam Sistem Yedeği Al")).toBeInTheDocument();
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
});

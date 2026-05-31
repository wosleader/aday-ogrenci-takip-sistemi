import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProgressPage } from "../../src/features/progress/ProgressPage";

describe("ProgressPage", () => {
  it("renders the temporary project progress dashboard", () => {
    render(<ProgressPage />);

    expect(screen.getByRole("heading", { name: "Proje İlerlemesi" })).toBeInTheDocument();
    expect(screen.getByText("Dar Pilot Hazırlığı")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Son Güncelleme" })).toBeInTheDocument();
    expect(screen.getByText(/649689a/)).toBeInTheDocument();
    expect(screen.getByText(/Detaylı Excel Export kolonları import mapping ekranında doğru tanınır hale getirildi/)).toBeInTheDocument();
    expect(screen.getByText(/İçe aktarılmayacak sistem kolonları varsayılan görünür/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pilot Sonrası Takip Edilecekler" })).toBeInTheDocument();
    expect(screen.getByText(/Bu sayfa geçici takip ekranıdır/i)).toBeInTheDocument();
  });
});

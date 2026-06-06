import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProgressPage } from "../../src/features/progress/ProgressPage";

describe("ProgressPage", () => {
  it("renders the temporary project progress dashboard", () => {
    render(<ProgressPage />);

    expect(screen.getByRole("heading", { name: "Proje İlerlemesi" })).toBeInTheDocument();
    expect(screen.getByText("Dar Pilot Hazırlığı")).toBeInTheDocument();
    expect(screen.getByText("Son Güncelleme")).toBeInTheDocument();
    expect(screen.getAllByText(/Pilot Ready with Warnings/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/e6f580b/).length).toBeGreaterThan(0);
    expect(screen.getByText(/a9e891c/)).toBeInTheDocument();
    expect(screen.getByText(/44 test file \/ 284 tests PASS/)).toBeInTheDocument();
    expect(screen.getByText(/build PASS/)).toBeInTheDocument();
    expect(screen.queryByText(/649689a/)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pilot Sırasında Bilinmesi Gerekenler" })).toBeInTheDocument();
    expect(screen.getByText(/Bu sayfa geçici takip ekranıdır/i)).toBeInTheDocument();
  });
});

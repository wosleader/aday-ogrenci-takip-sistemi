import { describe, expect, it } from "vitest";
import { createSearchText, normalizeText } from "../../src/utils/normalizeText";

describe("normalizeText", () => {
  it("normalizes Turkish characters, punctuation and whitespace", () => {
    expect(normalizeText("  Çağrı  İNANÇ / 11-A  ")).toBe("cagri inanc 11 a");
  });

  it("creates compact search text from defined parts", () => {
    expect(createSearchText(["Ayşe Yılmaz", null, "Veli: Ömer"])).toBe("ayse yilmaz veli omer");
  });
});

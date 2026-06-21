import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../src/db/db";
import { createWhatsAppDraftLog } from "../../src/features/whatsapp/whatsappDraftLogService";
import { renderWhatsAppTemplate } from "../../src/features/whatsapp/whatsappTemplateRenderer";
import { getWhatsAppTemplateById } from "../../src/features/whatsapp/whatsappTemplates";
import { buildWhatsAppDraftUrl, normalizeWhatsAppPhoneNumber } from "../../src/features/whatsapp/whatsappUrl";

describe("WhatsApp draft helpers", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  afterEach(async () => {
    await db.delete();
  });

  it.each([
    ["0530 233 75 72", "905302337572"],
    ["+90 530 233 75 72", "905302337572"],
    ["90 530 233 75 72", "905302337572"],
    ["5302337572", "905302337572"],
    ["0500 000 10 01", "905000001001"]
  ])("normalizes %s for WhatsApp links", (input, expected) => {
    expect(normalizeWhatsAppPhoneNumber(input)).toEqual({
      ok: true,
      normalizedPhone: expected
    });
  });

  it("builds encoded wa.me draft URLs without changing message line breaks", () => {
    const message = "Merhaba\n\n*Akademik Not*\nKonum:\nhttps://maps.app.goo.gl/AjMa1AcJxZyE9oZq8";
    const url = buildWhatsAppDraftUrl("0530 233 75 72", message);

    expect(url).toBe(`https://wa.me/905302337572?text=${encodeURIComponent(message)}`);
  });

  it("renders template variables without leaking undefined or null", () => {
    const template = getWhatsAppTemplateById("kurum-bilgisi-konum");
    const message = renderWhatsAppTemplate(template, {
      veli_unvani: null,
      ogrenci_adi: undefined,
      telefon: ""
    });

    expect(message).toContain("Merhabalar Sayın Veli");
    expect(message).toContain("Akademik Not Kurs Merkezi");
    expect(message).toContain("https://www.instagram.com/bursaakademiknot/");
    expect(message).toContain("https://maps.app.goo.gl/AjMa1AcJxZyE9oZq8");
    expect(message).not.toContain("undefined");
    expect(message).not.toContain("null");
    expect(message.split("\n").length).toBeGreaterThan(8);
  });

  it("creates WhatsApp draft logs for opened, copied, and manually marked sent statuses", async () => {
    await createWhatsAppDraftLog({
      student_id: 1,
      phone_id: 2,
      phone_number: "0532 111 2233",
      template_id: "kurum-bilgisi-konum",
      template_title: "Kurum Bilgisi + Konum",
      message_preview: "Test mesajı",
      status: "draft_opened"
    });
    await createWhatsAppDraftLog({
      student_id: 1,
      phone_id: 2,
      phone_number: "0532 111 2233",
      template_id: "kurum-bilgisi-konum",
      template_title: "Kurum Bilgisi + Konum",
      message_preview: "Test mesajı",
      status: "copied"
    });
    await createWhatsAppDraftLog({
      student_id: 1,
      phone_id: 2,
      phone_number: "0532 111 2233",
      template_id: "kurum-bilgisi-konum",
      template_title: "Kurum Bilgisi + Konum",
      message_preview: "Test mesajı",
      status: "manually_marked_sent"
    });

    const logs = await db.whatsapp_draft_logs.orderBy("id").toArray();

    expect(logs.map((log) => log.status)).toEqual(["draft_opened", "copied", "manually_marked_sent"]);
    expect(logs[0]).toMatchObject({
      student_id: 1,
      phone_id: 2,
      template_title: "Kurum Bilgisi + Konum",
      sync_status: "local"
    });
  });
});

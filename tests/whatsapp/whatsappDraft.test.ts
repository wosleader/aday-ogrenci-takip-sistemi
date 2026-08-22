import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createBackupSnapshot } from "../../src/db/backup";
import { db } from "../../src/db/db";
import {
  createWhatsAppDraftLog,
  readLatestManualSentWhatsAppDraftsForStudent
} from "../../src/features/whatsapp/whatsappDraftLogService";
import { renderWhatsAppTemplate } from "../../src/features/whatsapp/whatsappTemplateRenderer";
import { getWhatsAppTemplateById } from "../../src/features/whatsapp/whatsappTemplates";
import {
  readWhatsAppTemplateWithOverride,
  resetWhatsAppTemplateOverride,
  saveWhatsAppTemplateOverride,
  WHATSAPP_TEMPLATE_OVERRIDE_KEY_PREFIX
} from "../../src/features/whatsapp/whatsappTemplateOverrides";

describe("WhatsApp draft services", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  afterEach(async () => {
    await db.delete();
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

  it("reads the latest manually sent WhatsApp draft per phone", async () => {
    await createWhatsAppDraftLog({
      student_id: 1,
      phone_id: 2,
      phone_number: "0532 111 2233",
      template_id: "yks-yaz-kampi-davet",
      template_title: "YKS Yaz Kampı Davet",
      message_preview: "Eski mesaj",
      status: "manually_marked_sent"
    });
    await createWhatsAppDraftLog({
      student_id: 1,
      phone_id: 2,
      phone_number: "0532 111 2233",
      template_id: "kurum-bilgisi-konum",
      template_title: "Kurum Bilgisi + Konum",
      message_preview: "Yeni mesaj",
      status: "manually_marked_sent"
    });

    const lookup = await readLatestManualSentWhatsAppDraftsForStudent(1);

    expect(lookup.byPhoneId.get(2)?.template_title).toBe("Kurum Bilgisi + Konum");
    expect(lookup.byPhoneNumber.get("05321112233")?.template_title).toBe("Kurum Bilgisi + Konum");
  });

  it("persists WhatsApp template body overrides in settings without changing static metadata", async () => {
    const template = getWhatsAppTemplateById("kurum-bilgisi-konum");
    const overrideBody = "Merhaba {{veli_unvani}}, özel kayıtlı şablon.";

    expect((await readWhatsAppTemplateWithOverride(template.id)).body).toBe(template.body);

    const saved = await saveWhatsAppTemplateOverride(template.id, overrideBody);

    expect(saved).toMatchObject({
      id: template.id,
      title: template.title,
      description: template.description,
      category: template.category,
      body: overrideBody
    });
    expect((await readWhatsAppTemplateWithOverride(template.id)).body).toBe(overrideBody);
    await expect(db.settings.get(`${WHATSAPP_TEMPLATE_OVERRIDE_KEY_PREFIX}${template.id}`)).resolves.toMatchObject({
      key: `${WHATSAPP_TEMPLATE_OVERRIDE_KEY_PREFIX}${template.id}`,
      value: overrideBody
    });
  });

  it("resets WhatsApp template overrides back to the static fallback", async () => {
    const template = getWhatsAppTemplateById("kurum-bilgisi-konum");

    await saveWhatsAppTemplateOverride(template.id, "Kalıcı özel şablon");
    const reset = await resetWhatsAppTemplateOverride(template.id);

    expect(reset.body).toBe(template.body);
    expect((await readWhatsAppTemplateWithOverride(template.id)).body).toBe(template.body);
    await expect(db.settings.get(`${WHATSAPP_TEMPLATE_OVERRIDE_KEY_PREFIX}${template.id}`)).resolves.toBeUndefined();
  });

  it("includes WhatsApp template overrides in the existing full-system backup settings table", async () => {
    const template = getWhatsAppTemplateById("kurum-bilgisi-konum");
    const overrideBody = "Backup içinde taşınan WhatsApp şablonu.";

    await saveWhatsAppTemplateOverride(template.id, overrideBody);

    const snapshot = await createBackupSnapshot(db);

    expect(snapshot.metadata.counts.settings).toBe(1);
    expect(snapshot.tables.settings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: `${WHATSAPP_TEMPLATE_OVERRIDE_KEY_PREFIX}${template.id}`,
          value: overrideBody
        })
      ])
    );
  });
});

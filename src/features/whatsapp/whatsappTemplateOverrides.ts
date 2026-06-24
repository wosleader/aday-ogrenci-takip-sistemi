import type { AppDatabase } from "../../db/db";
import { db } from "../../db/db";
import { nowIso } from "../../utils/dateTime";
import { getWhatsAppTemplateById, type WhatsAppTemplate } from "./whatsappTemplates";

export const WHATSAPP_TEMPLATE_OVERRIDE_KEY_PREFIX = "whatsapp_template_override:";

function createOverrideKey(templateId: string): string {
  return `${WHATSAPP_TEMPLATE_OVERRIDE_KEY_PREFIX}${templateId}`;
}

function resolveTemplate(templateId: string): WhatsAppTemplate {
  return getWhatsAppTemplateById(templateId);
}

export async function readWhatsAppTemplateWithOverride(
  templateId: string,
  database: AppDatabase = db
): Promise<WhatsAppTemplate> {
  const template = resolveTemplate(templateId);
  const override = await database.settings.get(createOverrideKey(template.id));

  if (!override) {
    return template;
  }

  return {
    ...template,
    body: override.value
  };
}

export async function saveWhatsAppTemplateOverride(
  templateId: string,
  body: string,
  database: AppDatabase = db
): Promise<WhatsAppTemplate> {
  const template = resolveTemplate(templateId);

  await database.settings.put({
    key: createOverrideKey(template.id),
    value: body,
    updated_at: nowIso()
  });

  return {
    ...template,
    body
  };
}

export async function resetWhatsAppTemplateOverride(
  templateId: string,
  database: AppDatabase = db
): Promise<WhatsAppTemplate> {
  const template = resolveTemplate(templateId);

  await database.settings.delete(createOverrideKey(template.id));

  return template;
}

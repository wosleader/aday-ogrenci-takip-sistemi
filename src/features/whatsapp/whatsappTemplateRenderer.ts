import { DEFAULT_INSTITUTION_INFO, type InstitutionInfo } from "./institutionInfo";
import type { WhatsAppTemplate } from "./whatsappTemplates";

export type WhatsAppTemplateVariables = Partial<
  Record<"veli_unvani" | "ogrenci_adi" | "kurum_adi" | "adres" | "instagram" | "konum" | "telefon", string | null>
>;

const VARIABLE_FALLBACKS: Record<keyof Required<WhatsAppTemplateVariables>, string> = {
  veli_unvani: "Sayın Veli",
  ogrenci_adi: "öğrencimiz",
  kurum_adi: DEFAULT_INSTITUTION_INFO.kurum_adi,
  adres: DEFAULT_INSTITUTION_INFO.adres,
  instagram: DEFAULT_INSTITUTION_INFO.instagram,
  konum: DEFAULT_INSTITUTION_INFO.konum,
  telefon: ""
};

function cleanVariableValue(value: string | null | undefined, fallback: string): string {
  const trimmedValue = value?.trim();

  return trimmedValue || fallback;
}

export function createWhatsAppTemplateVariables(
  variables: WhatsAppTemplateVariables,
  institution: InstitutionInfo = DEFAULT_INSTITUTION_INFO
): Record<keyof Required<WhatsAppTemplateVariables>, string> {
  return {
    veli_unvani: cleanVariableValue(variables.veli_unvani, VARIABLE_FALLBACKS.veli_unvani),
    ogrenci_adi: cleanVariableValue(variables.ogrenci_adi, VARIABLE_FALLBACKS.ogrenci_adi),
    kurum_adi: cleanVariableValue(variables.kurum_adi, institution.kurum_adi),
    adres: cleanVariableValue(variables.adres, institution.adres),
    instagram: cleanVariableValue(variables.instagram, institution.instagram),
    konum: cleanVariableValue(variables.konum, institution.konum),
    telefon: cleanVariableValue(variables.telefon, VARIABLE_FALLBACKS.telefon)
  };
}

export function renderWhatsAppTemplate(
  template: WhatsAppTemplate,
  variables: WhatsAppTemplateVariables,
  institution: InstitutionInfo = DEFAULT_INSTITUTION_INFO
): string {
  const resolvedVariables = createWhatsAppTemplateVariables(variables, institution);

  return template.body.replace(/\{([a-z_]+)\}/g, (match, key: keyof typeof resolvedVariables) => {
    return key in resolvedVariables ? resolvedVariables[key] : match;
  });
}

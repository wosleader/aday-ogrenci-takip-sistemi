import type { ImportFieldKey } from "./types";

export type ColumnDefinition = {
  field: ImportFieldKey;
  label: string;
  required?: boolean;
  aliases: string[];
  misspellings?: string[];
};

export const REQUIRED_IMPORT_FIELDS: ImportFieldKey[] = ["student_full_name"];

export const COLUMN_DEFINITIONS: ColumnDefinition[] = [
  {
    field: "current_class",
    label: "Sınıf",
    aliases: ["sinif", "mevcut sinif", "sinif 1", "sinif 1 kolon"]
  },
  {
    field: "student_group",
    label: "Öğrenci Grubu",
    aliases: ["ogrenci grubu", "grup", "sinif 2", "sinif 2 kolon"]
  },
  {
    field: "student_full_name",
    label: "Ad Soyad",
    required: true,
    aliases: ["ad soyad", "ogrenci ad soyad", "ogrenci adi soyadi", "ad soyadi"]
  },
  {
    field: "guardian_full_name",
    label: "Veli Ad Soyad",
    aliases: ["veli ad soyad", "veli adi soyadi", "veli ad soyadi"]
  },
  {
    field: "phone_1",
    label: "Telefon",
    aliases: ["telefon", "telefon 1", "tel", "cep telefonu"]
  },
  {
    field: "phone_2",
    label: "2. Telefon",
    aliases: ["2 telefon", "telefon 2", "ikinci telefon", "2 tel"]
  },
  {
    field: "last_call_result",
    label: "Ulaşıldı mı",
    aliases: ["ulasildi mi", "ulasilma durumu", "son arama durumu"]
  },
  {
    field: "should_call_again",
    label: "Tekrar aranacak mı?",
    aliases: ["tekrar aranacak mi", "tekrar arama", "sonra aranacak mi"],
    misspellings: ["tekrar arancak mi", "tekrar arancakmi"]
  },
  {
    field: "general_note",
    label: "Açıklama",
    aliases: ["aciklama", "aciklama 2026", "not", "genel not"]
  },
  {
    field: "reminder_date",
    label: "Tekrar Aranacak Tarih",
    aliases: ["tekrar aranacak tarih", "hatirlatma tarihi", "tekrar arama tarihi"]
  },
  {
    field: "campaign_name",
    label: "Kampanya Tanımı",
    aliases: ["kampanya tanimi", "kampanya", "kampanya adi"]
  }
];

export function getImportFieldLabel(field: ImportFieldKey): string {
  return COLUMN_DEFINITIONS.find((definition) => definition.field === field)?.label ?? field;
}

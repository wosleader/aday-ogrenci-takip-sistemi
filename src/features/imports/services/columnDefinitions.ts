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
    field: "student_first_name",
    label: "Ad",
    aliases: ["ad", "ogrenci adi"]
  },
  {
    field: "student_last_name",
    label: "Soyad",
    aliases: ["soyad", "ogrenci soyadi"]
  },
  {
    field: "guardian_full_name",
    label: "Veli Ad Soyad",
    aliases: ["veli adi", "veli ad soyad", "veli adi soyadi", "veli ad soyadi"]
  },
  {
    field: "guardian_phone",
    label: "Veli Telefonu",
    aliases: ["veli tel", "veli telefon", "veli gsm", "veli cep", "veli telefonu", "veli cep telefonu"]
  },
  {
    field: "mother_full_name",
    label: "Anne Adı",
    aliases: ["anne adi", "anne ad soyad", "anne adi soyadi"]
  },
  {
    field: "father_full_name",
    label: "Baba Adı",
    aliases: ["baba adi", "baba ad soyad", "baba adi soyadi"]
  },
  {
    field: "mother_phone",
    label: "Anne Telefonu",
    aliases: ["anne tel", "anne telefon", "anne gsm", "anne cep"]
  },
  {
    field: "father_phone",
    label: "Baba Telefonu",
    aliases: ["baba tel", "baba telefon", "baba gsm", "baba cep"]
  },
  {
    field: "neighborhood",
    label: "Mahalle",
    aliases: ["mahalle", "mah", "mahalle adi"]
  },
  {
    field: "district",
    label: "İlçe",
    aliases: ["ilce", "ilce adi"]
  },
  {
    field: "phone_1",
    label: "Telefon 1",
    aliases: [
      "telefon",
      "telefon 1",
      "telefon1",
      "tel",
      "tel 1",
      "tel1",
      "gsm",
      "gsm 1",
      "gsm1",
      "cep",
      "cep tel",
      "cep telefonu"
    ]
  },
  {
    field: "phone_2",
    label: "Telefon 2",
    aliases: [
      "2 telefon",
      "telefon 2",
      "telefon2",
      "ikinci telefon",
      "2 tel",
      "tel 2",
      "tel2",
      "gsm 2",
      "gsm2"
    ]
  },
  {
    field: "phone_3",
    label: "Telefon 3",
    aliases: ["telefon 3", "telefon3", "gsm3", "gsm 3", "tel 3", "tel3", "phone 3"]
  },
  {
    field: "phone_4",
    label: "Telefon 4",
    aliases: ["telefon 4", "telefon4", "gsm4", "gsm 4", "tel 4", "tel4", "phone 4"]
  },
  {
    field: "phone_5",
    label: "Telefon 5",
    aliases: ["telefon 5", "telefon5", "gsm5", "gsm 5", "tel 5", "tel5", "phone 5"]
  },
  {
    field: "phone_6",
    label: "Telefon 6",
    aliases: ["telefon 6", "telefon6", "gsm6", "gsm 6", "tel 6", "tel6", "phone 6"]
  },
  {
    field: "phone_7",
    label: "Telefon 7",
    aliases: ["telefon 7", "telefon7", "gsm7", "gsm 7", "tel 7", "tel7", "phone 7"]
  },
  {
    field: "phone_8",
    label: "Telefon 8",
    aliases: ["telefon 8", "telefon8", "gsm8", "gsm 8", "tel 8", "tel8", "phone 8"]
  },
  {
    field: "phone_9",
    label: "Telefon 9",
    aliases: ["telefon 9", "telefon9", "gsm9", "gsm 9", "tel 9", "tel9", "phone 9"]
  },
  {
    field: "phone_10",
    label: "Telefon 10",
    aliases: ["telefon 10", "telefon10", "gsm10", "gsm 10", "tel 10", "tel10", "phone 10"]
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
    aliases: ["aciklama", "genel aciklama", "aciklama 2026", "not", "genel not"]
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

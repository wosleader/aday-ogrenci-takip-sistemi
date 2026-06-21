export type WhatsAppTemplateCategory = "campaign" | "info" | "follow_up" | "appointment";

export type WhatsAppTemplate = {
  id: string;
  title: string;
  description: string;
  category: WhatsAppTemplateCategory;
  body: string;
};

export const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: "yks-yaz-kampi-davet",
    title: "YKS Yaz Kampı Davet",
    description: "YKS öğrencileri için ücretsiz Matematik ve Türkçe yaz kampı daveti.",
    category: "campaign",
    body: `Merhabalar {veli_unvani},

*{kurum_adi}* olarak öğrencilerimizin yaz dönemini verimli değerlendirmeleri ve YKS sürecine sağlam bir temel oluşturmaları adına *6 Temmuz - 31 Temmuz* tarihleri arasında tamamen ücretsiz *Matematik ve Türkçe Yaz Kampımız* başlayacaktır.

Bu kamp sürecinde öğrencilerimiz:

• Matematik ve Türkçe derslerinden temel konu anlatımları ile eksiklerini tamamlayacak,
• Soru çözümleriyle konuları pekiştirecek,
• Alanında uzman öğretmen kadromuz eşliğinde düzenli çalışma alışkanlığı kazanacaktır.

Amacımız; öğrencilerimizin özellikle TYT'nin temelini oluşturan Matematik ve Türkçe derslerinde eksiklerini gidererek yeni döneme daha hazır, özgüvenli ve planlı bir şekilde başlamalarını sağlamaktır.

Kampımız tamamen ücretsizdir. Kontenjanlarımız sınırlıdır.

Kayıt ve detaylı bilgi için bizimle iletişime geçebilirsiniz.

📍 *Adres:*
{adres}

Başarıya giden yolda birlikte yürümek dileğiyle.

*{kurum_adi}*

Instagram:
{instagram}

Konum:
{konum}`
  },
  {
    id: "lgs-yaz-kampi-davet",
    title: "LGS Yaz Kampı Davet",
    description: "Ortaokul/LGS öğrencileri için ücretsiz Türkçe ve Matematik yaz kampı daveti.",
    category: "campaign",
    body: `Merhabalar {veli_unvani},

*{kurum_adi}* olarak öğrencilerimizin yaz dönemini verimli değerlendirmeleri ve yeni döneme daha güçlü başlamaları adına *6 Temmuz - 31 Temmuz* tarihleri arasında tamamen ücretsiz *Türkçe ve Matematik Yaz Kampımız* başlayacaktır.

Bu kamp sürecinde öğrencilerimiz:

• Türkçe ve Matematik derslerinden temel eksiklerini tamamlayacak,
• Soru çözümleriyle konuları pekiştirecek,
• LGS sürecine sağlam bir başlangıç yapacak,
• Alanında uzman öğretmen kadromuz eşliğinde düzenli çalışma alışkanlığı kazanacaktır.

Kampımız tamamen ücretsizdir. Kontenjanlarımız sınırlıdır.

Kayıt ve detaylı bilgi için bizimle iletişime geçebilirsiniz.

📍 *Adres:*
{adres}

*{kurum_adi}*

Instagram:
{instagram}

Konum:
{konum}`
  },
  {
    id: "kurum-bilgisi-konum",
    title: "Kurum Bilgisi + Konum",
    description: "Adres, Instagram ve konum bilgisini kısa şekilde paylaşır.",
    category: "info",
    body: `Merhabalar {veli_unvani},

*{kurum_adi}* iletişim ve konum bilgilerimizi aşağıda iletiyorum.

📍 *Adres:*
{adres}

Instagram:
{instagram}

Konum:
{konum}

Detaylı bilgi için bizimle iletişime geçebilirsiniz.

*{kurum_adi}*`
  },
  {
    id: "randevu-hatirlatma",
    title: "Randevu Hatırlatma",
    description: "Planlanan görüşme/randevu için kısa hatırlatma mesajı.",
    category: "appointment",
    body: `Merhabalar {veli_unvani},

*{kurum_adi}* olarak randevunuzu hatırlatmak isteriz.

Randevu detayınız için kurumumuzla iletişime geçebilirsiniz.

📍 *Adres:*
{adres}

Konum:
{konum}

Görüşmek dileğiyle.

*{kurum_adi}*`
  },
  {
    id: "deneme-dersi-sonrasi-takip",
    title: "Deneme Dersi Sonrası Takip",
    description: "Deneme dersi veya görüşme sonrasında takip mesajı.",
    category: "follow_up",
    body: `Merhabalar {veli_unvani},

Bugünkü deneme dersimiz / görüşmemiz sonrasında sizinle tekrar iletişim kurmak istedik.

Öğrencimizin süreciyle ilgili detaylı değerlendirme ve yeni dönem planlaması için kurumumuzla iletişime geçebilirsiniz.

*{kurum_adi}*

Konum:
{konum}`
  },
  {
    id: "erken-kayit-bilgilendirme",
    title: "Erken Kayıt Bilgilendirme",
    description: "Yeni dönem ve erken kayıt süreci için bilgilendirme mesajı.",
    category: "campaign",
    body: `Merhabalar {veli_unvani},

*{kurum_adi}* olarak yeni dönem kayıtlarımız başlamıştır.

Erken kayıt sürecinde kontenjan planlaması ve program oluşturma açısından sizinle detaylı görüşmek isteriz.

Kayıt ve detaylı bilgi için kurumumuzla iletişime geçebilirsiniz.

📍 *Adres:*
{adres}

Konum:
{konum}

*{kurum_adi}*`
  }
];

export const DEFAULT_WHATSAPP_TEMPLATE_ID = "kurum-bilgisi-konum";

export function getWhatsAppTemplateById(templateId: string): WhatsAppTemplate {
  return WHATSAPP_TEMPLATES.find((template) => template.id === templateId) ?? WHATSAPP_TEMPLATES[0];
}

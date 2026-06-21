export const DEFAULT_INSTITUTION_INFO = {
  kurum_adi: "Akademik Not Kurs Merkezi",
  instagram: "https://www.instagram.com/bursaakademiknot/",
  konum: "https://maps.app.goo.gl/AjMa1AcJxZyE9oZq8",
  adres: "Doğanbey Mh. 1. Doğanbey Sk. M. Özer İş Merkezi No:4/101 K:1 Osmangazi / Bursa"
} as const;

export type InstitutionInfo = typeof DEFAULT_INSTITUTION_INFO;

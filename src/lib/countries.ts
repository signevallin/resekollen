// Mapping of Swedish (and common English) country names → ISO 3166-1 data
// numeric: matches world-atlas TopoJSON country IDs
// alpha2: for flag emojis

interface CountryEntry {
  numeric: number; // ISO 3166-1 numeric
  alpha2: string;  // ISO 3166-1 alpha-2
  englishName: string;
}

const COUNTRY_DB: CountryEntry[] = [
  { numeric: 4,   alpha2: "AF", englishName: "Afghanistan" },
  { numeric: 8,   alpha2: "AL", englishName: "Albania" },
  { numeric: 12,  alpha2: "DZ", englishName: "Algeria" },
  { numeric: 24,  alpha2: "AO", englishName: "Angola" },
  { numeric: 32,  alpha2: "AR", englishName: "Argentina" },
  { numeric: 36,  alpha2: "AU", englishName: "Australia" },
  { numeric: 40,  alpha2: "AT", englishName: "Austria" },
  { numeric: 48,  alpha2: "BH", englishName: "Bahrain" },
  { numeric: 50,  alpha2: "BD", englishName: "Bangladesh" },
  { numeric: 56,  alpha2: "BE", englishName: "Belgium" },
  { numeric: 68,  alpha2: "BO", englishName: "Bolivia" },
  { numeric: 70,  alpha2: "BA", englishName: "Bosnia and Herzegovina" },
  { numeric: 72,  alpha2: "BW", englishName: "Botswana" },
  { numeric: 76,  alpha2: "BR", englishName: "Brazil" },
  { numeric: 100, alpha2: "BG", englishName: "Bulgaria" },
  { numeric: 104, alpha2: "MM", englishName: "Myanmar" },
  { numeric: 116, alpha2: "KH", englishName: "Cambodia" },
  { numeric: 120, alpha2: "CM", englishName: "Cameroon" },
  { numeric: 124, alpha2: "CA", englishName: "Canada" },
  { numeric: 144, alpha2: "LK", englishName: "Sri Lanka" },
  { numeric: 152, alpha2: "CL", englishName: "Chile" },
  { numeric: 156, alpha2: "CN", englishName: "China" },
  { numeric: 170, alpha2: "CO", englishName: "Colombia" },
  { numeric: 178, alpha2: "CG", englishName: "Congo" },
  { numeric: 180, alpha2: "CD", englishName: "DR Congo" },
  { numeric: 188, alpha2: "CR", englishName: "Costa Rica" },
  { numeric: 191, alpha2: "HR", englishName: "Croatia" },
  { numeric: 192, alpha2: "CU", englishName: "Cuba" },
  { numeric: 196, alpha2: "CY", englishName: "Cyprus" },
  { numeric: 203, alpha2: "CZ", englishName: "Czech Republic" },
  { numeric: 208, alpha2: "DK", englishName: "Denmark" },
  { numeric: 214, alpha2: "DO", englishName: "Dominican Republic" },
  { numeric: 218, alpha2: "EC", englishName: "Ecuador" },
  { numeric: 222, alpha2: "SV", englishName: "El Salvador" },
  { numeric: 231, alpha2: "ET", englishName: "Ethiopia" },
  { numeric: 233, alpha2: "EE", englishName: "Estonia" },
  { numeric: 246, alpha2: "FI", englishName: "Finland" },
  { numeric: 250, alpha2: "FR", englishName: "France" },
  { numeric: 268, alpha2: "GE", englishName: "Georgia" },
  { numeric: 276, alpha2: "DE", englishName: "Germany" },
  { numeric: 288, alpha2: "GH", englishName: "Ghana" },
  { numeric: 300, alpha2: "GR", englishName: "Greece" },
  { numeric: 320, alpha2: "GT", englishName: "Guatemala" },
  { numeric: 340, alpha2: "HN", englishName: "Honduras" },
  { numeric: 348, alpha2: "HU", englishName: "Hungary" },
  { numeric: 352, alpha2: "IS", englishName: "Iceland" },
  { numeric: 356, alpha2: "IN", englishName: "India" },
  { numeric: 360, alpha2: "ID", englishName: "Indonesia" },
  { numeric: 364, alpha2: "IR", englishName: "Iran" },
  { numeric: 368, alpha2: "IQ", englishName: "Iraq" },
  { numeric: 372, alpha2: "IE", englishName: "Ireland" },
  { numeric: 376, alpha2: "IL", englishName: "Israel" },
  { numeric: 380, alpha2: "IT", englishName: "Italy" },
  { numeric: 388, alpha2: "JM", englishName: "Jamaica" },
  { numeric: 392, alpha2: "JP", englishName: "Japan" },
  { numeric: 400, alpha2: "JO", englishName: "Jordan" },
  { numeric: 398, alpha2: "KZ", englishName: "Kazakhstan" },
  { numeric: 404, alpha2: "KE", englishName: "Kenya" },
  { numeric: 410, alpha2: "KR", englishName: "South Korea" },
  { numeric: 418, alpha2: "LA", englishName: "Laos" },
  { numeric: 422, alpha2: "LB", englishName: "Lebanon" },
  { numeric: 428, alpha2: "LV", englishName: "Latvia" },
  { numeric: 434, alpha2: "LY", englishName: "Libya" },
  { numeric: 440, alpha2: "LT", englishName: "Lithuania" },
  { numeric: 442, alpha2: "LU", englishName: "Luxembourg" },
  { numeric: 450, alpha2: "MG", englishName: "Madagascar" },
  { numeric: 458, alpha2: "MY", englishName: "Malaysia" },
  { numeric: 470, alpha2: "MT", englishName: "Malta" },
  { numeric: 484, alpha2: "MX", englishName: "Mexico" },
  { numeric: 496, alpha2: "MN", englishName: "Mongolia" },
  { numeric: 499, alpha2: "ME", englishName: "Montenegro" },
  { numeric: 504, alpha2: "MA", englishName: "Morocco" },
  { numeric: 508, alpha2: "MZ", englishName: "Mozambique" },
  { numeric: 512, alpha2: "OM", englishName: "Oman" },
  { numeric: 516, alpha2: "NA", englishName: "Namibia" },
  { numeric: 524, alpha2: "NP", englishName: "Nepal" },
  { numeric: 528, alpha2: "NL", englishName: "Netherlands" },
  { numeric: 554, alpha2: "NZ", englishName: "New Zealand" },
  { numeric: 558, alpha2: "NI", englishName: "Nicaragua" },
  { numeric: 566, alpha2: "NG", englishName: "Nigeria" },
  { numeric: 578, alpha2: "NO", englishName: "Norway" },
  { numeric: 586, alpha2: "PK", englishName: "Pakistan" },
  { numeric: 591, alpha2: "PA", englishName: "Panama" },
  { numeric: 604, alpha2: "PE", englishName: "Peru" },
  { numeric: 608, alpha2: "PH", englishName: "Philippines" },
  { numeric: 616, alpha2: "PL", englishName: "Poland" },
  { numeric: 620, alpha2: "PT", englishName: "Portugal" },
  { numeric: 634, alpha2: "QA", englishName: "Qatar" },
  { numeric: 642, alpha2: "RO", englishName: "Romania" },
  { numeric: 643, alpha2: "RU", englishName: "Russia" },
  { numeric: 682, alpha2: "SA", englishName: "Saudi Arabia" },
  { numeric: 686, alpha2: "SN", englishName: "Senegal" },
  { numeric: 688, alpha2: "RS", englishName: "Serbia" },
  { numeric: 702, alpha2: "SG", englishName: "Singapore" },
  { numeric: 703, alpha2: "SK", englishName: "Slovakia" },
  { numeric: 705, alpha2: "SI", englishName: "Slovenia" },
  { numeric: 706, alpha2: "SO", englishName: "Somalia" },
  { numeric: 710, alpha2: "ZA", englishName: "South Africa" },
  { numeric: 724, alpha2: "ES", englishName: "Spain" },
  { numeric: 752, alpha2: "SE", englishName: "Sweden" },
  { numeric: 756, alpha2: "CH", englishName: "Switzerland" },
  { numeric: 760, alpha2: "SY", englishName: "Syria" },
  { numeric: 764, alpha2: "TH", englishName: "Thailand" },
  { numeric: 788, alpha2: "TN", englishName: "Tunisia" },
  { numeric: 792, alpha2: "TR", englishName: "Turkey" },
  { numeric: 784, alpha2: "AE", englishName: "UAE" },
  { numeric: 804, alpha2: "UA", englishName: "Ukraine" },
  { numeric: 826, alpha2: "GB", englishName: "United Kingdom" },
  { numeric: 840, alpha2: "US", englishName: "United States" },
  { numeric: 858, alpha2: "UY", englishName: "Uruguay" },
  { numeric: 704, alpha2: "VN", englishName: "Vietnam" },
  { numeric: 807, alpha2: "MK", englishName: "North Macedonia" },
  { numeric: 716, alpha2: "ZW", englishName: "Zimbabwe" },
  { numeric: 894, alpha2: "ZM", englishName: "Zambia" },
  { numeric: 384, alpha2: "CI", englishName: "Ivory Coast" },
  { numeric: 834, alpha2: "TZ", englishName: "Tanzania" },
  { numeric: 112, alpha2: "BY", englishName: "Belarus" },
  { numeric: 51,  alpha2: "AM", englishName: "Armenia" },
  { numeric: 31,  alpha2: "AZ", englishName: "Azerbaijan" },
  { numeric: 818, alpha2: "EG", englishName: "Egypt" },
];

// Swedish name → alpha2 lookup (lowercase keys)
const SWEDISH_NAMES: Record<string, string> = {
  "sverige": "SE", "usa": "US", "förenta staterna": "US", "frankrike": "FR",
  "spanien": "ES", "italien": "IT", "tyskland": "DE", "japan": "JP",
  "thailand": "TH", "grekland": "GR", "storbritannien": "GB", "england": "GB",
  "uk": "GB", "portugal": "PT", "nederländerna": "NL", "holland": "NL",
  "schweiz": "CH", "österrike": "AT", "kroatien": "HR", "marocko": "MA",
  "egypten": "EG", "turkiet": "TR", "brasilien": "BR", "mexiko": "MX",
  "australien": "AU", "kanada": "CA", "kina": "CN", "indien": "IN",
  "vietnam": "VN", "indonesien": "ID", "filippinerna": "PH", "island": "IS",
  "norge": "NO", "danmark": "DK", "finland": "FI", "polen": "PL",
  "tjeckien": "CZ", "ungern": "HU", "rumänien": "RO", "bulgarien": "BG",
  "serbien": "RS", "nordmakedonien": "MK", "albanien": "AL",
  "montenegro": "ME", "bosnien": "BA", "slovenien": "SI", "slovakien": "SK",
  "estland": "EE", "lettland": "LV", "litauen": "LT", "irland": "IE",
  "belgien": "BE", "luxemburg": "LU", "malta": "MT", "cypern": "CY",
  "israel": "IL", "jordanien": "JO", "förenade arabemiraten": "AE",
  "dubai": "AE", "bahrain": "BH", "qatar": "QA", "saudiarabien": "SA",
  "oman": "OM", "malaysia": "MY", "singapore": "SG", "sydkorea": "KR",
  "nya zeeland": "NZ", "sydafrika": "ZA", "kenya": "KE", "tanzania": "TZ",
  "etiopien": "ET", "ghana": "GH", "nigeria": "NG", "peru": "PE",
  "colombia": "CO", "argentina": "AR", "chile": "CL", "bolivia": "BO",
  "ecuador": "EC", "uruguay": "UY", "kuba": "CU", "jamaica": "JM",
  "dominikanska republiken": "DO", "costa rica": "CR", "panama": "PA",
  "ryssland": "RU", "ukraina": "UA", "georgien": "GE", "kazakstan": "KZ",
  "iran": "IR", "libanon": "LB", "nepal": "NP", "sri lanka": "LK",
  "bangladesh": "BD", "myanmar": "MM", "kambodja": "KH", "laos": "LA",
  "madagaskar": "MG", "moçambique": "MZ", "namibia": "NA", "botswana": "BW",
  "senegal": "SN", "elfenbenskusten": "CI", "kamerun": "CM", "pakistan": "PK",
  "mongoliet": "MN", "guatemala": "GT", "honduras": "HN",
  "el salvador": "SV", "nicaragua": "NI", "syrien": "SY", "irak": "IQ",
  "afghanistan": "AF", "angola": "AO", "zimbabwe": "ZW", "zambia": "ZM",
  "libyen": "LY", "algeriet": "DZ", "tunisien": "TN", "somalia": "SO",
  "vitryssland": "BY", "armenien": "AM", "azerbajdzjan": "AZ",
  "egypte": "EG",
};

// Also add all english names (lowercase)
for (const entry of COUNTRY_DB) {
  SWEDISH_NAMES[entry.englishName.toLowerCase()] = entry.alpha2;
}

const ALPHA2_TO_ENTRY = new Map<string, CountryEntry>(
  COUNTRY_DB.map((e) => [e.alpha2, e])
);

export function splitLand(land: string): string[] {
  return land
    .split(/\s*·\s*|\s*,\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function lookupCountry(name: string): CountryEntry | null {
  const normalized = name.trim().toLowerCase();
  const alpha2 = SWEDISH_NAMES[normalized];
  if (!alpha2) return null;
  return ALPHA2_TO_ENTRY.get(alpha2) ?? null;
}

export function getCountryNumericCode(name: string): number | null {
  return lookupCountry(name)?.numeric ?? null;
}

export function getFlagEmoji(alpha2: string): string {
  return alpha2
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("");
}

export function getCountryFlag(name: string): string {
  const first = splitLand(name)[0] ?? name;
  const entry = lookupCountry(first);
  if (!entry) return "🌍";
  return getFlagEmoji(entry.alpha2);
}

// Properly-capitalised Swedish country names for autocomplete
export const LAND_FORSLAG: string[] = [
  "Afghanistan", "Albanien", "Algeriet", "Angola", "Argentina", "Armenien",
  "Australien", "Azerbajdzjan", "Bahrain", "Bangladesh", "Belgien", "Bolivia",
  "Bosnien", "Botswana", "Brasilien", "Bulgarien", "Chile", "Colombia",
  "Costa Rica", "Cypern", "Danmark", "Dominikanska republiken", "Ecuador",
  "Egypten", "El Salvador", "Estland", "Etiopien", "Filippinerna", "Finland",
  "Frankrike", "Georgien", "Ghana", "Grekland", "Guatemala", "Honduras",
  "Indien", "Indonesien", "Irak", "Iran", "Irland", "Island", "Israel",
  "Italien", "Jamaica", "Japan", "Jordanien", "Kambodja", "Kanada",
  "Kazakstan", "Kenya", "Kina", "Kroatien", "Kuba", "Laos", "Lettland",
  "Libanon", "Litauen", "Luxemburg", "Madagaskar", "Malaysia", "Malta",
  "Marocko", "Mexiko", "Moçambique", "Mongoliet", "Montenegro", "Myanmar",
  "Namibia", "Nepal", "Nederländerna", "Nicaragua", "Nigeria",
  "Nordmakedonien", "Norge", "Nya Zeeland", "Oman", "Pakistan", "Panama",
  "Peru", "Polen", "Portugal", "Qatar", "Rumänien", "Ryssland",
  "Saudiarabien", "Senegal", "Serbien", "Singapore", "Slovakien",
  "Slovenien", "Somalia", "Spanien", "Sri Lanka", "Storbritannien",
  "Sverige", "Schweiz", "Sydafrika", "Sydkorea", "Syrien", "Tanzania",
  "Thailand", "Tjeckien", "Tunisien", "Turkiet", "Tyskland",
  "Förenade Arabemiraten", "Ukraina", "Ungern", "Uruguay", "USA",
  "Vietnam", "Vitryssland", "Zambia", "Zimbabwe", "Österrike",
].sort((a, b) => a.localeCompare(b, "sv"));

export type { CountryEntry };

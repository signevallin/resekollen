export interface Resa {
  id: string;
  userId: string;
  destination: string;
  land: string;
  startDatum: string;
  slutDatum: string;
  beskrivning?: string;
  omslagsbild?: string;
  skapadAd: string;
  uppdateradAd: string;
}

export interface DagboksInlagg {
  id: string;
  resaId: string;
  userId: string;
  datum: string;
  titel: string;
  innehall: string;
  bilder?: string[];
  skapadAd: string;
}

export interface PacklistaItem {
  id: string;
  resaId: string;
  userId: string;
  namn: string;
  kategori: string;
  packad: boolean;
  skapadAd: string;
}

export interface Bild {
  id: string;
  resaId: string;
  userId: string;
  url: string;
  beskrivning?: string;
  datum: string;
  skapadAd: string;
}

export const PACKLISTA_KATEGORIER = [
  "Kläder",
  "Hygien",
  "Elektronik",
  "Dokument",
  "Medicin",
  "Övrigt",
] as const;

"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Upload,
  FileJson,
  ArrowLeft,
  CheckSquare,
  Square,
  Loader2,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Globe,
} from "lucide-react";
import { importerGoogleResor, type TripToImport } from "@/app/actions/importGoogle";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DetectedTrip {
  destination: string;
  land: string;
  startDatum: string;
  slutDatum: string;
  dagar: number;
  selected: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateStr(iso: string): string {
  return iso.split("T")[0];
}

function daysBetween(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

// Parse "48.8566°N, 2.3522°E" → {lat, lon}
function parseLatLng(s: string): { lat: number; lon: number } | null {
  const m = s.match(/([\d.]+)°([NS]),\s*([\d.]+)°([EW])/);
  if (!m) return null;
  return {
    lat: parseFloat(m[1]) * (m[2] === "S" ? -1 : 1),
    lon: parseFloat(m[3]) * (m[4] === "W" ? -1 : 1),
  };
}

function cellKey(lat: number, lon: number): string {
  return `${lat.toFixed(1)},${lon.toFixed(1)}`;
}

async function reverseGeocode(lat: number, lon: number): Promise<{ city: string; country: string } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10&accept-language=sv`;
    const res = await fetch(url, { headers: { "User-Agent": "Resekollen/1.0" } });
    if (!res.ok) return null;
    const data = await res.json();
    const a = data.address ?? {};
    const city    = a.city || a.town || a.village || a.municipality || a.county || a.state || "";
    const country = a.country || "";
    return { city, country };
  } catch {
    return null;
  }
}

// Merge adjacent visits to same place (gap ≤ 2 days)
function mergeVisits(
  raw: { destination: string; land: string; start: Date; end: Date }[]
): DetectedTrip[] {
  const sorted = [...raw].sort((a, b) => a.start.getTime() - b.start.getTime());
  const merged: DetectedTrip[] = [];

  for (const v of sorted) {
    const last  = merged[merged.length - 1];
    const same  = last && last.destination === v.destination && last.land === v.land;
    const gapMs = last ? v.start.getTime() - new Date(last.slutDatum).getTime() : Infinity;
    const gapDays = gapMs / (1000 * 60 * 60 * 24);

    if (same && gapDays <= 2) {
      last.slutDatum = toDateStr(v.end.toISOString());
      last.dagar     = daysBetween(last.startDatum, last.slutDatum);
    } else {
      const startDatum = toDateStr(v.start.toISOString());
      const slutDatum  = toDateStr(v.end.toISOString());
      merged.push({ destination: v.destination, land: v.land, startDatum, slutDatum,
                    dagar: daysBetween(startDatum, slutDatum), selected: true });
    }
  }
  return merged.reverse();
}

// ─── Old format (timelineObjects) ────────────────────────────────────────────

function extractCountry(address: string): string {
  const parts = address.split(",").map((s) => s.trim()).filter(Boolean);
  return parts[parts.length - 1] ?? "";
}

function extractCity(name: string, address: string): string {
  if (name && name.length > 1) return name;
  const parts = address.split(",").map((s) => s.trim()).filter(Boolean);
  const cleaned = parts.map((p) => p.replace(/^\d{4,6}\s*/, "").trim());
  return cleaned[cleaned.length - 2] || cleaned[0] || "Okänd plats";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseOldFormat(data: any): DetectedTrip[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = (data.timelineObjects as any[])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((o: any) => o?.placeVisit)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((o: any) => {
      const loc   = o.placeVisit?.location ?? {};
      const start = new Date(o.placeVisit?.duration?.startTimestamp ?? "");
      const end   = new Date(o.placeVisit?.duration?.endTimestamp   ?? "");
      return {
        destination: extractCity(loc.name ?? "", loc.address ?? ""),
        land:        extractCountry(loc.address ?? ""),
        start, end,
      };
    })
    .filter((v) => {
      const hours = (v.end.getTime() - v.start.getTime()) / (1000 * 60 * 60);
      return hours >= 12 && v.land !== "" && !isNaN(v.start.getTime());
    });

  return mergeVisits(raw);
}

// ─── New format (semanticSegments + Nominatim) ───────────────────────────────

async function parseNewFormat(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any,
  onProgress: (done: number, total: number) => void
): Promise<DetectedTrip[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const segments: any[] = data.semanticSegments ?? [];

  type RawVisit = { lat: number; lon: number; start: Date; end: Date };

  const visits: RawVisit[] = segments
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((s: any) => s?.visit?.topCandidate?.placeLocation?.latLng)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((s: any) => {
      const coords = parseLatLng(s.visit.topCandidate.placeLocation.latLng);
      if (!coords) return null;
      return { ...coords, start: new Date(s.startTime), end: new Date(s.endTime) };
    })
    .filter((v): v is RawVisit => {
      if (!v) return false;
      const hours = (v.end.getTime() - v.start.getTime()) / (1000 * 60 * 60);
      return hours >= 8 && !isNaN(v.start.getTime());
    });

  // Unique location cells to geocode (0.1° ≈ 11 km)
  const uniqueCells = [...new Set(visits.map((v) => cellKey(v.lat, v.lon)))];
  const geoCache = new Map<string, { city: string; country: string }>();

  for (let i = 0; i < uniqueCells.length; i++) {
    const [lat, lon] = uniqueCells[i].split(",").map(Number);
    const result = await reverseGeocode(lat, lon);
    if (result) geoCache.set(uniqueCells[i], result);
    onProgress(i + 1, uniqueCells.length);
    // Nominatim rate limit: max 1 req/s
    if (i < uniqueCells.length - 1) {
      await new Promise((r) => setTimeout(r, 1200));
    }
  }

  const mapped = visits
    .map((v) => {
      const geo = geoCache.get(cellKey(v.lat, v.lon));
      return {
        destination: geo?.city    || `${v.lat.toFixed(2)}°, ${v.lon.toFixed(2)}°`,
        land:        geo?.country || "",
        start: v.start,
        end:   v.end,
      };
    })
    .filter((v) => v.land !== "");

  return mergeVisits(mapped);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GoogleImportPage() {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [trips,    setTrips]    = useState<DetectedTrip[]>([]);
  const [fileName, setFileName] = useState("");
  const [error,    setError]    = useState("");
  const [step, setStep]         = useState<"upload" | "geocoding" | "preview">("upload");
  const [geoProgress, setGeoProgress] = useState({ done: 0, total: 0 });
  const [importing, setImporting]     = useState(false);
  const [doneCount, setDoneCount]     = useState(0);

  // ── File handling ──────────────────────────────────────────────────────────

  const handleFile = useCallback((file: File) => {
    setError(""); setTrips([]); setDoneCount(0); setStep("upload");

    if (!file.name.endsWith(".json")) {
      setError("Välj en .json-fil från Google Tidslinje.");
      return;
    }
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        if (data.timelineObjects) {
          // ── Old format: sync ──
          const detected = parseOldFormat(data);
          if (!detected.length) {
            setError("Inga platser hittades. Prova en annan månadsfil.");
            return;
          }
          setTrips(detected);
          setStep("preview");
        } else if (data.semanticSegments) {
          // ── New format: async geocoding ──
          setStep("geocoding");
          const detected = await parseNewFormat(data, (done, total) =>
            setGeoProgress({ done, total })
          );
          if (!detected.length) {
            setError("Inga platser hittades i Timeline.json.");
            setStep("upload");
            return;
          }
          setTrips(detected);
          setStep("preview");
        } else {
          setError(
            "Okänt filformat. Filen bör vara en månads-JSON (äldre) eller Timeline.json (nyare) från Google Takeout."
          );
        }
      } catch {
        setError("Kunde inte läsa filen. Är det en giltig JSON-fil?");
        setStep("upload");
      }
    };
    reader.readAsText(file);
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  // ── Selection ──────────────────────────────────────────────────────────────

  const toggleTrip = (i: number) =>
    setTrips((p) => p.map((t, idx) => (idx === i ? { ...t, selected: !t.selected } : t)));

  const toggleAll = () => {
    const all = trips.every((t) => t.selected);
    setTrips((p) => p.map((t) => ({ ...t, selected: !all })));
  };

  const selectedCount = trips.filter((t) => t.selected).length;

  // ── Import ─────────────────────────────────────────────────────────────────

  const handleImport = async () => {
    const toImport: TripToImport[] = trips
      .filter((t) => t.selected)
      .map(({ destination, land, startDatum, slutDatum }) => ({ destination, land, startDatum, slutDatum }));
    if (!toImport.length) return;
    setImporting(true);
    const result = await importerGoogleResor(toImport);
    if ("error" in result && result.error) { setError(result.error); setImporting(false); return; }
    setDoneCount(result.count ?? toImport.length);
    setImporting(false);
    setTimeout(() => router.push("/resor"), 1800);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <Link href="/resor" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 mb-4">
          <ArrowLeft size={14} /> Tillbaka till resor
        </Link>
        <h1 className="text-2xl font-bold text-stone-800">Importera från Google Tidslinje</h1>
        <p className="text-stone-500 text-sm mt-1">
          Stöder både det äldre månadsformatet och den nya <code className="bg-stone-100 px-1 rounded">Timeline.json</code>.
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 mb-6 text-sm text-stone-600 space-y-2">
        <p className="font-medium text-stone-700">Hur exporterar du?</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Gå till <a href="https://takeout.google.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-stone-800">takeout.google.com</a></li>
          <li>Välj <strong>Platshistorik (tidslinje)</strong> → Nästa steg → Skapa export</li>
          <li>Ladda ner ZIP-filen och packa upp den</li>
          <li>
            <strong>Nytt format (2024+):</strong> Ladda upp <code className="bg-stone-200 px-1 rounded">Timeline.json</code><br />
            <span className="text-stone-400">Äldre format: ladda upp en fil från mappen <code className="bg-stone-200 px-1 rounded">Semantic Location History/[år]/</code></span>
          </li>
        </ol>
        <p className="text-stone-400 text-xs pt-1 flex items-start gap-1.5">
          <Globe size={12} className="mt-0.5 shrink-0" />
          Det nya formatet hämtar stadsnamn från OpenStreetMap — tar ca 1–2 sek per unik plats.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-700">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Fel vid inläsning</p>
            <p>{error}</p>
            <button onClick={() => { setError(""); setStep("upload"); }} className="underline mt-1 hover:text-red-800">Försök igen</button>
          </div>
        </div>
      )}

      {/* Success */}
      {doneCount > 0 && (
        <div className="flex items-center gap-3 bg-emerald-100 border border-emerald-200 rounded-xl p-4 text-emerald-800">
          <CheckCircle2 size={20} />
          <p className="font-medium">{doneCount} resor importerade! Skickar dig vidare…</p>
        </div>
      )}

      {/* Upload zone */}
      {step === "upload" && !error && (
        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-stone-300 rounded-xl p-14 text-center cursor-pointer hover:border-emerald-700 hover:bg-stone-50 transition-colors"
        >
          <FileJson className="mx-auto text-stone-400 mb-3" size={38} />
          <p className="font-medium text-stone-600">Dra och släpp JSON-fil här</p>
          <p className="text-stone-400 text-sm mt-1">eller klicka för att välja fil</p>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={onInputChange} />
        </div>
      )}

      {/* Geocoding progress */}
      {step === "geocoding" && (
        <div className="border border-stone-200 rounded-xl p-8 text-center">
          <Loader2 className="animate-spin mx-auto text-emerald-700 mb-4" size={28} />
          <p className="font-medium text-stone-700 mb-1">Hämtar stadsnamn från OpenStreetMap…</p>
          <p className="text-stone-400 text-sm mb-5">
            {geoProgress.done} / {geoProgress.total} platser klara
          </p>
          {geoProgress.total > 0 && (
            <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-2 bg-emerald-700 rounded-full transition-all duration-500"
                style={{ width: `${Math.round((geoProgress.done / geoProgress.total) * 100)}%` }}
              />
            </div>
          )}
          <p className="text-stone-300 text-xs mt-4">Stäng inte fönstret — tar ca {geoProgress.total} sekunder</p>
        </div>
      )}

      {/* Preview table */}
      {step === "preview" && trips.length > 0 && doneCount === 0 && (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-stone-600">
              <span className="font-medium">{trips.length}</span> platser hittades
              {" "}i <span className="font-medium">{fileName}</span>
            </p>
            <button onClick={toggleAll} className="text-sm text-stone-500 hover:text-stone-800 underline">
              {trips.every((t) => t.selected) ? "Avmarkera alla" : "Markera alla"}
            </button>
          </div>

          <div className="border border-stone-200 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="w-10 p-3" />
                  <th className="text-left p-3 font-medium text-stone-600">Destination</th>
                  <th className="text-left p-3 font-medium text-stone-600">Land</th>
                  <th className="text-left p-3 font-medium text-stone-600">Datum</th>
                  <th className="text-right p-3 font-medium text-stone-600">Dagar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {trips.map((trip, i) => (
                  <tr
                    key={i}
                    onClick={() => toggleTrip(i)}
                    className={`cursor-pointer transition-colors ${
                      trip.selected ? "bg-white hover:bg-stone-50" : "bg-stone-50 opacity-50"
                    }`}
                  >
                    <td className="p-3 text-center">
                      {trip.selected
                        ? <CheckSquare size={16} className="text-emerald-700 mx-auto" />
                        : <Square size={16} className="text-stone-400 mx-auto" />}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <MapPin size={13} className="text-stone-400 shrink-0" />
                        <span className="font-medium text-stone-800">{trip.destination}</span>
                      </div>
                    </td>
                    <td className="p-3 text-stone-600">{trip.land}</td>
                    <td className="p-3 text-stone-500">
                      {new Date(trip.startDatum).toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric" })}
                      {" – "}
                      {new Date(trip.slutDatum).toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="p-3 text-right text-stone-500">{trip.dagar}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => { setTrips([]); setFileName(""); setError(""); setStep("upload"); }}
              className="text-sm text-stone-500 hover:text-stone-700"
            >
              ← Ladda annan fil
            </button>
            <div className="flex items-center gap-3">
              <span className="text-sm text-stone-500">{selectedCount} av {trips.length} valda</span>
              <button
                onClick={handleImport}
                disabled={selectedCount === 0 || importing}
                className="flex items-center gap-2 bg-emerald-700 text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {importing
                  ? <><Loader2 size={15} className="animate-spin" /> Importerar…</>
                  : <><Upload size={15} /> Importera {selectedCount} {selectedCount === 1 ? "resa" : "resor"}</>}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

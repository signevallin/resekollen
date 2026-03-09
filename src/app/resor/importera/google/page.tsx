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
  GitMerge,
  GripVertical,
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

// Parse "geo:58.3126,12.3271" → {lat, lon}
function parseGeoUri(s: string): { lat: number; lon: number } | null {
  const m = s.match(/^geo:([-\d.]+),([-\d.]+)/);
  if (!m) return null;
  return { lat: parseFloat(m[1]), lon: parseFloat(m[2]) };
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

// ─── HTML extraction ──────────────────────────────────────────────────────────
// Google's newest export embeds timeline data as JSON inside a <script> tag.
// We find the JSON object by locating known key names and bracket-matching.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractJsonFromHtml(html: string): any | null {
  const markers = ['"semanticSegments"', '"timelineObjects"', '"locations"'];

  for (const marker of markers) {
    const idx = html.indexOf(marker);
    if (idx < 0) continue;

    // Walk backward from marker to find the root opening brace
    let depth = 0, start = -1;
    for (let i = idx - 1; i >= 0; i--) {
      const c = html[i];
      if (c === "}") depth++;
      else if (c === "{") {
        if (depth === 0) { start = i; break; }
        depth--;
      }
    }
    if (start < 0) continue;

    // Walk forward to find the matching closing brace
    depth = 0; let end = -1;
    for (let i = start; i < html.length; i++) {
      const c = html[i];
      if (c === "{") depth++;
      else if (c === "}") { depth--; if (depth === 0) { end = i; break; } }
    }
    if (end < 0) continue;

    try { return JSON.parse(html.slice(start, end + 1)); } catch { continue; }
  }
  return null;
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

// ─── location-history.json format (flat array, geo: URIs) ───────────────────

async function parseLocationHistoryFormat(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[],
  onProgress: (done: number, total: number) => void
): Promise<DetectedTrip[]> {
  type RawVisit = { lat: number; lon: number; start: Date; end: Date };

  const visits: RawVisit[] = data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((s: any) => s?.visit?.topCandidate?.placeLocation && s.visit.hierarchyLevel === "0")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((s: any) => {
      const coords = parseGeoUri(s.visit.topCandidate.placeLocation);
      if (!coords) return null;
      return { ...coords, start: new Date(s.startTime), end: new Date(s.endTime) };
    })
    .filter((v): v is RawVisit => {
      if (!v) return false;
      const hours = (v.end.getTime() - v.start.getTime()) / (1000 * 60 * 60);
      return hours >= 8 && !isNaN(v.start.getTime());
    });

  const uniqueCells = [...new Set(visits.map((v) => cellKey(v.lat, v.lon)))];
  const geoCache = new Map<string, { city: string; country: string }>();

  for (let i = 0; i < uniqueCells.length; i++) {
    const [lat, lon] = uniqueCells[i].split(",").map(Number);
    const result = await reverseGeocode(lat, lon);
    if (result) geoCache.set(uniqueCells[i], result);
    onProgress(i + 1, uniqueCells.length);
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
  const [dragIndex,     setDragIndex]     = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // ── File handling ──────────────────────────────────────────────────────────

  const handleFile = useCallback((file: File) => {
    setError(""); setTrips([]); setDoneCount(0); setStep("upload");

    const isJson = file.name.endsWith(".json");
    const isHtml = file.name.endsWith(".html") || file.name.endsWith(".htm");
    if (!isJson && !isHtml) {
      setError("Välj en .json- eller .html-fil från Google Tidslinje.");
      return;
    }
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const raw = e.target?.result as string;

        // HTML-export: extract embedded JSON first
        let data = isHtml ? extractJsonFromHtml(raw) : JSON.parse(raw);
        if (isHtml && !data) {
          setError(
            "Kunde inte hitta tidslinjedata i HTML-filen. " +
            "Google bäddar in data på olika sätt beroende på version — " +
            "prova att öppna HTML-filen i din webbläsare, högerklicka → Visa källkod, " +
            "och kontrollera om det finns en JSON-fil att ladda ner därifrån."
          );
          setStep("upload");
          return;
        }
        if (!data) data = JSON.parse(raw);

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
          // ── New format (Timeline.json): async geocoding ──
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
        } else if (Array.isArray(data) && data.some((s: unknown) => (s as Record<string, unknown>)?.visit || (s as Record<string, unknown>)?.activity)) {
          // ── location-history.json format: async geocoding ──
          setStep("geocoding");
          const detected = await parseLocationHistoryFormat(data, (done, total) =>
            setGeoProgress({ done, total })
          );
          if (!detected.length) {
            setError("Inga platser hittades i location-history.json.");
            setStep("upload");
            return;
          }
          setTrips(detected);
          setStep("preview");
        } else {
          setError(
            "Okänt filformat. Prova Tidslinje.html, Timeline.json, location-history.json eller en månads-JSON från Google Takeout."
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

  // ── Merge selected trips ───────────────────────────────────────────────────

  const handleMerge = () => {
    const selectedIndices = trips
      .map((t, i) => (t.selected ? i : -1))
      .filter((i) => i >= 0);
    if (selectedIndices.length < 2) return;

    const selectedTrips = selectedIndices.map((i) => trips[i]);

    // Unique destinations and countries, preserving order
    const destinations = selectedTrips
      .map((t) => t.destination)
      .filter((d, i, arr) => arr.indexOf(d) === i);
    const countries = selectedTrips
      .map((t) => t.land)
      .filter((c, i, arr) => arr.indexOf(c) === i);

    // Earliest start, latest end
    const allStarts = selectedTrips.map((t) => t.startDatum).sort();
    const allEnds   = selectedTrips.map((t) => t.slutDatum).sort();
    const startDatum = allStarts[0];
    const slutDatum  = allEnds[allEnds.length - 1];

    const merged: DetectedTrip = {
      destination: destinations.join(" · "),
      land:        countries.join(" · "),
      startDatum,
      slutDatum,
      dagar:    daysBetween(startDatum, slutDatum),
      selected: true,
    };

    // Replace selected trips with merged entry at position of first selected
    const firstIdx = selectedIndices[0];
    const remaining = trips.filter((_, i) => !selectedIndices.includes(i));
    remaining.splice(firstIdx, 0, merged);
    setTrips(remaining);
  };

  // ── Drag-to-merge ──────────────────────────────────────────────────────────

  const mergeTwoTrips = (idxA: number, idxB: number) => {
    const a = trips[idxA];
    const b = trips[idxB];
    const byDate = [a, b].sort((x, y) => x.startDatum.localeCompare(y.startDatum));
    const dests  = byDate.map((t) => t.destination).filter((d, i, arr) => arr.indexOf(d) === i);
    const lands  = byDate.map((t) => t.land).filter((c, i, arr) => arr.indexOf(c) === i);
    const allStarts = [a.startDatum, b.startDatum].sort();
    const allEnds   = [a.slutDatum,  b.slutDatum ].sort();
    const startDatum = allStarts[0];
    const slutDatum  = allEnds[allEnds.length - 1];
    const merged: DetectedTrip = {
      destination: dests.join(" · "),
      land:        lands.join(" · "),
      startDatum,  slutDatum,
      dagar:    daysBetween(startDatum, slutDatum),
      selected: a.selected || b.selected,
    };
    const minIdx = Math.min(idxA, idxB);
    const rest   = trips.filter((_, i) => i !== idxA && i !== idxB);
    rest.splice(minIdx, 0, merged);
    setTrips(rest);
  };

  const handleDragStart = (e: React.DragEvent, i: number) => {
    setDragIndex(i);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragIndex !== null && dragIndex !== i) setDragOverIndex(i);
  };
  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null); setDragOverIndex(null); return;
    }
    mergeTwoTrips(dragIndex, targetIndex);
    setDragIndex(null); setDragOverIndex(null);
  };
  const handleDragEnd = () => { setDragIndex(null); setDragOverIndex(null); };

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
          Stöder <code className="bg-stone-100 px-1 rounded">Tidslinje.html</code>,{" "}
          <code className="bg-stone-100 px-1 rounded">location-history.json</code>,{" "}
          <code className="bg-stone-100 px-1 rounded">Timeline.json</code> och äldre månadsformat.
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
            Ladda upp filen du hittar i <code className="bg-stone-200 px-1 rounded">Takeout/Platshistorik/</code>:<br />
            <span className="text-stone-500 leading-6">
              <code className="bg-stone-200 px-1 rounded">Tidslinje.html</code> &nbsp;·&nbsp;
              <code className="bg-stone-200 px-1 rounded">location-history.json</code> &nbsp;·&nbsp;
              <code className="bg-stone-200 px-1 rounded">Timeline.json</code> &nbsp;·&nbsp;
              eller en månadsfil från <code className="bg-stone-200 px-1 rounded">Semantic Location History/</code>
            </span>
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
          <p className="font-medium text-stone-600">Dra och släpp filen här</p>
          <p className="text-stone-400 text-sm mt-1">eller klicka för att välja fil</p>
          <p className="text-stone-300 text-xs mt-2">.html · .json</p>
          <input ref={fileRef} type="file" accept=".json,.html,.htm" className="hidden" onChange={onInputChange} />
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
          <p className="text-xs text-stone-400 mb-2 flex items-center gap-1.5">
            <GripVertical size={12} />
            Dra en rad och släpp den på en annan för att slå ihop dem — eller markera flera och klicka "Slå ihop".
          </p>

          <div className="border border-stone-200 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="w-14 p-3" />
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
                    onDragOver={(e) => handleDragOver(e, i)}
                    onDragLeave={() => setDragOverIndex(null)}
                    onDrop={(e) => handleDrop(e, i)}
                    onClick={() => toggleTrip(i)}
                    className={`transition-all ${
                      dragIndex === i
                        ? "opacity-30 bg-stone-50"
                        : dragOverIndex === i
                        ? "ring-2 ring-inset ring-emerald-500 bg-emerald-50"
                        : trip.selected
                        ? "bg-white hover:bg-stone-50 cursor-pointer"
                        : "bg-stone-50 opacity-50 cursor-pointer"
                    }`}
                  >
                    <td className="p-3 w-14">
                      <div className="flex items-center gap-2">
                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, i)}
                          onDragEnd={handleDragEnd}
                          onClick={(e) => e.stopPropagation()}
                          className="cursor-grab active:cursor-grabbing text-stone-400 hover:text-stone-600 transition-colors shrink-0"
                          title="Dra för att slå ihop"
                        >
                          <GripVertical size={15} />
                        </div>
                        {trip.selected
                          ? <CheckSquare size={15} className="text-emerald-700 shrink-0" />
                          : <Square size={15} className="text-stone-400 shrink-0" />}
                      </div>
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
              {selectedCount >= 2 && (
                <button
                  onClick={handleMerge}
                  className="flex items-center gap-2 border border-stone-300 text-stone-600 rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-stone-50 transition-colors"
                  title="Slå ihop de markerade resorna till en resa"
                >
                  <GitMerge size={15} /> Slå ihop {selectedCount} valda
                </button>
              )}
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

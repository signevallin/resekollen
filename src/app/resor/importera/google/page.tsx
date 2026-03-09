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
} from "lucide-react";
import { importerGoogleResor, type TripToImport } from "@/app/actions/importGoogle";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DetectedTrip {
  destination: string;
  land: string;
  startDatum: string; // YYYY-MM-DD
  slutDatum: string;  // YYYY-MM-DD
  dagar: number;
  selected: boolean;
}

// ─── Parsing helpers ──────────────────────────────────────────────────────────

function toDateStr(iso: string): string {
  return iso.split("T")[0];
}

function daysBetween(start: string, end: string): number {
  const d1 = new Date(start);
  const d2 = new Date(end);
  return Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
}

function extractCountry(address: string): string {
  if (!address) return "";
  const parts = address.split(",").map((s) => s.trim()).filter(Boolean);
  return parts[parts.length - 1] ?? "";
}

function extractCity(locationName: string, address: string): string {
  // The location `name` from Google is usually the place/city name
  if (locationName && locationName.length > 1) return locationName;
  if (!address) return "Okänd plats";
  const parts = address.split(",").map((s) => s.trim()).filter(Boolean);
  // Strip leading postal codes (e.g. "75001 Paris" → "Paris")
  const cleaned = parts.map((p) => p.replace(/^\d{4,6}\s*/, "").trim());
  if (cleaned.length >= 2) return cleaned[cleaned.length - 2];
  return cleaned[0] || "Okänd plats";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseGoogleTimeline(data: any): DetectedTrip[] {
  const objects: unknown[] = data?.timelineObjects ?? [];

  type RawVisit = {
    destination: string;
    land: string;
    start: Date;
    end: Date;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw: RawVisit[] = (objects as any[])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((o: any) => o?.placeVisit)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((o: any) => {
      const pv = o.placeVisit;
      const loc = pv?.location ?? {};
      const start = new Date(pv?.duration?.startTimestamp ?? "");
      const end   = new Date(pv?.duration?.endTimestamp   ?? "");
      return {
        destination: extractCity(loc.name ?? "", loc.address ?? ""),
        land:        extractCountry(loc.address ?? ""),
        start,
        end,
      };
    })
    .filter((v: RawVisit) => {
      const hours = (v.end.getTime() - v.start.getTime()) / (1000 * 60 * 60);
      return hours >= 12 && v.land !== "" && !isNaN(v.start.getTime());
    })
    .sort((a: RawVisit, b: RawVisit) => a.start.getTime() - b.start.getTime());

  // Merge adjacent visits to the same destination (gap ≤ 2 days)
  const merged: DetectedTrip[] = [];
  for (const v of raw) {
    const last = merged[merged.length - 1];
    const samePlace = last && last.destination === v.destination && last.land === v.land;
    const gapDays = last
      ? (v.start.getTime() - new Date(last.slutDatum).getTime()) / (1000 * 60 * 60 * 24)
      : 999;

    if (samePlace && gapDays <= 2) {
      last.slutDatum = toDateStr(v.end.toISOString());
      last.dagar     = daysBetween(last.startDatum, last.slutDatum);
    } else {
      const startDatum = toDateStr(v.start.toISOString());
      const slutDatum  = toDateStr(v.end.toISOString());
      merged.push({
        destination: v.destination,
        land:        v.land,
        startDatum,
        slutDatum,
        dagar:    daysBetween(startDatum, slutDatum),
        selected: true,
      });
    }
  }

  return merged.reverse(); // newest first
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GoogleImportPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [trips, setTrips]         = useState<DetectedTrip[]>([]);
  const [fileName, setFileName]   = useState("");
  const [error, setError]         = useState("");
  const [parsing, setParsing]     = useState(false);
  const [importing, setImporting] = useState(false);
  const [done, setDone]           = useState(0);

  // ── File handling ──────────────────────────────────────────────────────────

  const handleFile = useCallback((file: File) => {
    setError("");
    setTrips([]);
    setDone(0);

    if (!file.name.endsWith(".json")) {
      setError("Välj en .json-fil från Google Tidslinje.");
      return;
    }

    setFileName(file.name);
    setParsing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        const detected = parseGoogleTimeline(data);
        if (detected.length === 0) {
          setError(
            "Inga platser hittades i filen. Kontrollera att det är en Semantic Location History-fil (inte den nya Timeline.json)."
          );
        } else {
          setTrips(detected);
        }
      } catch {
        setError("Kunde inte läsa filen. Är det en giltig JSON-fil?");
      } finally {
        setParsing(false);
      }
    };
    reader.readAsText(file);
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  // ── Selection ──────────────────────────────────────────────────────────────

  const toggleTrip = (i: number) =>
    setTrips((prev) =>
      prev.map((t, idx) => (idx === i ? { ...t, selected: !t.selected } : t))
    );

  const toggleAll = () => {
    const allSelected = trips.every((t) => t.selected);
    setTrips((prev) => prev.map((t) => ({ ...t, selected: !allSelected })));
  };

  const selectedCount = trips.filter((t) => t.selected).length;

  // ── Import ─────────────────────────────────────────────────────────────────

  const handleImport = async () => {
    const toImport: TripToImport[] = trips
      .filter((t) => t.selected)
      .map(({ destination, land, startDatum, slutDatum }) => ({
        destination,
        land,
        startDatum,
        slutDatum,
      }));

    if (toImport.length === 0) return;
    setImporting(true);

    const result = await importerGoogleResor(toImport);

    if ("error" in result && result.error) {
      setError(result.error);
      setImporting(false);
      return;
    }

    setDone(result.count ?? toImport.length);
    setImporting(false);
    setTimeout(() => router.push("/resor"), 1800);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/resor"
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 mb-4"
        >
          <ArrowLeft size={14} /> Tillbaka till resor
        </Link>
        <h1 className="text-2xl font-bold text-stone-800">Importera från Google Tidslinje</h1>
        <p className="text-stone-500 text-sm mt-1">
          Ladda upp en månadsfil från Google Takeout för att importera dina besökta platser.
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 mb-6 text-sm text-stone-600 space-y-2">
        <p className="font-medium text-stone-700">Hur exporterar du?</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Gå till <a href="https://takeout.google.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-stone-800">takeout.google.com</a></li>
          <li>Välj <strong>Platshistorik (tidslinje)</strong> och klicka Nästa steg</li>
          <li>Ladda ner ZIP-filen och packa upp den</li>
          <li>
            Gå till <code className="bg-stone-200 px-1 rounded">Takeout/Platshistorik/Semantic Location History/</code>
          </li>
          <li>Ladda upp en valfri månads-JSON-fil (t.ex. <code className="bg-stone-200 px-1 rounded">2023_JUNI.json</code>)</li>
        </ol>
        <p className="text-stone-400 text-xs pt-1">
          ⚠️ Stöder det äldre månadsformatet. Den nya <code>Timeline.json</code>-filen stöds inte ännu.
        </p>
      </div>

      {/* Upload area */}
      {!trips.length && !parsing && (
        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-stone-300 rounded-xl p-12 text-center cursor-pointer hover:border-emerald-700 hover:bg-stone-50 transition-colors"
        >
          <FileJson className="mx-auto text-stone-400 mb-3" size={36} />
          <p className="font-medium text-stone-600">Dra och släpp JSON-fil här</p>
          <p className="text-stone-400 text-sm mt-1">eller klicka för att välja fil</p>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={onInputChange}
          />
        </div>
      )}

      {/* Parsing spinner */}
      {parsing && (
        <div className="flex items-center justify-center gap-3 py-16 text-stone-500">
          <Loader2 className="animate-spin" size={22} />
          <span>Analyserar {fileName}…</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mt-4 text-sm text-red-700">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Fel vid inläsning</p>
            <p>{error}</p>
            <button
              onClick={() => { setError(""); setFileName(""); fileRef.current?.click(); }}
              className="underline mt-1 hover:text-red-800"
            >
              Försök igen
            </button>
          </div>
        </div>
      )}

      {/* Success */}
      {done > 0 && (
        <div className="flex items-center gap-3 bg-emerald-100 border border-emerald-200 rounded-xl p-4 text-emerald-800">
          <CheckCircle2 size={20} />
          <p className="font-medium">{done} resor importerade! Skickar dig vidare…</p>
        </div>
      )}

      {/* Preview table */}
      {trips.length > 0 && done === 0 && (
        <>
          {/* Summary row */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-stone-600">
              <span className="font-medium">{trips.length}</span> platser hittades i{" "}
              <span className="font-medium">{fileName}</span>
            </p>
            <button
              onClick={toggleAll}
              className="text-sm text-stone-500 hover:text-stone-800 underline"
            >
              {trips.every((t) => t.selected) ? "Avmarkera alla" : "Markera alla"}
            </button>
          </div>

          {/* Table */}
          <div className="border border-stone-200 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="w-10 p-3"></th>
                  <th className="text-left p-3 text-stone-600 font-medium">Destination</th>
                  <th className="text-left p-3 text-stone-600 font-medium">Land</th>
                  <th className="text-left p-3 text-stone-600 font-medium">Datum</th>
                  <th className="text-right p-3 text-stone-600 font-medium">Dagar</th>
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
                      {trip.selected ? (
                        <CheckSquare size={16} className="text-emerald-700 mx-auto" />
                      ) : (
                        <Square size={16} className="text-stone-400 mx-auto" />
                      )}
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

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => { setTrips([]); setFileName(""); setError(""); }}
              className="text-sm text-stone-500 hover:text-stone-700"
            >
              ← Ladda annan fil
            </button>
            <div className="flex items-center gap-3">
              <span className="text-sm text-stone-500">
                {selectedCount} av {trips.length} valda
              </span>
              <button
                onClick={handleImport}
                disabled={selectedCount === 0 || importing}
                className="flex items-center gap-2 bg-emerald-700 text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {importing ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Importerar…
                  </>
                ) : (
                  <>
                    <Upload size={15} />
                    Importera {selectedCount} {selectedCount === 1 ? "resa" : "resor"}
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

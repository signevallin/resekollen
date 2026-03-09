"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  Upload,
  CheckSquare,
  Square,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MapPin,
} from "lucide-react";
import { importerGoogleResor, type TripToImport } from "@/app/actions/importGoogle";

interface PhotoTrip {
  destination: string;
  land:        string;
  startDatum:  string;
  slutDatum:   string;
  photoCount:  number;
  selected:    boolean;
}

function daysBetween(a: string, b: string) {
  return Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000) + 1);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric" });
}

export default function ImporteraFotonPage() {
  const router   = useRouter();
  const fileRef  = useRef<HTMLInputElement>(null);

  const [trips,     setTrips]     = useState<PhotoTrip[] | null>(null);
  const [error,     setError]     = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [done,      setDone]      = useState<number | null>(null);

  // ── Läs JSON-fil ────────────────────────────────────────────────────────────
  const handleFile = (file: File) => {
    setError(null);
    setTrips(null);
    setDone(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw = JSON.parse(e.target?.result as string);
        if (!Array.isArray(raw)) throw new Error("Filen måste innehålla en JSON-array.");
        const parsed: PhotoTrip[] = raw.map((r: Record<string, unknown>, i: number) => {
          if (!r.startDatum || !r.slutDatum || !r.destination || !r.land) {
            throw new Error(`Post ${i + 1} saknar obligatoriska fält.`);
          }
          return {
            destination: String(r.destination),
            land:        String(r.land),
            startDatum:  String(r.startDatum),
            slutDatum:   String(r.slutDatum),
            photoCount:  Number(r.photoCount ?? 0),
            selected:    true,
          };
        });
        setTrips(parsed.sort((a, b) => b.startDatum.localeCompare(a.startDatum)));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Kunde inte läsa filen.");
      }
    };
    reader.readAsText(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const toggleAll = () => {
    const allSelected = trips!.every((t) => t.selected);
    setTrips(trips!.map((t) => ({ ...t, selected: !allSelected })));
  };

  const toggle = (i: number) => {
    setTrips(trips!.map((t, j) => j === i ? { ...t, selected: !t.selected } : t));
  };

  // ── Importera ────────────────────────────────────────────────────────────────
  const handleImport = async () => {
    if (!trips) return;
    const selected: TripToImport[] = trips
      .filter((t) => t.selected)
      .map(({ destination, land, startDatum, slutDatum }) => ({
        destination, land, startDatum, slutDatum,
      }));
    if (!selected.length) return;

    setImporting(true);
    try {
      const res = await importerGoogleResor(selected);
      if (res && "error" in res) { setError(res.error); return; }
      setDone(res?.count ?? selected.length);
      setTimeout(() => router.push("/resor"), 1800);
    } finally {
      setImporting(false);
    }
  };

  const selected = trips?.filter((t) => t.selected) ?? [];

  // ── UI ───────────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/resor/importera" className="text-stone-400 hover:text-stone-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="bg-amber-100 p-2.5 rounded-xl">
          <Camera className="text-amber-600" size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-stone-800">Importera från foton</h1>
          <p className="text-sm text-stone-500">Ladda upp trips.json från extraktionsskriptet</p>
        </div>
      </div>

      {/* Instruktioner */}
      {!trips && !done && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800 space-y-1.5">
          <p className="font-semibold">Hur du gör:</p>
          <ol className="list-decimal list-inside space-y-1 text-amber-700">
            <li>Öppna Terminal och gå till projektmappen</li>
            <li className="font-mono text-xs bg-amber-100 px-2 py-0.5 rounded">
              python3 scripts/extract_photo_trips.py
            </li>
            <li>Ladda upp den genererade <span className="font-mono">scripts/trips.json</span> här</li>
          </ol>
        </div>
      )}

      {/* Klart! */}
      {done !== null && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-emerald-100 p-4 rounded-full mb-4">
            <CheckCircle2 className="text-emerald-600" size={32} />
          </div>
          <p className="text-lg font-semibold text-stone-800">
            {done} {done === 1 ? "resa" : "resor"} importerade!
          </p>
          <p className="text-sm text-stone-400 mt-1">Skickar dig vidare…</p>
        </div>
      )}

      {/* Filuppladdning */}
      {!trips && done === null && (
        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-stone-300 rounded-xl p-12 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-all"
        >
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={onFileChange} />
          <Upload className="text-stone-300 mx-auto mb-3" size={36} />
          <p className="font-medium text-stone-600">Dra hit trips.json eller klicka för att välja</p>
          <p className="text-xs text-stone-400 mt-1">JSON-fil från extract_photo_trips.py</p>
        </div>
      )}

      {/* Fel */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mt-4 text-sm">
          <AlertCircle size={16} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Förhandsvisning */}
      {trips && done === null && (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-stone-500">
              {selected.length} av {trips.length} resor valda
            </p>
            <button onClick={toggleAll} className="text-xs text-stone-400 hover:text-stone-600 flex items-center gap-1.5">
              {trips.every((t) => t.selected)
                ? <><CheckSquare size={13} /> Avmarkera alla</>
                : <><Square size={13} /> Markera alla</>}
            </button>
          </div>

          <div className="space-y-2 mb-6">
            {trips.map((trip, i) => {
              const days = daysBetween(trip.startDatum, trip.slutDatum);
              return (
                <div
                  key={i}
                  onClick={() => toggle(i)}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    trip.selected
                      ? "bg-white border-stone-200 hover:border-amber-300"
                      : "bg-stone-50 border-stone-100 opacity-50"
                  }`}
                >
                  {trip.selected
                    ? <CheckSquare size={16} className="text-amber-500 flex-shrink-0" />
                    : <Square size={16} className="text-stone-300 flex-shrink-0" />}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={11} className="text-stone-400 flex-shrink-0" />
                      <span className="font-medium text-stone-800 text-sm truncate">
                        {trip.destination}
                      </span>
                      <span className="text-stone-400 text-xs">·</span>
                      <span className="text-stone-500 text-xs truncate">{trip.land}</span>
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {formatDate(trip.startDatum)} – {formatDate(trip.slutDatum)}
                      {" · "}{days} {days === 1 ? "dag" : "dagar"}
                      {trip.photoCount > 0 && ` · ${trip.photoCount} foton`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleImport}
            disabled={importing || selected.length === 0}
            className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
          >
            {importing ? (
              <><Loader2 size={16} className="animate-spin" /> Importerar…</>
            ) : (
              `Importera ${selected.length} ${selected.length === 1 ? "resa" : "resor"}`
            )}
          </button>
        </>
      )}
    </div>
  );
}

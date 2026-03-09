"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { updateResa, deleteResa } from "@/app/actions/resor";
import type { Resa } from "@/lib/schema";
import LandInput from "@/components/resor/LandInput";

function parseLand(raw: string): string[] {
  return raw
    .split(/\s*·\s*|\s*,\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function RedigeraResaForm({ resa }: { resa: Resa }) {
  const [destination, setDestination] = useState(resa.destination);
  const [countries,   setCountries]   = useState<string[]>(parseLand(resa.land));
  const [startDatum,  setStartDatum]  = useState(resa.startDatum);
  const [slutDatum,   setSlutDatum]   = useState(resa.slutDatum);
  const [beskrivning, setBeskrivning] = useState(resa.beskrivning ?? "");
  const [showDelete,  setShowDelete]  = useState(false);

  const [saving,   startSave]   = useTransition();
  const [deleting, startDelete] = useTransition();

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData();
    fd.set("destination", destination);
    fd.set("land",        countries.join(" · ") || destination);
    fd.set("startDatum",  startDatum);
    fd.set("slutDatum",   slutDatum);
    fd.set("beskrivning", beskrivning);
    startSave(() => updateResa(resa.id, fd));
  };

  const handleDelete = () => {
    startDelete(() => deleteResa(resa.id));
  };

  // ── UI ─────────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/resor/${resa.id}`}
          className="text-stone-400 hover:text-stone-600 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-stone-800">Redigera resa</h1>
          <p className="text-sm text-stone-400">{resa.destination}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Destination */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            Destination
          </label>
          <input
            type="text"
            required
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="t.ex. Rom"
            className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 text-stone-800"
          />
          <p className="text-xs text-stone-400 mt-1">
            Använd <span className="font-mono">·</span> för att separera flera städer, t.ex.{" "}
            <span className="font-mono text-stone-500">Rom · Florens</span>
          </p>
        </div>

        {/* Countries */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            Land / länder
          </label>
          <LandInput
            value={countries}
            onChange={setCountries}
            ringColor="focus-within:ring-purple-400"
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Startdatum
            </label>
            <input
              type="date"
              required
              value={startDatum}
              onChange={(e) => setStartDatum(e.target.value)}
              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Slutdatum
            </label>
            <input
              type="date"
              required
              value={slutDatum}
              min={startDatum}
              onChange={(e) => setSlutDatum(e.target.value)}
              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            Beskrivning <span className="text-stone-400 font-normal">(valfritt)</span>
          </label>
          <textarea
            rows={3}
            value={beskrivning}
            onChange={(e) => setBeskrivning(e.target.value)}
            placeholder="Kort beskrivning av resan…"
            className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          {/* Delete */}
          {!showDelete ? (
            <button
              type="button"
              onClick={() => setShowDelete(true)}
              className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={14} /> Ta bort resa
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-red-600 font-medium">Ta bort permanent?</span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg px-3 py-1.5 font-medium disabled:opacity-50 transition-colors"
              >
                {deleting ? "Tar bort…" : "Ja, ta bort"}
              </button>
              <button
                type="button"
                onClick={() => setShowDelete(false)}
                className="text-sm text-stone-400 hover:text-stone-600"
              >
                Avbryt
              </button>
            </div>
          )}

          {/* Save */}
          <button
            type="submit"
            disabled={saving || countries.length === 0}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-5 py-2.5 text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {saving
              ? <><Loader2 size={15} className="animate-spin" /> Sparar…</>
              : "Spara ändringar"}
          </button>
        </div>
      </form>
    </div>
  );
}

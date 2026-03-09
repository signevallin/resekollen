"use client";

import { useState, useTransition } from "react";
import { createResa } from "@/app/actions/resor";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import LandInput from "@/components/resor/LandInput";

export default function NyResaPage() {
  const [countries,  setCountries]  = useState<string[]>([]);
  const [startDatum, setStartDatum] = useState("");
  const [slutDatum,  setSlutDatum]  = useState("");
  const [saving, startSave] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("land", countries.join(" · ") || (fd.get("destination") as string));
    startSave(() => createResa(fd));
  };

  return (
    <div className="max-w-xl mx-auto">
      <Link
        href="/resor"
        className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Tillbaka
      </Link>

      <div className="bg-white rounded-2xl border border-stone-200 p-8">
        <h1 className="text-xl font-bold text-stone-800 mb-6">Logga en ny resa</h1>
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Destination */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Destination
            </label>
            <input
              name="destination"
              type="text"
              required
              placeholder="t.ex. Lissabon"
              className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Countries */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Land / länder
            </label>
            <LandInput value={countries} onChange={setCountries} />
            <p className="text-xs text-stone-400 mt-1.5">
              Skriv och välj från listan — du kan lägga till flera länder
            </p>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Startdatum
              </label>
              <input
                name="startDatum"
                type="date"
                required
                value={startDatum}
                onChange={(e) => setStartDatum(e.target.value)}
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Slutdatum
              </label>
              <input
                name="slutDatum"
                type="date"
                required
                min={startDatum}
                value={slutDatum}
                onChange={(e) => setSlutDatum(e.target.value)}
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Beskrivning
            </label>
            <textarea
              name="beskrivning"
              rows={3}
              placeholder="Vad är det för resa? (valfritt)"
              className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving || countries.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-emerald-700 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-emerald-800 transition-colors disabled:opacity-50"
          >
            {saving
              ? <><Loader2 size={15} className="animate-spin" /> Sparar…</>
              : "Spara resa"}
          </button>
        </form>
      </div>
    </div>
  );
}

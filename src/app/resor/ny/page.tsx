"use client";

import { createResa } from "@/app/actions/resor";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NyResaPage() {

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
        <form action={createResa} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Destination</label>
              <input name="destination" type="text" required
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="t.ex. Lissabon" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Land</label>
              <input name="land" type="text" required
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="t.ex. Portugal" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Startdatum</label>
              <input name="startDatum" type="date" required
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Slutdatum</label>
              <input name="slutDatum" type="date" required
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Beskrivning</label>
            <textarea name="beskrivning" rows={3}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              placeholder="Vad är det för resa? (valfritt)" />
          </div>
          <button type="submit"
            className="w-full bg-emerald-700 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-emerald-800 transition-colors">
            Spara resa
          </button>
        </form>
      </div>
    </div>
  );
}

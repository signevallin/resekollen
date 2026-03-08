"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NyResaPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    destination: "",
    land: "",
    startDatum: "",
    slutDatum: "",
    beskrivning: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const doc = await addDoc(collection(db, "resor"), {
        ...form,
        userId: user.uid,
        skapadAd: serverTimestamp(),
        uppdateradAd: serverTimestamp(),
      });
      router.push(`/resor/${doc.id}`);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Destination</label>
              <input
                type="text"
                required
                value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="t.ex. Lissabon"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Land</label>
              <input
                type="text"
                required
                value={form.land}
                onChange={(e) => setForm({ ...form, land: e.target.value })}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="t.ex. Portugal"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Startdatum</label>
              <input
                type="date"
                required
                value={form.startDatum}
                onChange={(e) => setForm({ ...form, startDatum: e.target.value })}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Slutdatum</label>
              <input
                type="date"
                required
                value={form.slutDatum}
                onChange={(e) => setForm({ ...form, slutDatum: e.target.value })}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Beskrivning</label>
            <textarea
              value={form.beskrivning}
              onChange={(e) => setForm({ ...form, beskrivning: e.target.value })}
              rows={3}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              placeholder="Vad är det för resa? (valfritt)"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-700 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-emerald-800 transition-colors disabled:opacity-50"
          >
            {loading ? "Sparar..." : "Spara resa"}
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  collection, query, where, orderBy, onSnapshot,
  addDoc, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { DagboksInlagg } from "@/types";
import Link from "next/link";
import { ArrowLeft, Plus, BookOpen } from "lucide-react";

export default function DagbokPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [inlagg, setInlagg] = useState<DagboksInlagg[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ datum: "", titel: "", innehall: "" });

  useEffect(() => {
    if (!loading && !user) router.replace("/auth");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "dagbok"),
      where("resaId", "==", id),
      where("userId", "==", user.uid),
      orderBy("datum", "desc")
    );
    return onSnapshot(q, (snap) => {
      setInlagg(snap.docs.map((d) => ({ id: d.id, ...d.data() } as DagboksInlagg)));
    });
  }, [user, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    await addDoc(collection(db, "dagbok"), {
      ...form,
      resaId: id,
      userId: user.uid,
      skapadAd: serverTimestamp(),
    });
    setForm({ datum: "", titel: "", innehall: "" });
    setShowForm(false);
    setSaving(false);
  };

  if (loading) return <div className="text-center py-20 text-stone-400">Laddar...</div>;

  return (
    <div>
      <Link
        href={`/resor/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Tillbaka till resan
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-stone-800">Resedagbok</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-amber-500 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-amber-600 transition-colors"
        >
          <Plus size={16} />
          Nytt inlägg
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-stone-200 p-6 mb-6">
          <h2 className="font-semibold text-stone-700 mb-4">Nytt dagboksinlägg</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Datum</label>
                <input
                  type="date"
                  required
                  value={form.datum}
                  onChange={(e) => setForm({ ...form, datum: e.target.value })}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Titel</label>
                <input
                  type="text"
                  required
                  value={form.titel}
                  onChange={(e) => setForm({ ...form, titel: e.target.value })}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="t.ex. Ankomstdag i Rom"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Inlägg</label>
              <textarea
                required
                rows={5}
                value={form.innehall}
                onChange={(e) => setForm({ ...form, innehall: e.target.value })}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                placeholder="Vad hände idag?"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="bg-amber-500 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                {saving ? "Sparar..." : "Spara"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-stone-500 hover:text-stone-800 text-sm px-3 py-2 transition-colors"
              >
                Avbryt
              </button>
            </div>
          </form>
        </div>
      )}

      {inlagg.length === 0 && !showForm ? (
        <div className="text-center py-16">
          <div className="bg-amber-100 p-4 rounded-full inline-flex mb-4">
            <BookOpen className="text-amber-500" size={28} />
          </div>
          <p className="text-stone-500 text-sm">Inga dagboksinlägg ännu. Skriv ditt första!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {inlagg.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-stone-200 p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-stone-800">{item.titel}</h3>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {new Date(item.datum).toLocaleDateString("sv-SE", {
                      weekday: "long", year: "numeric", month: "long", day: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-wrap">{item.innehall}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

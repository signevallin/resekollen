"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  collection, query, where, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { PacklistaItem, PACKLISTA_KATEGORIER } from "@/types";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, ListChecks } from "lucide-react";

export default function PacklistaPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<PacklistaItem[]>([]);
  const [nyItem, setNyItem] = useState("");
  const [kategori, setKategori] = useState<string>(PACKLISTA_KATEGORIER[0]);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "packlista"),
      where("resaId", "==", id),
      where("userId", "==", user.uid),
      orderBy("skapadAd", "asc")
    );
    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as PacklistaItem)));
    });
  }, [user, id]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !nyItem.trim()) return;
    setAdding(true);
    await addDoc(collection(db, "packlista"), {
      namn: nyItem.trim(),
      kategori,
      packad: false,
      resaId: id,
      userId: user.uid,
      skapadAd: serverTimestamp(),
    });
    setNyItem("");
    setAdding(false);
  };

  const togglePackad = async (item: PacklistaItem) => {
    await updateDoc(doc(db, "packlista", item.id), { packad: !item.packad });
  };

  const handleDelete = async (itemId: string) => {
    await deleteDoc(doc(db, "packlista", itemId));
  };

  const grupperadeItems = PACKLISTA_KATEGORIER.reduce((acc, kat) => {
    const katItems = items.filter((i) => i.kategori === kat);
    if (katItems.length > 0) acc[kat] = katItems;
    return acc;
  }, {} as Record<string, PacklistaItem[]>);

  const packade = items.filter((i) => i.packad).length;

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

      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-bold text-stone-800">Packlista</h1>
        {items.length > 0 && (
          <span className="text-sm text-stone-500">
            {packade} / {items.length} packade
          </span>
        )}
      </div>

      {items.length > 0 && (
        <div className="w-full bg-stone-100 rounded-full h-2 mb-6">
          <div
            className="bg-emerald-500 h-2 rounded-full transition-all"
            style={{ width: `${(packade / items.length) * 100}%` }}
          />
        </div>
      )}

      <div className="bg-white rounded-xl border border-stone-200 p-5 mb-6">
        <form onSubmit={handleAdd} className="flex gap-3">
          <select
            value={kategori}
            onChange={(e) => setKategori(e.target.value)}
            className="border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          >
            {PACKLISTA_KATEGORIER.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          <input
            type="text"
            value={nyItem}
            onChange={(e) => setNyItem(e.target.value)}
            placeholder="Lägg till sak..."
            className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="submit"
            disabled={adding || !nyItem.trim()}
            className="flex items-center gap-1.5 bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Plus size={16} />
            Lägg till
          </button>
        </form>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-blue-100 p-4 rounded-full inline-flex mb-4">
            <ListChecks className="text-blue-500" size={28} />
          </div>
          <p className="text-stone-500 text-sm">Tom packlista. Börja lägga till saker!</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grupperadeItems).map(([kat, katItems]) => (
            <div key={kat}>
              <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">{kat}</h3>
              <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-100">
                {katItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={item.packad}
                      onChange={() => togglePackad(item)}
                      className="w-4 h-4 accent-emerald-600 cursor-pointer"
                    />
                    <span className={`flex-1 text-sm ${item.packad ? "line-through text-stone-400" : "text-stone-700"}`}>
                      {item.namn}
                    </span>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-stone-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Resa } from "@/types";
import Link from "next/link";
import { MapPin, PlusCircle, Calendar, Globe } from "lucide-react";

export default function ResorPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [resor, setResor] = useState<Resa[]>([]);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "resor"),
      where("userId", "==", user.uid),
      orderBy("startDatum", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setResor(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Resa)));
    });
    return unsub;
  }, [user]);

  if (loading) return <div className="text-center py-20 text-stone-400">Laddar...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Mina resor</h1>
          <p className="text-stone-500 text-sm mt-1">
            {resor.length} {resor.length === 1 ? "resa" : "resor"} loggade
          </p>
        </div>
        <Link
          href="/resor/ny"
          className="flex items-center gap-2 bg-emerald-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-emerald-800 transition-colors"
        >
          <PlusCircle size={16} />
          Ny resa
        </Link>
      </div>

      {resor.length === 0 ? (
        <div className="text-center py-20">
          <div className="bg-emerald-100 p-4 rounded-full inline-flex mb-4">
            <Globe className="text-emerald-600" size={32} />
          </div>
          <h2 className="text-lg font-semibold text-stone-700 mb-2">Inga resor ännu</h2>
          <p className="text-stone-400 text-sm mb-6">Logga din första resa och börja samla minnen!</p>
          <Link
            href="/resor/ny"
            className="inline-flex items-center gap-2 bg-emerald-700 text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-emerald-800 transition-colors"
          >
            <PlusCircle size={16} />
            Logga din första resa
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {resor.map((resa) => (
            <Link
              key={resa.id}
              href={`/resor/${resa.id}`}
              className="bg-white rounded-xl border border-stone-200 overflow-hidden hover:shadow-md transition-shadow group"
            >
              <div className="h-36 bg-gradient-to-br from-emerald-400 to-teal-600 relative flex items-center justify-center">
                {resa.omslagsbild ? (
                  <img src={resa.omslagsbild} alt={resa.destination} className="w-full h-full object-cover" />
                ) : (
                  <MapPin className="text-white/60" size={40} />
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-stone-800 group-hover:text-emerald-700 transition-colors">
                  {resa.destination}
                </h3>
                <p className="text-sm text-stone-500 mt-0.5">{resa.land}</p>
                <div className="flex items-center gap-1.5 mt-3 text-xs text-stone-400">
                  <Calendar size={12} />
                  <span>
                    {new Date(resa.startDatum).toLocaleDateString("sv-SE")} –{" "}
                    {new Date(resa.slutDatum).toLocaleDateString("sv-SE")}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

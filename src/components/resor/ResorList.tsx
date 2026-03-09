"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Calendar, Loader2 } from "lucide-react";
import { slaIhopResor } from "@/app/actions/slaIhopResor";
import type { Resa } from "@/lib/schema";

function daysBetween(start: string, end: string) {
  return Math.max(
    1,
    Math.round(
      (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1
  );
}

export default function ResorList({ trips }: { trips: Resa[] }) {
  const router = useRouter();
  const [dragId,     setDragId]     = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [merging,    setMerging]    = useState(false);

  const handleDrop = async (sourceId: string, targetId: string) => {
    if (!sourceId || sourceId === targetId) return;

    const a = trips.find((t) => t.id === sourceId)!;
    const b = trips.find((t) => t.id === targetId)!;
    if (!a || !b) return;

    const [first, second] = [a, b].sort((x, y) =>
      x.startDatum.localeCompare(y.startDatum)
    );
    const dests   = [a.destination, b.destination].filter((d, i, arr) => arr.indexOf(d) === i);
    const lands   = [first.land, second.land].filter((c, i, arr) => arr.indexOf(c) === i);
    const slutDatum = [a.slutDatum, b.slutDatum].sort().reverse()[0];

    setMerging(true);
    try {
      await slaIhopResor(first.id, second.id, {
        destination: dests.join(" · "),
        land:        lands.join(" · "),
        startDatum:  first.startDatum,
        slutDatum,
      });
      router.refresh();
    } finally {
      setMerging(false);
      setDragId(null);
      setDragOverId(null);
    }
  };

  return (
    <>
      {/* Merge spinner overlay */}
      {merging && (
        <div className="fixed inset-0 bg-white/60 flex items-center justify-center z-50">
          <div className="flex items-center gap-3 bg-white border border-stone-200 rounded-xl px-6 py-4 shadow-lg">
            <Loader2 className="animate-spin text-emerald-700" size={20} />
            <span className="text-sm font-medium text-stone-700">Slår ihop…</span>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {trips.map((resa) => {
          const isDragging = dragId     === resa.id;
          const isTarget   = dragOverId === resa.id;

          const cardClass = `bg-white rounded-xl border overflow-hidden transition-all cursor-pointer ${
            isDragging ? "opacity-30 scale-95 border-stone-200"
            : isTarget ? "border-emerald-500 ring-2 ring-emerald-400 shadow-lg"
            :            "border-stone-200 hover:shadow-md"
          }`;

          return (
            <div
              key={resa.id}
              draggable
              onClick={() => router.push(`/resor/${resa.id}`)}
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", resa.id);
                e.dataTransfer.effectAllowed = "move";
                setDragId(resa.id);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (dragId !== resa.id) setDragOverId(resa.id);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOverId(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                const srcId = e.dataTransfer.getData("text/plain");
                setDragOverId(null);
                setDragId(null);
                handleDrop(srcId, resa.id);
              }}
              onDragEnd={() => { setDragId(null); setDragOverId(null); }}
              className={cardClass}
            >
              <div className="h-36 bg-gradient-to-br from-emerald-400 to-teal-600 relative flex items-center justify-center">
                {resa.omslagsbild ? (
                  <img src={resa.omslagsbild} alt={resa.destination} className="w-full h-full object-cover" />
                ) : (
                  <MapPin className="text-white/60" size={40} />
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-stone-800">{resa.destination}</h3>
                <p className="text-sm text-stone-500 mt-0.5">{resa.land}</p>
                <div className="flex items-center gap-1.5 mt-3 text-xs text-stone-400">
                  <Calendar size={12} />
                  <span>
                    {new Date(resa.startDatum).toLocaleDateString("sv-SE")} –{" "}
                    {new Date(resa.slutDatum).toLocaleDateString("sv-SE")}
                  </span>
                  <span className="ml-auto">
                    {daysBetween(resa.startDatum, resa.slutDatum)} dagar
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

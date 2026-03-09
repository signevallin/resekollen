"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, ArrowRight, Loader2 } from "lucide-react";
import { slaIhopResor } from "@/app/actions/slaIhopResor";
import { getCountryFlag } from "@/lib/countries";
import type { Resa } from "@/lib/schema";

function daysBetween(start: string, end: string): number {
  return Math.max(
    1,
    Math.round(
      (new Date(end).getTime() - new Date(start).getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1
  );
}

export default function TidslinjeList({ trips }: { trips: Resa[] }) {
  const router = useRouter();
  const [dragId,     setDragId]     = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [merging,    setMerging]    = useState(false);

  // Group by year, newest first
  const resorPerAr: Record<string, Resa[]> = {};
  trips.forEach((t) => {
    const year = t.startDatum.slice(0, 4);
    if (!resorPerAr[year]) resorPerAr[year] = [];
    resorPerAr[year].push(t);
  });
  const years = Object.keys(resorPerAr).sort((a, b) => b.localeCompare(a));

  const handleDrop = async (sourceId: string, targetId: string) => {
    if (!sourceId || sourceId === targetId) return;

    const a = trips.find((t) => t.id === sourceId)!;
    const b = trips.find((t) => t.id === targetId)!;
    if (!a || !b) return;

    const [first, second] = [a, b].sort((x, y) =>
      x.startDatum.localeCompare(y.startDatum)
    );
    const dests = [a.destination, b.destination].filter(
      (d, i, arr) => arr.indexOf(d) === i
    );
    const lands = [first.land, second.land].filter(
      (c, i, arr) => arr.indexOf(c) === i
    );
    const slutDatum = [a.slutDatum, b.slutDatum].sort().reverse()[0];

    setMerging(true);
    try {
      await slaIhopResor(first.id, second.id, {
        destination: dests.join(" · "),
        land: lands.join(" · "),
        startDatum: first.startDatum,
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
            <Loader2 className="animate-spin text-purple-600" size={20} />
            <span className="text-sm font-medium text-stone-700">Slår ihop…</span>
          </div>
        </div>
      )}

      {/* Timeline grouped by year */}
      <div className="space-y-10">
        {years.map((year) => (
          <div key={year}>
            {/* Year header */}
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-lg font-bold text-stone-700">{year}</h2>
              <div className="flex-1 h-px bg-stone-200" />
              <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                {resorPerAr[year].length}{" "}
                {resorPerAr[year].length === 1 ? "resa" : "resor"}
              </span>
            </div>

            {/* Timeline */}
            <div className="relative pl-7">
              <div className="absolute left-2.5 top-0 bottom-0 w-px bg-stone-200" />

              <div className="space-y-4">
                {resorPerAr[year].map((resa) => {
                  const startDate = new Date(resa.startDatum);
                  const endDate   = new Date(resa.slutDatum);
                  const days      = daysBetween(resa.startDatum, resa.slutDatum);
                  const flag      = getCountryFlag(resa.land);

                  const startFormatted = startDate.toLocaleDateString("sv-SE", {
                    day: "numeric", month: "short",
                  });
                  const endFormatted = endDate.toLocaleDateString("sv-SE", {
                    day: "numeric", month: "short",
                  });

                  const isDragging = dragId     === resa.id;
                  const isTarget   = dragOverId === resa.id;

                  const dotClass = `absolute -left-4 top-5 w-3 h-3 rounded-full border-2 border-white shadow-sm transition-all ${
                    isTarget   ? "bg-emerald-500 scale-125"
                    : isDragging ? "bg-stone-300"
                    :              "bg-purple-400"
                  }`;

                  const cardClass = `bg-white rounded-xl border p-4 transition-all cursor-pointer ${
                    isDragging ? "opacity-30 scale-95 border-stone-200"
                    : isTarget ? "border-emerald-500 ring-2 ring-emerald-400 shadow-lg"
                    :            "border-stone-200 hover:border-purple-200 hover:shadow-sm group"
                  }`;

                  return (
                    <div key={resa.id} className="relative">
                      <div className={dotClass} />

                      <div
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
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xl">{flag}</span>
                              <h3 className="font-semibold text-stone-800 truncate">
                                {resa.destination}
                              </h3>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-400">
                              <span className="flex items-center gap-1">
                                <MapPin size={11} />
                                {resa.land}
                              </span>
                              <span>·</span>
                              <span>
                                {startFormatted}
                                {resa.startDatum !== resa.slutDatum ? ` – ${endFormatted}` : ""}
                              </span>
                              <span>·</span>
                              <span>{days} {days === 1 ? "dag" : "dagar"}</span>
                            </div>
                          </div>
                          <ArrowRight
                            size={15}
                            className="text-stone-300 group-hover:text-purple-400 flex-shrink-0 mt-1 transition-colors"
                          />
                        </div>

                        {resa.beskrivning && (
                          <p className="text-xs text-stone-400 mt-2.5 line-clamp-2 leading-relaxed">
                            {resa.beskrivning}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

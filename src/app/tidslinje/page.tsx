import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { resor } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";
import Link from "next/link";
import { Clock, MapPin, ArrowRight } from "lucide-react";
import { getCountryFlag } from "@/lib/countries";

function daysBetween(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);
}

export default async function TidslinjePage() {
  const session = await auth();
  if (!session) redirect("/auth");

  const trips = await db
    .select()
    .from(resor)
    .where(eq(resor.userId, session.user.id))
    .orderBy(asc(resor.startDatum));

  // Group by year, show newest first
  const resorPerAr: Record<string, typeof trips> = {};
  trips.forEach((t) => {
    const year = t.startDatum.slice(0, 4);
    if (!resorPerAr[year]) resorPerAr[year] = [];
    resorPerAr[year].push(t);
  });
  const years = Object.keys(resorPerAr).sort((a, b) => b.localeCompare(a));

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-purple-100 p-2.5 rounded-xl">
          <Clock className="text-purple-600" size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-stone-800">Tidslinje</h1>
          <p className="text-sm text-stone-500">
            {trips.length} {trips.length === 1 ? "resa" : "resor"} totalt
          </p>
        </div>
      </div>

      {trips.length === 0 ? (
        <div className="text-center py-20">
          <div className="bg-purple-100 p-4 rounded-full inline-flex mb-4">
            <Clock className="text-purple-400" size={28} />
          </div>
          <p className="text-stone-500 text-sm mb-4">
            Inga resor än. Lägg till din första resa!
          </p>
          <Link
            href="/resor/ny"
            className="inline-flex items-center gap-1.5 text-sm text-purple-600 hover:underline"
          >
            Lägg till resa <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
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
                {/* Vertical line */}
                <div className="absolute left-2.5 top-0 bottom-0 w-px bg-stone-200" />

                <div className="space-y-4">
                  {resorPerAr[year].map((resa) => {
                    const startDate = new Date(resa.startDatum);
                    const endDate = new Date(resa.slutDatum);
                    const days = daysBetween(resa.startDatum, resa.slutDatum);
                    const flag = getCountryFlag(resa.land);

                    const startFormatted = startDate.toLocaleDateString("sv-SE", {
                      day: "numeric",
                      month: "short",
                    });
                    const endFormatted = endDate.toLocaleDateString("sv-SE", {
                      day: "numeric",
                      month: "short",
                    });

                    return (
                      <div key={resa.id} className="relative">
                        {/* Timeline dot */}
                        <div className="absolute -left-4 top-5 w-3 h-3 rounded-full bg-purple-400 border-2 border-white shadow-sm" />

                        <Link href={`/resor/${resa.id}`}>
                          <div className="bg-white rounded-xl border border-stone-200 p-4 hover:border-purple-200 hover:shadow-sm transition-all group">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                {/* Destination + flag */}
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xl">{flag}</span>
                                  <h3 className="font-semibold text-stone-800 truncate">
                                    {resa.destination}
                                  </h3>
                                </div>
                                {/* Meta */}
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-400">
                                  <span className="flex items-center gap-1">
                                    <MapPin size={11} />
                                    {resa.land}
                                  </span>
                                  <span>·</span>
                                  <span>
                                    {startFormatted}
                                    {resa.startDatum !== resa.slutDatum
                                      ? ` – ${endFormatted}`
                                      : ""}
                                  </span>
                                  <span>·</span>
                                  <span>
                                    {days} {days === 1 ? "dag" : "dagar"}
                                  </span>
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
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { resor } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { BarChart3, Globe, MapPin, Clock, Plane } from "lucide-react";
import { getCountryFlag } from "@/lib/countries";

function daysBetween(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);
}

export default async function StatistikPage() {
  const session = await auth();
  if (!session) redirect("/auth");

  const trips = await db
    .select()
    .from(resor)
    .where(eq(resor.userId, session.user.id));

  const totalResor = trips.length;
  const unikaLander = new Set(trips.map((t) => t.land.trim().toLowerCase())).size;
  const unikaDestinationer = new Set(trips.map((t) => t.destination.trim().toLowerCase())).size;
  const totalDagar = trips.reduce(
    (sum, t) => sum + daysBetween(t.startDatum, t.slutDatum),
    0
  );

  // Trips by year (bar chart)
  const resorPerAr: Record<string, number> = {};
  trips.forEach((t) => {
    const year = t.startDatum.slice(0, 4);
    resorPerAr[year] = (resorPerAr[year] ?? 0) + 1;
  });
  const sortedYears = Object.entries(resorPerAr).sort((a, b) => a[0].localeCompare(b[0]));
  const maxCount = Math.max(...Object.values(resorPerAr), 1);

  // Top countries
  const landerCount: Record<string, number> = {};
  trips.forEach((t) => {
    const key = t.land.trim();
    landerCount[key] = (landerCount[key] ?? 0) + 1;
  });
  const topLander = Object.entries(landerCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const stats = [
    {
      label: "Resor totalt",
      value: totalResor,
      icon: Plane,
      bg: "bg-blue-100",
      text: "text-blue-600",
    },
    {
      label: "Länder besökta",
      value: unikaLander,
      icon: Globe,
      bg: "bg-emerald-100",
      text: "text-emerald-600",
    },
    {
      label: "Destinationer",
      value: unikaDestinationer,
      icon: MapPin,
      bg: "bg-purple-100",
      text: "text-purple-600",
    },
    {
      label: "Resdagar totalt",
      value: totalDagar,
      icon: Clock,
      bg: "bg-amber-100",
      text: "text-amber-600",
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 p-2.5 rounded-xl">
          <BarChart3 className="text-blue-600" size={22} />
        </div>
        <h1 className="text-xl font-bold text-stone-800">Statistik</h1>
      </div>

      {totalResor === 0 ? (
        <div className="text-center py-20">
          <p className="text-stone-400 text-sm">
            Lägg till resor för att se din resestatistik
          </p>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {stats.map((s) => (
              <div
                key={s.label}
                className="bg-white rounded-2xl border border-stone-200 p-5"
              >
                <div className={`inline-flex p-2 rounded-lg mb-3 ${s.bg}`}>
                  <s.icon className={s.text} size={18} />
                </div>
                <p className="text-3xl font-bold text-stone-800">{s.value}</p>
                <p className="text-sm text-stone-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Top countries */}
          {topLander.length > 0 && (
            <div className="bg-white rounded-2xl border border-stone-200 p-5 mb-6">
              <h2 className="font-semibold text-stone-700 mb-4">Mest besökta länder</h2>
              <div className="space-y-3">
                {topLander.map(([land, count], i) => (
                  <div key={land} className="flex items-center gap-3">
                    <span className="text-xs text-stone-400 w-4 text-right">
                      {i + 1}
                    </span>
                    <span className="text-xl">{getCountryFlag(land)}</span>
                    <span className="flex-1 text-sm text-stone-700">{land}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-stone-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{
                            width: `${(count / topLander[0][1]) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-stone-600 w-4 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resor per år */}
          {sortedYears.length > 0 && (
            <div className="bg-white rounded-2xl border border-stone-200 p-5">
              <h2 className="font-semibold text-stone-700 mb-4">Resor per år</h2>
              <div className="space-y-3">
                {sortedYears.map(([year, count]) => (
                  <div key={year} className="flex items-center gap-3">
                    <span className="text-sm text-stone-500 w-10 flex-shrink-0">
                      {year}
                    </span>
                    <div className="flex-1 bg-stone-100 rounded-full h-6 overflow-hidden relative">
                      <div
                        className="bg-blue-500 h-full rounded-full transition-all duration-500 flex items-center justify-end"
                        style={{ width: `${(count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-stone-700 w-4 text-right">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

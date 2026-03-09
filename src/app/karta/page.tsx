import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { resor } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { lookupCountry, getFlagEmoji, getCountryNumericCode, splitLand } from "@/lib/countries";
import WorldMap from "@/components/karta/WorldMap";
import { Globe } from "lucide-react";

export default async function KartaPage() {
  const session = await auth();
  if (!session) redirect("/auth");

  const trips = await db
    .select()
    .from(resor)
    .where(eq(resor.userId, session.user.id));

  // Build unique countries with trip counts
  const countryMap = new Map<string, { name: string; alpha2: string; count: number }>();
  for (const trip of trips) {
    for (const countryName of splitLand(trip.land)) {
      const key = countryName.trim().toLowerCase();
      const entry = lookupCountry(countryName);
      if (countryMap.has(key)) {
        countryMap.get(key)!.count++;
      } else {
        countryMap.set(key, {
          name: countryName.trim(),
          alpha2: entry?.alpha2 ?? "",
          count: 1,
        });
      }
    }
  }

  const uniqueCountries = [...countryMap.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "sv")
  );

  // ISO numeric codes for the map (deduplicated)
  const visitedNumerics = [
    ...new Set(
      trips
        .flatMap((t) => splitLand(t.land))
        .map((c) => getCountryNumericCode(c))
        .filter((n): n is number => n !== null)
    ),
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-emerald-100 p-2.5 rounded-xl">
          <Globe className="text-emerald-600" size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-stone-800">Världskarta</h1>
          <p className="text-sm text-stone-500">
            {uniqueCountries.length}{" "}
            {uniqueCountries.length === 1 ? "besökt land" : "besökta länder"}
          </p>
        </div>
      </div>

      {/* Map */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 mb-6 overflow-hidden">
        <WorldMap visitedNumerics={visitedNumerics} />
        <div className="flex items-center gap-4 mt-3 px-1">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
            <span className="text-xs text-stone-500">Besökt</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-stone-300 inline-block" />
            <span className="text-xs text-stone-500">Inte besökt</span>
          </div>
        </div>
      </div>

      {/* Country grid */}
      {uniqueCountries.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-stone-400 text-sm">
            Lägg till resor för att se besökta länder på kartan
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {uniqueCountries.map((c) => (
            <div
              key={c.name}
              className="bg-white rounded-xl border border-stone-200 p-3 flex items-center gap-3"
            >
              <span className="text-2xl flex-shrink-0">
                {c.alpha2 ? getFlagEmoji(c.alpha2) : "🌍"}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-stone-700 truncate">{c.name}</p>
                <p className="text-xs text-stone-400">
                  {c.count} {c.count === 1 ? "resa" : "resor"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

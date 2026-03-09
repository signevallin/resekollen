import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { resor } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import Link from "next/link";
import { ArrowLeft, BookOpen, ListChecks, Calendar, MapPin } from "lucide-react";

export default async function ResaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/auth");

  const [resa] = await db
    .select()
    .from(resor)
    .where(and(eq(resor.id, id), eq(resor.userId, session.user.id)));

  if (!resa) notFound();

  const dagar =
    Math.ceil(
      (new Date(resa.slutDatum).getTime() - new Date(resa.startDatum).getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1;

  return (
    <div>
      <Link
        href="/resor"
        className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Mina resor
      </Link>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden mb-6">
        <div className="h-48 bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
          {resa.omslagsbild ? (
            <img src={resa.omslagsbild} alt={resa.destination} className="w-full h-full object-cover" />
          ) : (
            <MapPin className="text-white/50" size={56} />
          )}
        </div>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-stone-800">{resa.destination}</h1>
          <p className="text-stone-500">{resa.land}</p>
          <div className="flex items-center gap-1.5 mt-2 text-sm text-stone-400">
            <Calendar size={14} />
            <span>
              {new Date(resa.startDatum).toLocaleDateString("sv-SE")} –{" "}
              {new Date(resa.slutDatum).toLocaleDateString("sv-SE")}
            </span>
            <span className="text-stone-300">·</span>
            <span>{dagar} dagar</span>
          </div>
          {resa.beskrivning && (
            <p className="mt-4 text-stone-600 text-sm leading-relaxed">{resa.beskrivning}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href={`/resor/${id}/dagbok`}
          className="bg-white rounded-xl border border-stone-200 p-6 hover:shadow-md transition-shadow group"
        >
          <div className="bg-amber-100 p-3 rounded-full inline-flex mb-4">
            <BookOpen className="text-amber-600" size={22} />
          </div>
          <h2 className="font-semibold text-stone-800 group-hover:text-amber-600 transition-colors">Resedagbok</h2>
          <p className="text-sm text-stone-400 mt-1">Skriv dagboksinlägg och spara minnen från resan</p>
        </Link>

        <Link
          href={`/resor/${id}/packlista`}
          className="bg-white rounded-xl border border-stone-200 p-6 hover:shadow-md transition-shadow group"
        >
          <div className="bg-blue-100 p-3 rounded-full inline-flex mb-4">
            <ListChecks className="text-blue-600" size={22} />
          </div>
          <h2 className="font-semibold text-stone-800 group-hover:text-blue-600 transition-colors">Packlista</h2>
          <p className="text-sm text-stone-400 mt-1">Håll koll på vad du behöver packa</p>
        </Link>
      </div>
    </div>
  );
}

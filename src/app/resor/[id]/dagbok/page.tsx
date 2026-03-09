import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { dagbokInlagg } from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";
import { createInlagg, deleteInlagg } from "@/app/actions/dagbok";
import Link from "next/link";
import { ArrowLeft, BookOpen, Trash2 } from "lucide-react";

export default async function DagbokPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/auth");

  const inlagg = await db
    .select()
    .from(dagbokInlagg)
    .where(
      and(eq(dagbokInlagg.resaId, id), eq(dagbokInlagg.userId, session.user.id))
    )
    .orderBy(desc(dagbokInlagg.datum));

  return (
    <div>
      <Link
        href={`/resor/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Tillbaka till resan
      </Link>

      <h1 className="text-xl font-bold text-stone-800 mb-6">Resedagbok</h1>

      {/* Formulär för nytt inlägg */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 mb-8">
        <h2 className="font-semibold text-stone-700 mb-4">Nytt inlägg</h2>
        <form action={createInlagg.bind(null, id)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Datum</label>
              <input
                name="datum"
                type="date"
                required
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Titel</label>
              <input
                name="titel"
                type="text"
                required
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="t.ex. Ankomstdag i Rom"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Inlägg</label>
            <textarea
              name="innehall"
              required
              rows={5}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
              placeholder="Vad hände idag?"
            />
          </div>
          <button
            type="submit"
            className="bg-amber-500 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-amber-600 transition-colors"
          >
            Spara inlägg
          </button>
        </form>
      </div>

      {/* Lista med inlägg */}
      {inlagg.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-amber-100 p-4 rounded-full inline-flex mb-4">
            <BookOpen className="text-amber-500" size={28} />
          </div>
          <p className="text-stone-500 text-sm">Inga inlägg ännu. Skriv ditt första!</p>
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
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <form action={deleteInlagg.bind(null, item.id, id)}>
                  <button
                    type="submit"
                    className="text-stone-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </form>
              </div>
              <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-wrap">
                {item.innehall}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

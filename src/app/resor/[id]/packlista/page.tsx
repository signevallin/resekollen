import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { packlistaItems } from "@/lib/schema";
import { eq, and, asc } from "drizzle-orm";
import { addItem, toggleItem, deleteItem } from "@/app/actions/packlista";
import Link from "next/link";
import { ArrowLeft, ListChecks, Trash2 } from "lucide-react";

const KATEGORIER = ["Kläder", "Hygien", "Elektronik", "Dokument", "Medicin", "Övrigt"] as const;

export default async function PacklistaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/auth");

  const items = await db
    .select()
    .from(packlistaItems)
    .where(
      and(eq(packlistaItems.resaId, id), eq(packlistaItems.userId, session.user.id))
    )
    .orderBy(asc(packlistaItems.skapadAt));

  const packade = items.filter((i) => i.packad).length;

  const grupperadeItems = KATEGORIER.reduce((acc, kat) => {
    const katItems = items.filter((i) => i.kategori === kat);
    if (katItems.length > 0) acc[kat] = katItems;
    return acc;
  }, {} as Record<string, typeof items>);

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

      {/* Lägg till formulär */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 mb-6">
        <form action={addItem.bind(null, id)} className="flex gap-3">
          <select
            name="kategori"
            className="border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          >
            {KATEGORIER.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          <input
            name="namn"
            type="text"
            required
            placeholder="Lägg till sak..."
            className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Lägg till
          </button>
        </form>
      </div>

      {/* Lista */}
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
              <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
                {kat}
              </h3>
              <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-100">
                {katItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                    <form action={toggleItem.bind(null, item.id, id, !item.packad)}>
                      <button type="submit" className="flex items-center gap-3">
                        <span
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            item.packad
                              ? "bg-emerald-500 border-emerald-500"
                              : "border-stone-300"
                          }`}
                        >
                          {item.packad && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        <span
                          className={`text-sm ${
                            item.packad ? "line-through text-stone-400" : "text-stone-700"
                          }`}
                        >
                          {item.namn}
                        </span>
                      </button>
                    </form>
                    <div className="flex-1" />
                    <form action={deleteItem.bind(null, item.id, id)}>
                      <button type="submit" className="text-stone-300 hover:text-red-400 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </form>
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

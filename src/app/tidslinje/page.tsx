import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { resor } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";
import TidslinjeList from "@/components/tidslinje/TidslinjeList";

export default async function TidslinjePage() {
  const session = await auth();
  if (!session) redirect("/auth");

  const trips = await db
    .select()
    .from(resor)
    .where(eq(resor.userId, session.user.id))
    .orderBy(desc(resor.startDatum));

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
        <TidslinjeList trips={trips} />
      )}
    </div>
  );
}

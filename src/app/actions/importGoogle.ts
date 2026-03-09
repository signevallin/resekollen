"use server";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { resor } from "@/lib/schema";

export interface TripToImport {
  destination: string;
  land: string;
  startDatum: string; // YYYY-MM-DD
  slutDatum: string;  // YYYY-MM-DD
}

export async function importerGoogleResor(trips: TripToImport[]) {
  const session = await auth();
  if (!session) redirect("/auth");

  if (!trips || trips.length === 0) {
    return { error: "Inga resor att importera." };
  }

  const values = trips.map((t) => ({
    userId: session.user.id,
    destination: t.destination.trim(),
    land: t.land.trim(),
    startDatum: t.startDatum,
    slutDatum: t.slutDatum,
    beskrivning: "",
  }));

  await db.insert(resor).values(values);

  return { count: values.length };
}

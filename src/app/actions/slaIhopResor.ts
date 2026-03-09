"use server";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { resor } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function slaIhopResor(
  behallaId: string,
  raderaId: string,
  data: { destination: string; land: string; startDatum: string; slutDatum: string }
) {
  const session = await auth();
  if (!session) redirect("/auth");

  await db
    .update(resor)
    .set({
      destination: data.destination,
      land: data.land,
      startDatum: data.startDatum,
      slutDatum: data.slutDatum,
    })
    .where(and(eq(resor.id, behallaId), eq(resor.userId, session.user.id)));

  await db
    .delete(resor)
    .where(and(eq(resor.id, raderaId), eq(resor.userId, session.user.id)));
}

"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { resor } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createResa(formData: FormData) {
  const session = await auth();
  if (!session) redirect("/auth");

  const [ny] = await db
    .insert(resor)
    .values({
      userId: session.user.id,
      destination: formData.get("destination") as string,
      land: formData.get("land") as string,
      startDatum: formData.get("startDatum") as string,
      slutDatum: formData.get("slutDatum") as string,
      beskrivning: (formData.get("beskrivning") as string) || null,
    })
    .returning();

  redirect(`/resor/${ny.id}`);
}

export async function updateResa(resaId: string, formData: FormData) {
  const session = await auth();
  if (!session) redirect("/auth");

  await db
    .update(resor)
    .set({
      destination:  formData.get("destination")  as string,
      land:         formData.get("land")          as string,
      startDatum:   formData.get("startDatum")    as string,
      slutDatum:    formData.get("slutDatum")      as string,
      beskrivning: (formData.get("beskrivning")   as string) || null,
      uppdateradAt: new Date(),
    })
    .where(and(eq(resor.id, resaId), eq(resor.userId, session.user.id)));

  revalidatePath(`/resor/${resaId}`);
  revalidatePath("/resor");
  redirect(`/resor/${resaId}`);
}

export async function deleteResa(resaId: string) {
  const session = await auth();
  if (!session) return;

  await db
    .delete(resor)
    .where(and(eq(resor.id, resaId), eq(resor.userId, session.user.id)));

  revalidatePath("/resor");
  redirect("/resor");
}

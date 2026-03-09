"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { packlistaItems } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function addItem(resaId: string, formData: FormData) {
  const session = await auth();
  if (!session) return;

  await db.insert(packlistaItems).values({
    resaId,
    userId: session.user.id,
    namn: formData.get("namn") as string,
    kategori: formData.get("kategori") as string,
    packad: false,
  });

  revalidatePath(`/resor/${resaId}/packlista`);
}

export async function toggleItem(itemId: string, resaId: string, packad: boolean) {
  const session = await auth();
  if (!session) return;

  await db
    .update(packlistaItems)
    .set({ packad })
    .where(
      and(
        eq(packlistaItems.id, itemId),
        eq(packlistaItems.userId, session.user.id)
      )
    );

  revalidatePath(`/resor/${resaId}/packlista`);
}

export async function deleteItem(itemId: string, resaId: string) {
  const session = await auth();
  if (!session) return;

  await db
    .delete(packlistaItems)
    .where(
      and(
        eq(packlistaItems.id, itemId),
        eq(packlistaItems.userId, session.user.id)
      )
    );

  revalidatePath(`/resor/${resaId}/packlista`);
}

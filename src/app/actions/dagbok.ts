"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { dagbokInlagg } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createInlagg(resaId: string, formData: FormData) {
  const session = await auth();
  if (!session) return;

  await db.insert(dagbokInlagg).values({
    resaId,
    userId: session.user.id,
    datum: formData.get("datum") as string,
    titel: formData.get("titel") as string,
    innehall: formData.get("innehall") as string,
  });

  revalidatePath(`/resor/${resaId}/dagbok`);
}

export async function deleteInlagg(inlaggId: string, resaId: string) {
  const session = await auth();
  if (!session) return;

  await db
    .delete(dagbokInlagg)
    .where(
      and(
        eq(dagbokInlagg.id, inlaggId),
        eq(dagbokInlagg.userId, session.user.id)
      )
    );

  revalidatePath(`/resor/${resaId}/dagbok`);
}

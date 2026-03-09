import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { resor } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import RedigeraResaForm from "@/components/resor/RedigeraResaForm";

export default async function RedigeraResaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/auth");

  const [resa] = await db
    .select()
    .from(resor)
    .where(and(eq(resor.id, id), eq(resor.userId, session.user.id)));

  if (!resa) notFound();

  return <RedigeraResaForm resa={resa} />;
}

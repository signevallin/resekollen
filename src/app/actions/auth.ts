"use server";

import { signIn } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";

export async function loginAction(formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/resor",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return "Fel e-post eller lösenord. Försök igen.";
    }
    throw error;
  }
}

export async function registerAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email));
  if (existing) return "E-postadressen används redan.";

  const hashed = await bcrypt.hash(password, 12);
  await db.insert(users).values({ email, name, password: hashed });

  try {
    await signIn("credentials", { email, password, redirectTo: "/resor" });
  } catch (error) {
    if (error instanceof AuthError) return "Inloggning misslyckades.";
    throw error;
  }
}

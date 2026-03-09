import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { MapPin, PlusCircle, LogOut } from "lucide-react";

export default async function Navbar() {
  const session = await auth();

  return (
    <nav className="bg-white border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/resor" className="text-xl font-bold text-emerald-700 tracking-tight">
          resekollen
        </Link>
        {session && (
          <div className="flex items-center gap-6">
            <Link
              href="/resor"
              className="flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-800 transition-colors"
            >
              <MapPin size={16} />
              Mina resor
            </Link>
            <Link
              href="/resor/ny"
              className="flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-800 transition-colors"
            >
              <PlusCircle size={16} />
              Ny resa
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/auth" });
              }}
            >
              <button
                type="submit"
                className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-red-500 transition-colors"
              >
                <LogOut size={16} />
                Logga ut
              </button>
            </form>
          </div>
        )}
      </div>
    </nav>
  );
}

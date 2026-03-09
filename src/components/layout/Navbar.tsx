import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { MapPin, PlusCircle, LogOut, Globe, BarChart3, Clock } from "lucide-react";

export default async function Navbar() {
  const session = await auth();

  return (
    <nav className="bg-white border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/resor" className="text-xl font-bold text-emerald-700 tracking-tight">
          resekollen
        </Link>
        {session && (
          <div className="flex items-center gap-5">
            <Link
              href="/resor"
              className="flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-800 transition-colors"
            >
              <MapPin size={16} />
              Resor
            </Link>
            <Link
              href="/karta"
              className="flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-800 transition-colors"
            >
              <Globe size={16} />
              Karta
            </Link>
            <Link
              href="/statistik"
              className="flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-800 transition-colors"
            >
              <BarChart3 size={16} />
              Statistik
            </Link>
            <Link
              href="/tidslinje"
              className="flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-800 transition-colors"
            >
              <Clock size={16} />
              Tidslinje
            </Link>
            <Link
              href="/resor/ny"
              className="flex items-center gap-1.5 text-sm font-medium bg-emerald-700 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-800 transition-colors"
            >
              <PlusCircle size={15} />
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
              </button>
            </form>
          </div>
        )}
      </div>
    </nav>
  );
}

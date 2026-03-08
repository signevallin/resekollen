"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { MapPin, PlusCircle, User, LogOut } from "lucide-react";

export default function Navbar() {
  const { user } = useAuth();
  const pathname = usePathname();

  const handleLogout = async () => {
    await signOut(auth);
  };

  const links = [
    { href: "/resor", label: "Mina resor", icon: MapPin },
    { href: "/resor/ny", label: "Ny resa", icon: PlusCircle },
    { href: "/profil", label: "Profil", icon: User },
  ];

  return (
    <nav className="bg-white border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/resor" className="text-xl font-bold text-emerald-700 tracking-tight">
          resekollen
        </Link>
        {user && (
          <div className="flex items-center gap-6">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                  pathname === href
                    ? "text-emerald-700"
                    : "text-stone-500 hover:text-stone-800"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-red-500 transition-colors"
            >
              <LogOut size={16} />
              Logga ut
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

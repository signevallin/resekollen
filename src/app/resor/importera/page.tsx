import Link from "next/link";
import { ArrowLeft, Map, Camera } from "lucide-react";

const options = [
  {
    href:        "/resor/importera/google",
    icon:        Map,
    iconBg:      "bg-emerald-100",
    iconColor:   "text-emerald-600",
    title:       "Google Maps Tidslinje",
    description: "Importera från Google Takeout (location-history.json eller HTML-fil)",
  },
  {
    href:        "/resor/importera/foton",
    icon:        Camera,
    iconBg:      "bg-amber-100",
    iconColor:   "text-amber-600",
    title:       "iCloud-foton",
    description: "Kör extraktionsskriptet lokalt och ladda upp trips.json",
  },
];

export default function ImporteraPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/resor" className="text-stone-400 hover:text-stone-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-stone-800">Importera resor</h1>
          <p className="text-sm text-stone-500">Välj datakälla</p>
        </div>
      </div>

      <div className="space-y-3">
        {options.map((opt) => (
          <Link
            key={opt.href}
            href={opt.href}
            className="flex items-center gap-4 bg-white border border-stone-200 rounded-xl p-4 hover:border-stone-300 hover:shadow-sm transition-all"
          >
            <div className={`${opt.iconBg} p-3 rounded-xl flex-shrink-0`}>
              <opt.icon className={opt.iconColor} size={22} />
            </div>
            <div>
              <p className="font-semibold text-stone-800">{opt.title}</p>
              <p className="text-sm text-stone-500 mt-0.5">{opt.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

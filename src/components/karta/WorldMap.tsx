"use client";

import { useEffect, useState } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";

interface Props {
  visitedNumerics: number[];
}

interface CountryPath {
  id: string;
  d: string;
  visited: boolean;
}

export default function WorldMap({ visitedNumerics }: Props) {
  const [paths, setPaths] = useState<CountryPath[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const visited = new Set(visitedNumerics);
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then((r) => r.json())
      .then((topology: Topology) => {
        const width = 900;
        const height = 500;
        const projection = geoNaturalEarth1()
          .scale(153)
          .translate([width / 2, height / 2]);
        const pathGen = geoPath().projection(projection);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const countries = feature(topology, topology.objects.countries as any) as any;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result: CountryPath[] = countries.features.map((f: any) => ({
          id: String(f.id),
          d: pathGen(f) ?? "",
          visited: visited.has(Number(f.id)),
        }));

        setPaths(result);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [visitedNumerics]);

  if (loading) {
    return (
      <div className="w-full h-56 bg-stone-50 rounded-xl flex items-center justify-center">
        <p className="text-stone-400 text-sm animate-pulse">Laddar karta...</p>
      </div>
    );
  }

  return (
    <svg
      viewBox="0 0 900 500"
      className="w-full rounded-xl"
      style={{ background: "linear-gradient(180deg, #e8f4f8 0%, #d4ecf7 100%)" }}
    >
      {paths.map((p) => (
        <path
          key={p.id}
          d={p.d}
          fill={p.visited ? "#10b981" : "#d6d3d1"}
          stroke="white"
          strokeWidth={0.5}
        />
      ))}
    </svg>
  );
}

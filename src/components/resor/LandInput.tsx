"use client";

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { LAND_FORSLAG, getCountryFlag } from "@/lib/countries";

interface Props {
  value: string[];
  onChange: (countries: string[]) => void;
  ringColor?: string; // e.g. "focus-within:ring-emerald-500" or "focus-within:ring-purple-400"
}

export default function LandInput({
  value,
  onChange,
  ringColor = "focus-within:ring-emerald-500",
}: Props) {
  const [query,    setQuery]    = useState("");
  const [open,     setOpen]     = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  // Filter suggestions: starts-with first, then contains
  const suggestions =
    query.trim().length > 0
      ? LAND_FORSLAG.filter(
          (name) =>
            name.toLowerCase().includes(query.toLowerCase()) &&
            !value.includes(name)
        ).slice(0, 8)
      : [];

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Reset highlight when suggestions change
  useEffect(() => setHighlighted(0), [suggestions.length]);

  const addCountry = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  };

  const removeCountry = (i: number) =>
    onChange(value.filter((_, j) => j !== i));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && suggestions.length > 0) {
        addCountry(suggestions[highlighted]);
      } else if (query.trim()) {
        addCountry(query.trim());
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Backspace" && query === "" && value.length > 0) {
      removeCountry(value.length - 1);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      {/* Combined chip + input box */}
      <div
        className={`flex flex-wrap gap-1.5 min-h-[44px] w-full border border-stone-200 rounded-xl px-3 py-2 focus-within:ring-2 ${ringColor} cursor-text transition-shadow`}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((c, i) => (
          <span
            key={i}
            className="flex items-center gap-1 bg-stone-100 text-stone-700 text-sm px-2.5 py-0.5 rounded-full whitespace-nowrap"
          >
            <span className="text-base leading-none">{getCountryFlag(c)}</span>
            <span>{c}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeCountry(i); }}
              className="text-stone-400 hover:text-stone-700 transition-colors ml-0.5"
              aria-label={`Ta bort ${c}`}
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { if (query) setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? "Sök land…" : "Lägg till fler…"}
          className="flex-1 min-w-[120px] bg-transparent text-sm focus:outline-none text-stone-800 placeholder-stone-400 py-0.5"
        />
      </div>

      {/* Dropdown */}
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden">
          {suggestions.map((name, i) => (
            <li key={name}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); addCountry(name); }}
                onMouseEnter={() => setHighlighted(i)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 text-left transition-colors ${
                  i === highlighted ? "bg-stone-50" : "hover:bg-stone-50"
                }`}
              >
                <span className="text-lg leading-none">{getCountryFlag(name)}</span>
                <span>{name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

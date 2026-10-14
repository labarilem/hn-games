"use client";

import { formatGenreForFilter } from "@/lib/formatters";
import { GameGenre } from "@/types/game";
import { useEffect, useId, useRef, useState } from "react";

const SORTED_GENRES = Object.values(GameGenre).sort((a, b) =>
  a.localeCompare(b),
);

interface GenreMultiSelectProps {
  selectedGenres: GameGenre[];
  onSelectionChange: (genres: GameGenre[]) => void;
  className?: string;
}

export default function GenreMultiSelect({
  selectedGenres,
  onSelectionChange,
  className = "",
}: GenreMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setQuery("");
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setQuery("");
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  // There are 36 genres, so the panel opens ready to type rather than to scroll.
  useEffect(() => {
    if (isOpen) searchRef.current?.focus();
  }, [isOpen]);

  const openPanel = () => {
    setQuery("");
    setIsOpen(true);
  };

  const closePanel = () => {
    setQuery("");
    setIsOpen(false);
  };

  const toggleGenre = (genre: GameGenre) => {
    const isSelected = selectedGenres.includes(genre);
    const nextGenres = isSelected
      ? selectedGenres.filter((g) => g !== genre)
      : [...selectedGenres, genre];
    onSelectionChange(nextGenres);
  };

  const clearGenres = () => {
    onSelectionChange([]);
    closePanel();
  };

  const clearQuery = () => {
    setQuery("");
    searchRef.current?.focus();
  };

  const normalizedQuery = query.trim().toLowerCase();
  const visibleGenres = normalizedQuery
    ? SORTED_GENRES.filter((genre) =>
        formatGenreForFilter(genre).toLowerCase().includes(normalizedQuery),
      )
    : SORTED_GENRES;

  const buttonLabel =
    selectedGenres.length === 0
      ? "All Genres"
      : selectedGenres.length === 1
        ? formatGenreForFilter(selectedGenres[0])
        : `${selectedGenres.length} Genres`;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => (isOpen ? closePanel() : openPanel())}
        className="hn-filter-control w-full min-w-[120px] flex items-center justify-between gap-2 text-left"
      >
        <span className="truncate">{buttonLabel}</span>
        <svg
          className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          id={panelId}
          role="dialog"
          aria-label="Genre filter"
          className="filter-popover absolute z-50 mt-1 w-full min-w-[220px] max-h-[min(320px,50vh)] overflow-y-auto overscroll-contain bg-hn-surface border border-hn-border rounded shadow-xl"
        >
          <div className="sticky top-0 z-10 border-b border-hn-border bg-hn-surface px-3 py-2">
            <div className="relative">
              <svg
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle cx="10.5" cy="10.5" r="6.5" strokeWidth="1.5" />
                <path d="m16 16 5 5" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filter genres…"
                aria-label="Filter genres"
                className="w-full rounded border border-hn-border bg-hn-bg pl-8 pr-8 py-1.5 text-sm text-gray-200 placeholder:text-gray-500 outline-none transition-colors focus:border-hn-accent"
              />
              {query && (
                <button
                  type="button"
                  onClick={clearQuery}
                  aria-label="Clear filter text"
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded px-1.5 py-0.5 text-gray-400 hover:text-gray-200"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {visibleGenres.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-400">
              No genres match “{query.trim()}”.
            </p>
          ) : (
            <ul className="py-1">
              {visibleGenres.map((genre) => {
                const isSelected = selectedGenres.includes(genre);
                return (
                  <li key={genre} role="presentation">
                    <label className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-hn-elevated active:bg-hn-border select-none">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleGenre(genre)}
                        className="w-4 h-4 shrink-0 accent-hn-accent"
                      />
                      <span className="text-sm">
                        {formatGenreForFilter(genre)}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}

          {selectedGenres.length > 0 && (
            <div className="sticky bottom-0 z-10 flex items-center justify-between gap-2 border-t border-hn-border bg-hn-surface px-3 py-2">
              <span className="text-sm text-gray-400">
                {selectedGenres.length} selected
              </span>
              <button
                type="button"
                onClick={clearGenres}
                className="text-sm hn-link px-2 py-1 rounded"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

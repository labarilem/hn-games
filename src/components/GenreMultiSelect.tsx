"use client";

import { formatGenreForFilter } from "@/lib/formatters";
import { GameGenre } from "@/types/game";
import { useEffect, useId, useRef, useState } from "react";

const SORTED_GENRES = Object.values(GameGenre).sort((a, b) =>
  a.localeCompare(b)
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
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
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

  const toggleGenre = (genre: GameGenre) => {
    const isSelected = selectedGenres.includes(genre);
    const nextGenres = isSelected
      ? selectedGenres.filter((g) => g !== genre)
      : [...selectedGenres, genre];
    onSelectionChange(nextGenres);
  };

  const clearGenres = () => {
    onSelectionChange([]);
    setIsOpen(false);
  };

  const buttonLabel =
    selectedGenres.length === 0
      ? "All Genres"
      : selectedGenres.length === 1
        ? formatGenreForFilter(selectedGenres[0])
        : `${selectedGenres.length} Genres`;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={() => setIsOpen((prev) => !prev)}
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
          id={listboxId}
          role="listbox"
          aria-label="Genre filter"
          aria-multiselectable="true"
          className="absolute z-50 mt-1 w-full min-w-[220px] max-h-[min(320px,50vh)] overflow-y-auto overscroll-contain bg-hn-surface border border-hn-border rounded-lg shadow-xl"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between gap-2 px-3 py-2 border-b border-hn-border bg-hn-surface">
            <span className="text-sm text-gray-400">Select genres</span>
            {selectedGenres.length > 0 && (
              <button
                type="button"
                onClick={clearGenres}
                className="text-sm hn-link px-2 py-1 rounded"
              >
                Clear
              </button>
            )}
          </div>

          <ul className="py-1">
            {SORTED_GENRES.map((genre) => {
              const isSelected = selectedGenres.includes(genre);
              return (
                <li key={genre} role="presentation">
                  <label
                    role="option"
                    aria-selected={isSelected}
                    className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-hn-elevated active:bg-hn-border select-none"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleGenre(genre)}
                      className="w-4 h-4 shrink-0 accent-hn-accent"
                    />
                    <span className="text-sm">{formatGenreForFilter(genre)}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

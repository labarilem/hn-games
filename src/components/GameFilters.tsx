"use client";

import { GameGenre } from "@/types/game";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

// Custom debounce hook
function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function GameFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") ?? ""
  );
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // 300ms debounce delay

  // Add refs for both mobile and desktop sort selects
  const mobileSortRef = useRef<HTMLSelectElement>(null);
  const desktopSortRef = useRef<HTMLSelectElement>(null);

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
      return params.toString();
    },
    [searchParams]
  );

  // Effect to handle debounced search term changes
  useEffect(() => {
    router.push(`/?${createQueryString("search", debouncedSearchTerm)}`);
  }, [debouncedSearchTerm, createQueryString, router]);

  const activeFiltersCount = [
    searchParams.get("platform"),
    searchParams.get("genre"),
    searchParams.get("playerMode"),
    searchParams.get("pricing"),
    searchParams.get("sortBy"),
    searchParams.get("search"),
    searchParams.get("author"),
  ].filter(Boolean).length;

  const hasSearch = (searchParams.get("search") ?? "").length > 0;

  const currentAuthor = searchParams.get("author");

  const handleClearFilters = () => {
    setSearchTerm("");
    setIsExpanded(false);

    // Reset sort selects to default value first
    if (mobileSortRef.current) mobileSortRef.current.value = "releaseDate-desc";
    if (desktopSortRef.current)
      desktopSortRef.current.value = "releaseDate-desc";

    // Then reset all other select elements
    const selects = document.querySelectorAll(
      'select:not([name="sortBy"])'
    ) as NodeListOf<HTMLSelectElement>;
    selects.forEach((select) => {
      select.value = "";
    });

    router.push("/");
  };

  return (
    <div className="space-y-4 mb-8">
      {/* Mobile View */}
      <div className="lg:hidden">
        <div className="flex gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-1 bg-[#242424] rounded-lg px-4 py-3 flex justify-between items-center text-left"
          >
            <span className="flex items-center gap-2">
              <svg
                className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
              Filters
              {(activeFiltersCount > 0 || hasSearch) && (
                <span className="bg-[#646cff] text-white text-sm px-2 py-0.5 rounded-full">
                  {activeFiltersCount + (hasSearch ? 1 : 0)}
                </span>
              )}
            </span>
          </button>
          {activeFiltersCount > 0 && (
            <button
              onClick={handleClearFilters}
              className="bg-[#242424] text-gray-300 hover:text-white rounded-lg px-4 py-3 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {isExpanded && (
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Search games..."
              className="w-full bg-[#242424] rounded-lg px-4 py-3 border border-[#363636] focus:border-[#646cff] focus:ring-1 focus:ring-[#646cff] outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {currentAuthor && (
              <div className="flex items-center gap-2 bg-[#242424] rounded-lg px-4 py-3 border border-[#363636]">
                <span className="text-gray-300">Author: {currentAuthor}</span>
              </div>
            )}

            <select
              className="w-fit min-w-[120px] bg-[#242424] rounded-lg px-4 py-3 border border-[#363636] focus:border-[#646cff] focus:ring-1 focus:ring-[#646cff] outline-none"
              onChange={(e) => {
                router.push(`/?${createQueryString("platform", e.target.value)}`);
              }}
              defaultValue={searchParams.get("platform") ?? ""}
            >
              <option value="">All Platforms</option>
              <option value="web">Web</option>
              <option value="desktop">Desktop</option>
              <option value="console">Console</option>
            </select>

            <select
              className="w-fit min-w-[120px] bg-[#242424] rounded-lg px-4 py-3 border border-[#363636] focus:border-[#646cff] focus:ring-1 focus:ring-[#646cff] outline-none"
              onChange={(e) => {
                router.push(`/?${createQueryString("genre", e.target.value)}`);
              }}
              defaultValue={searchParams.get("genre") ?? ""}
            >
              <option value="">All Genres</option>
              {Object.values(GameGenre).map((genre) => (
                <option key={genre} value={genre}>
                  {genre.charAt(0).toUpperCase() + genre.slice(1)}
                </option>
              ))}
            </select>

            <select
              className="w-fit min-w-[140px] bg-[#242424] rounded-lg px-4 py-3 border border-[#363636] focus:border-[#646cff] focus:ring-1 focus:ring-[#646cff] outline-none"
              onChange={(e) => {
                router.push(`/?${createQueryString("playerMode", e.target.value)}`);
              }}
              defaultValue={searchParams.get("playerMode") ?? ""}
            >
              <option value="">All Player Modes</option>
              <option value="single">Single Player</option>
              <option value="multi">Multiplayer</option>
            </select>

            <select
              className="w-fit min-w-[120px] bg-[#242424] rounded-lg px-4 py-3 border border-[#363636] focus:border-[#646cff] focus:ring-1 focus:ring-[#646cff] outline-none"
              onChange={(e) => {
                router.push(`/?${createQueryString("pricing", e.target.value)}`);
              }}
              defaultValue={searchParams.get("pricing") ?? ""}
            >
              <option value="">All Pricing</option>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>

            <select
              ref={mobileSortRef}
              name="sortBy"
              className="w-fit min-w-[140px] bg-[#242424] rounded-lg px-4 py-3 border border-[#363636] focus:border-[#646cff] focus:ring-1 focus:ring-[#646cff] outline-none"
              onChange={(e) => {
                router.push(`/?${createQueryString("sortBy", e.target.value)}`);
              }}
              defaultValue={searchParams.get("sortBy") ?? "releaseDate-desc"}
            >
              <option value="releaseDate-desc">Newest First</option>
              <option value="releaseDate-asc">Oldest First</option>
              <option value="hnPoints-desc">Most Popular</option>
              <option value="hnPoints-asc">Least Popular</option>
            </select>
          </div>
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block">
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Search games..."
            className="flex-1 min-w-[200px] bg-[#242424] rounded-lg px-4 py-3 border border-[#363636] focus:border-[#646cff] focus:ring-1 focus:ring-[#646cff] outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {currentAuthor && (
            <div className="flex items-center gap-2 bg-[#242424] rounded-lg px-4 py-3 border border-[#363636]">
              <span className="text-gray-300">Author: {currentAuthor}</span>
            </div>
          )}

          <select
            className="w-fit min-w-[120px] bg-[#242424] rounded-lg px-4 py-3 border border-[#363636] focus:border-[#646cff] focus:ring-1 focus:ring-[#646cff] outline-none"
            onChange={(e) => {
              router.push(`/?${createQueryString("platform", e.target.value)}`);
            }}
            defaultValue={searchParams.get("platform") ?? ""}
          >
            <option value="">All Platforms</option>
            <option value="web">Web</option>
            <option value="desktop">Desktop</option>
            <option value="console">Console</option>
          </select>

          <select
            className="w-fit min-w-[120px] bg-[#242424] rounded-lg px-4 py-3 border border-[#363636] focus:border-[#646cff] focus:ring-1 focus:ring-[#646cff] outline-none"
            onChange={(e) => {
              router.push(`/?${createQueryString("genre", e.target.value)}`);
            }}
            defaultValue={searchParams.get("genre") ?? ""}
          >
            <option value="">All Genres</option>
            {Object.values(GameGenre).map((genre) => (
              <option key={genre} value={genre}>
                {genre.charAt(0).toUpperCase() + genre.slice(1)}
              </option>
            ))}
          </select>

          <select
            className="w-fit min-w-[140px] bg-[#242424] rounded-lg px-4 py-3 border border-[#363636] focus:border-[#646cff] focus:ring-1 focus:ring-[#646cff] outline-none"
            onChange={(e) => {
              router.push(`/?${createQueryString("playerMode", e.target.value)}`);
            }}
            defaultValue={searchParams.get("playerMode") ?? ""}
          >
            <option value="">All Player Modes</option>
            <option value="single">Single Player</option>
            <option value="multi">Multiplayer</option>
          </select>

          <select
            className="w-fit min-w-[120px] bg-[#242424] rounded-lg px-4 py-3 border border-[#363636] focus:border-[#646cff] focus:ring-1 focus:ring-[#646cff] outline-none"
            onChange={(e) => {
              router.push(`/?${createQueryString("pricing", e.target.value)}`);
            }}
            defaultValue={searchParams.get("pricing") ?? ""}
          >
            <option value="">All Pricing</option>
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </select>

          <select
            ref={desktopSortRef}
            name="sortBy"
            className="inline-block bg-[#242424] rounded-lg px-4 py-3 border border-[#363636] focus:border-[#646cff] focus:ring-1 focus:ring-[#646cff] outline-none"
            onChange={(e) => {
              router.push(`/?${createQueryString("sortBy", e.target.value)}`);
            }}
            defaultValue={searchParams.get("sortBy") ?? "releaseDate-desc"}
          >
            <option value="releaseDate-desc">Newest First</option>
            <option value="releaseDate-asc">Oldest First</option>
            <option value="hnPoints-desc">Most Popular</option>
            <option value="hnPoints-asc">Least Popular</option>
          </select>

          {activeFiltersCount > 0 && (
            <button
              onClick={handleClearFilters}
              className="bg-[#242424] text-gray-300 hover:text-white rounded-lg px-4 py-3 whitespace-nowrap transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

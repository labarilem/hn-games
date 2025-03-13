"use client";

import { GameGenre } from "@/types/game";
import debounce from "lodash.debounce";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef, useState } from "react";

export default function GameFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") ?? ""
  );
  const [resetKey, setResetKey] = useState(0);

  // Refs for sort selects
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

  // Create a stable debounced navigation function
  const debouncedNavigate = useCallback(
    debounce((nextValue: string) => {
      if (isNavigating) return;

      const params = new URLSearchParams(searchParams.toString());

      if (nextValue) {
        params.set("search", nextValue);
      } else {
        params.delete("search");
      }

      const newSearch = params.toString();
      const newPath = newSearch ? `/?${newSearch}` : "/";
      const currentPath = window.location.pathname + window.location.search;

      // Only navigate if path is different
      if (newPath !== currentPath) {
        router.push(newPath);
      }
    }, 250),
    [isNavigating, router, searchParams]
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = e.target.value;
      setSearchTerm(nextValue);
      debouncedNavigate(nextValue);
    },
    [debouncedNavigate]
  );

  const handleExpandToggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleClearFilters = useCallback(() => {
    if (isNavigating) return;
    setIsNavigating(true);

    // Reset sort selects to default value first
    if (mobileSortRef.current) mobileSortRef.current.value = "releaseDate-desc";
    if (desktopSortRef.current)
      desktopSortRef.current.value = "releaseDate-desc";

    // Cancel any pending debounced navigations
    debouncedNavigate.cancel();

    // Reset state
    setIsExpanded(false);
    setSearchTerm("");

    // Navigate to root to clear all filters
    if (window.location.pathname + window.location.search !== "/") {
      router.push("/");
    } else {
      // If already at root, force a re-render by updating resetKey
      setResetKey((k) => k + 1);
    }

    setIsNavigating(false);
  }, [router, isNavigating, debouncedNavigate]);

  // Count active filters
  const activeFiltersCount = [
    searchParams.get("platform"),
    searchParams.get("genre"),
    searchParams.get("playerModes"),
    searchParams.get("pricing"),
    searchParams.get("sortBy"),
    searchParams.get("search"),
    searchParams.get("author"),
  ].filter(Boolean).length;

  const hasSearch = (searchParams.get("search") ?? "").length > 0;
  const currentAuthor = searchParams.get("author");

  return (
    <div key={resetKey} className="space-y-4 mb-8">
      {/* Mobile View */}
      <div className="lg:hidden">
        <div className="flex gap-2">
          <button
            onClick={handleExpandToggle}
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
              className="bg-[#646cff] text-white px-4 py-2 rounded hover:bg-[#747bff] transition-colors"
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
              onChange={handleSearchChange}
            />

            {currentAuthor && (
              <div className="flex items-center gap-2 bg-[#242424] rounded-lg px-4 py-3 border border-[#363636]">
                <span className="text-gray-300">Author: {currentAuthor}</span>
              </div>
            )}

            {/* Platform Select */}
            <select
              name="platform"
              value={searchParams.get("platform") ?? ""}
              onChange={(e) =>
                router.push(
                  `/?${createQueryString("platform", e.target.value)}`
                )
              }
              className="w-fit min-w-[120px] bg-[#242424] rounded-lg px-4 py-3 border border-[#363636] focus:border-[#646cff] focus:ring-1 focus:ring-[#646cff] outline-none"
            >
              <option value="">All Platforms</option>
              <option value="web">Web</option>
              <option value="desktop">Desktop</option>
              <option value="console">Console</option>
              <option value="ios">iOS</option>
              <option value="android">Android</option>
            </select>

            {/* Genre Select */}
            <select
              name="genre"
              value={searchParams.get("genre") ?? ""}
              onChange={(e) =>
                router.push(`/?${createQueryString("genre", e.target.value)}`)
              }
              className="w-fit min-w-[120px] bg-[#242424] rounded-lg px-4 py-3 border border-[#363636] focus:border-[#646cff] focus:ring-1 focus:ring-[#646cff] outline-none"
            >
              <option value="">All Genres</option>
              {Object.values(GameGenre).map((genre) => (
                <option key={genre} value={genre}>
                  {genre.charAt(0).toUpperCase() + genre.slice(1)}
                </option>
              ))}
            </select>

            {/* Player Mode Select */}
            <select
              name="playerModes"
              value={searchParams.get("playerModes") ?? ""}
              onChange={(e) =>
                router.push(
                  `/?${createQueryString("playerModes", e.target.value)}`
                )
              }
              className="w-fit min-w-[140px] bg-[#242424] rounded-lg px-4 py-3 border border-[#363636] focus:border-[#646cff] focus:ring-1 focus:ring-[#646cff] outline-none"
            >
              <option value="">All Player Modes</option>
              <option value="single">Singleplayer</option>
              <option value="multi">Multiplayer</option>
            </select>

            {/* Pricing Select */}
            <select
              name="pricing"
              value={searchParams.get("pricing") ?? ""}
              onChange={(e) =>
                router.push(`/?${createQueryString("pricing", e.target.value)}`)
              }
              className="w-fit min-w-[120px] bg-[#242424] rounded-lg px-4 py-3 border border-[#363636] focus:border-[#646cff] focus:ring-1 focus:ring-[#646cff] outline-none"
            >
              <option value="">All Pricing</option>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>

            {/* Sort By Select */}
            <select
              ref={mobileSortRef}
              name="sortBy"
              defaultValue={searchParams.get("sortBy") ?? "releaseDate-desc"}
              onChange={(e) =>
                router.push(`/?${createQueryString("sortBy", e.target.value)}`)
              }
              className="w-fit min-w-[140px] bg-[#242424] rounded-lg px-4 py-3 border border-[#363636] focus:border-[#646cff] focus:ring-1 focus:ring-[#646cff] outline-none"
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
            onChange={handleSearchChange}
          />

          {currentAuthor && (
            <div className="flex items-center gap-2 bg-[#242424] rounded-lg px-4 py-3 border border-[#363636]">
              <span className="text-gray-300">Author: {currentAuthor}</span>
            </div>
          )}

          {/* Platform Select */}
          <select
            name="platform"
            value={searchParams.get("platform") ?? ""}
            onChange={(e) =>
              router.push(`/?${createQueryString("platform", e.target.value)}`)
            }
            className="w-fit min-w-[120px] bg-[#242424] rounded-lg px-4 py-3 border border-[#363636] focus:border-[#646cff] focus:ring-1 focus:ring-[#646cff] outline-none"
          >
            <option value="">All Platforms</option>
            <option value="web">Web</option>
            <option value="desktop">Desktop</option>
            <option value="console">Console</option>
            <option value="ios">iOS</option>
            <option value="android">Android</option>
          </select>

          {/* Genre Select */}
          <select
            name="genre"
            value={searchParams.get("genre") ?? ""}
            onChange={(e) =>
              router.push(`/?${createQueryString("genre", e.target.value)}`)
            }
            className="w-fit min-w-[120px] bg-[#242424] rounded-lg px-4 py-3 border border-[#363636] focus:border-[#646cff] focus:ring-1 focus:ring-[#646cff] outline-none"
          >
            <option value="">All Genres</option>
            {Object.values(GameGenre).map((genre) => (
              <option key={genre} value={genre}>
                {genre.charAt(0).toUpperCase() + genre.slice(1)}
              </option>
            ))}
          </select>

          {/* Player Mode Select */}
          <select
            name="playerModes"
            value={searchParams.get("playerModes") ?? ""}
            onChange={(e) =>
              router.push(
                `/?${createQueryString("playerModes", e.target.value)}`
              )
            }
            className="w-fit min-w-[140px] bg-[#242424] rounded-lg px-4 py-3 border border-[#363636] focus:border-[#646cff] focus:ring-1 focus:ring-[#646cff] outline-none"
          >
            <option value="">All Player Modes</option>
            <option value="single">Singleplayer</option>
            <option value="multi">Multiplayer</option>
          </select>

          {/* Pricing Select */}
          <select
            name="pricing"
            value={searchParams.get("pricing") ?? ""}
            onChange={(e) =>
              router.push(`/?${createQueryString("pricing", e.target.value)}`)
            }
            className="w-fit min-w-[120px] bg-[#242424] rounded-lg px-4 py-3 border border-[#363636] focus:border-[#646cff] focus:ring-1 focus:ring-[#646cff] outline-none"
          >
            <option value="">All Pricing</option>
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </select>

          {/* Sort By Select */}
          <select
            ref={desktopSortRef}
            name="sortBy"
            defaultValue={searchParams.get("sortBy") ?? "releaseDate-desc"}
            onChange={(e) =>
              router.push(`/?${createQueryString("sortBy", e.target.value)}`)
            }
            className="inline-block bg-[#242424] rounded-lg px-4 py-3 border border-[#363636] focus:border-[#646cff] focus:ring-1 focus:ring-[#646cff] outline-none"
          >
            <option value="releaseDate-desc">Newest First</option>
            <option value="releaseDate-asc">Oldest First</option>
            <option value="hnPoints-desc">Most Popular</option>
            <option value="hnPoints-asc">Least Popular</option>
          </select>

          {/* Clear Button */}
          {activeFiltersCount > 0 && (
            <button
              onClick={handleClearFilters}
              className="bg-[#646cff] text-white px-4 py-2 rounded hover:bg-[#747bff] transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

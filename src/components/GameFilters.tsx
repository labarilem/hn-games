"use client";

import { GameGenre, Pricing } from "@/types/game";
import debounce from "lodash.debounce";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FilterSelect from "./FilterSelect";
import GenreMultiSelect from "./GenreMultiSelect";

const filterSelectWrapper = "w-fit min-w-[120px]";
const filterSelectWideWrapper = "w-fit min-w-[140px]";

export default function GameFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") ?? ""
  );
  const [resetKey, setResetKey] = useState(0);

  // Refs for sort selects
  const mobileSortRef = useRef<HTMLSelectElement>(null);
  const desktopSortRef = useRef<HTMLSelectElement>(null);

  // Helper to always reset page to 1 when a filter changes
  const createQueryStringWithPageReset = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
      // Always reset page to 1 if changing a filter (not if changing page itself)
      if (name !== "page") params.set("page", "1");
      return params.toString();
    },
    [searchParams]
  );

  // Helper to create the navigation path with current pathname
  const createNavigationPath = useCallback(
    (queryString: string) => {
      return queryString ? `${pathname}?${queryString}` : pathname;
    },
    [pathname]
  );

  // Create a stable debounced navigation function
  const debouncedNavigate = useMemo(
    () =>
      debounce((nextValue: string) => {
        const params = new URLSearchParams(searchParams.toString());

        if (nextValue) {
          params.set("search", nextValue);
        } else {
          params.delete("search");
        }
        params.set("page", "1");

        const newSearch = params.toString();
        const newPath = createNavigationPath(newSearch);
        const currentPath = window.location.pathname + window.location.search;

        if (newPath !== currentPath) {
          router.push(newPath);
        }
      }, 250),
    [router, searchParams, createNavigationPath]
  );

  useEffect(() => {
    return () => debouncedNavigate.cancel();
  }, [debouncedNavigate]);

  useEffect(() => {
    // Sync input when URL changes via back/forward or clear filters
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional URL-to-input sync
    setSearchTerm(searchParams.get("search") ?? "");
  }, [searchParams]);

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
    // Reset sort selects to default value first
    if (mobileSortRef.current) mobileSortRef.current.value = "releaseDate-desc";
    if (desktopSortRef.current)
      desktopSortRef.current.value = "releaseDate-desc";

    // Cancel any pending debounced navigations
    debouncedNavigate.cancel();

    // Reset state
    setIsExpanded(false);
    setSearchTerm("");

    // Navigate to current pathname without query params to clear all filters
    const currentFullPath = window.location.pathname + window.location.search;
    if (currentFullPath !== pathname) {
      router.push(pathname);
    } else {
      // If already at base path, force a re-render by updating resetKey
      setResetKey((k) => k + 1);
    }
  }, [router, debouncedNavigate, pathname]);

  const handleGenreChange = useCallback(
    (genres: GameGenre[]) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("genre");
      genres.forEach((genre) => params.append("genre", genre));
      params.set("page", "1");
      router.push(createNavigationPath(params.toString()));
    },
    [router, searchParams, createNavigationPath]
  );

  const selectedGenres = searchParams.getAll("genre") as GameGenre[];

  // Count active filters
  const activeFiltersCount = [
    searchParams.get("platform"),
    selectedGenres.length > 0 ? "genre" : null,
    searchParams.get("playerModes"),
    searchParams.get("pricing"),
    searchParams.get("license"),
    searchParams.get("sortBy"),
    searchParams.get("search"),
    searchParams.get("author"),
  ].filter(Boolean).length;

  const currentAuthor = searchParams.get("author");

  return (
    <div key={resetKey} className="space-y-4 mb-8">
      {/* Mobile View */}
      <div className="lg:hidden">
        <div className="flex gap-2">
          <button
            onClick={handleExpandToggle}
            className="hn-filter-control flex-1 flex justify-between items-center text-left"
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
              {activeFiltersCount > 0 && (
                <span className="bg-hn-accent text-white text-sm px-2 py-0.5 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </span>
          </button>
          {activeFiltersCount > 0 && (
            <button
              onClick={handleClearFilters}
              className="hn-btn-primary px-4 py-2 rounded"
            >
              Clear
            </button>
          )}
        </div>

        {isExpanded && (
          <div className="hn-surface mt-2 p-3 flex flex-wrap gap-2 animate-slide-up">
            <input
              type="text"
              placeholder="Search games..."
              className="hn-filter-control w-full"
              value={searchTerm}
              onChange={handleSearchChange}
            />

            {currentAuthor && (
              <div className="hn-filter-control flex items-center gap-2 w-fit">
                <span className="text-gray-300">Author: {currentAuthor}</span>
              </div>
            )}

            {/* Platform Select */}
            <FilterSelect
              name="platform"
              aria-label="Platform"
              value={searchParams.get("platform") ?? ""}
              onChange={(e) =>
                router.push(
                  createNavigationPath(
                    createQueryStringWithPageReset("platform", e.target.value)
                  )
                )
              }
              wrapperClassName={filterSelectWrapper}
            >
              <option value="">All Platforms</option>
              <option value="web">Web</option>
              <option value="desktop">Desktop</option>
              <option value="console">Console</option>
              <option value="ios">iOS</option>
              <option value="android">Android</option>
            </FilterSelect>

            {/* Genre Multi-Select */}
            <GenreMultiSelect
              selectedGenres={selectedGenres}
              onSelectionChange={handleGenreChange}
              className="w-full sm:w-fit"
            />

            {/* Player Mode Select */}
            <FilterSelect
              name="playerModes"
              aria-label="Player Modes"
              value={searchParams.get("playerModes") ?? ""}
              onChange={(e) =>
                router.push(
                  createNavigationPath(
                    createQueryStringWithPageReset(
                      "playerModes",
                      e.target.value
                    )
                  )
                )
              }
              wrapperClassName={filterSelectWideWrapper}
            >
              <option value="">All Player Modes</option>
              <option value="single">Singleplayer</option>
              <option value="multi">Multiplayer</option>
            </FilterSelect>

            {/* Pricing Select */}
            <FilterSelect
              name="pricing"
              aria-label="Pricing"
              value={searchParams.get("pricing") ?? ""}
              onChange={(e) =>
                router.push(
                  createNavigationPath(
                    createQueryStringWithPageReset("pricing", e.target.value)
                  )
                )
              }
              wrapperClassName={filterSelectWrapper}
            >
              <option value="">Any Pricing</option>
              <option value={Pricing.FREE}>Free</option>
              <option value={Pricing.FREEMIUM}>Freemium</option>
              <option value={Pricing.PAID}>Paid</option>
            </FilterSelect>

            {/* License Select */}
            <FilterSelect
              name="license"
              aria-label="License"
              value={searchParams.get("license") ?? ""}
              onChange={(e) =>
                router.push(
                  createNavigationPath(
                    createQueryStringWithPageReset("license", e.target.value)
                  )
                )
              }
              wrapperClassName={filterSelectWideWrapper}
            >
              <option value="">Any License</option>
              <option value="open">Open Source</option>
              <option value="closed">Closed Source</option>
            </FilterSelect>

            {/* Sort By Select */}
            <FilterSelect
              ref={mobileSortRef}
              name="sortBy"
              aria-label="Sort By"
              defaultValue={searchParams.get("sortBy") ?? "releaseDate-desc"}
              onChange={(e) =>
                router.push(
                  createNavigationPath(
                    createQueryStringWithPageReset("sortBy", e.target.value)
                  )
                )
              }
              wrapperClassName={filterSelectWideWrapper}
            >
              <option value="releaseDate-desc">Newest First</option>
              <option value="releaseDate-asc">Oldest First</option>
              <option value="hnPoints-desc">Most Popular</option>
              <option value="hnPoints-asc">Least Popular</option>
            </FilterSelect>
          </div>
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block">
        <div className="hn-surface p-3">
          <div className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            placeholder="Search games..."
            className="hn-filter-control flex-1 min-w-[200px]"
            value={searchTerm}
            onChange={handleSearchChange}
          />

          {currentAuthor && (
            <div className="hn-filter-control flex items-center gap-2 w-fit">
              <span className="text-gray-300">Author: {currentAuthor}</span>
            </div>
          )}

          {/* Platform Select */}
          <FilterSelect
            name="platform"
            aria-label="Platform"
            value={searchParams.get("platform") ?? ""}
            onChange={(e) =>
              router.push(
                createNavigationPath(
                  createQueryStringWithPageReset("platform", e.target.value)
                )
              )
            }
            wrapperClassName={filterSelectWrapper}
          >
            <option value="">All Platforms</option>
            <option value="web">Web</option>
            <option value="desktop">Desktop</option>
            <option value="console">Console</option>
            <option value="ios">iOS</option>
            <option value="android">Android</option>
          </FilterSelect>

          {/* Genre Multi-Select */}
          <GenreMultiSelect
            selectedGenres={selectedGenres}
            onSelectionChange={handleGenreChange}
            className="w-fit"
          />

          {/* Player Mode Select */}
          <FilterSelect
            name="playerModes"
            aria-label="Player Modes"
            value={searchParams.get("playerModes") ?? ""}
            onChange={(e) =>
              router.push(
                createNavigationPath(
                  createQueryStringWithPageReset("playerModes", e.target.value)
                )
              )
            }
            wrapperClassName={filterSelectWideWrapper}
          >
            <option value="">All Player Modes</option>
            <option value="single">Singleplayer</option>
            <option value="multi">Multiplayer</option>
          </FilterSelect>

          {/* Pricing Select */}
          <FilterSelect
            name="pricing"
            aria-label="Pricing"
            value={searchParams.get("pricing") ?? ""}
            onChange={(e) =>
              router.push(
                createNavigationPath(
                  createQueryStringWithPageReset("pricing", e.target.value)
                )
              )
            }
            wrapperClassName={filterSelectWrapper}
          >
            <option value="">Any Pricing</option>
            <option value={Pricing.FREE}>Free</option>
            <option value={Pricing.FREEMIUM}>Freemium</option>
            <option value={Pricing.PAID}>Paid</option>
          </FilterSelect>

          {/* License Select */}
          <FilterSelect
            name="license"
            aria-label="License"
            value={searchParams.get("license") ?? ""}
            onChange={(e) =>
              router.push(
                createNavigationPath(
                  createQueryStringWithPageReset("license", e.target.value)
                )
              )
            }
            wrapperClassName={filterSelectWideWrapper}
          >
            <option value="">Any License</option>
            <option value="open">Open Source</option>
            <option value="closed">Closed Source</option>
          </FilterSelect>

          {/* Sort By Select */}
          <FilterSelect
            ref={desktopSortRef}
            name="sortBy"
            aria-label="Sort By"
            defaultValue={searchParams.get("sortBy") ?? "releaseDate-desc"}
            onChange={(e) =>
              router.push(
                createNavigationPath(
                  createQueryStringWithPageReset("sortBy", e.target.value)
                )
              )
            }
            wrapperClassName={filterSelectWideWrapper}
          >
            <option value="releaseDate-desc">Newest First</option>
            <option value="releaseDate-asc">Oldest First</option>
            <option value="hnPoints-desc">Most Popular</option>
            <option value="hnPoints-asc">Least Popular</option>
          </FilterSelect>

          {/* Clear Button */}
          {activeFiltersCount > 0 && (
            <button
              onClick={handleClearFilters}
              className="hn-btn-primary px-4 py-2 rounded"
            >
              Clear
            </button>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

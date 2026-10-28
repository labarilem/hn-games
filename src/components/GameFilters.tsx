"use client";

import { GameGenre } from "@/types/game";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReactNode, useEffect, useRef, useState, useTransition } from "react";
import FilterSelect from "./FilterSelect";
import GenreMultiSelect from "./GenreMultiSelect";

const filterOptions = [
  {
    key: "platform",
    label: "Platform",
    options: [
      { value: "", label: "All platforms" },
      { value: "web", label: "Browser" },
      { value: "desktop", label: "Desktop" },
      { value: "console", label: "Console" },
      { value: "ios", label: "iOS" },
      { value: "android", label: "Android" },
    ],
  },
  {
    key: "playerModes",
    label: "Players",
    options: [
      { value: "", label: "Any player mode" },
      { value: "single", label: "Single player" },
      { value: "multi", label: "Multiplayer" },
    ],
  },
  {
    key: "pricing",
    label: "Price",
    options: [
      { value: "", label: "Any price" },
      { value: "free", label: "Free" },
      { value: "freemium", label: "Freemium" },
      { value: "paid", label: "Paid" },
    ],
  },
  {
    key: "license",
    label: "Source code",
    options: [
      { value: "", label: "Any availability" },
      { value: "open", label: "Open source" },
      { value: "closed", label: "Closed source" },
    ],
  },
];

const sortOptions = [
  { value: "releaseDate-desc", label: "Newest first" },
  { value: "releaseDate-asc", label: "Oldest first" },
  { value: "hnPoints-desc", label: "Most HN points" },
  { value: "hnPoints-asc", label: "Fewest HN points" },
];

export default function GameFilters({
  children,
  resultCount,
  years,
}: {
  children: ReactNode;
  resultCount: number;
  years: number[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();
  const [search, setSearch] = useState(params.get("search") ?? "");
  const [expanded, setExpanded] = useState(false);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef(search);
  const cancelSearch = () => {
    if (timer.current) clearTimeout(timer.current);
  };

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    const value = params.get("search") ?? "";
    searchRef.current = value;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync back/forward navigation with the visible input
    setSearch(value);
  }, [params]);

  function navigate(next: URLSearchParams) {
    cancelSearch();
    if (searchRef.current) next.set("search", searchRef.current);
    else next.delete("search");
    next.delete("page");
    startTransition(() =>
      router.push(`${pathname}${next.size ? `?${next}` : ""}`, {
        scroll: false,
      }),
    );
  }
  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    navigate(next);
  }
  function clear() {
    cancelSearch();
    searchRef.current = "";
    setSearch("");
    startTransition(() => router.push(pathname, { scroll: false }));
  }
  const selectedGenres = params.getAll("genre") as GameGenre[];
  const activeCount = [
    "platform",
    "playerModes",
    "pricing",
    "license",
    "year",
    "author",
    "search",
    "genre",
  ].filter((key) => params.has(key) && params.get(key)).length;
  const collections = [
    { label: "All games", query: "", active: !activeCount },
    {
      label: "In your browser",
      query: "platform=web",
      active: params.get("platform") === "web",
    },
    {
      label: "Puzzles",
      query: "genre=puzzle",
      active: selectedGenres.includes(GameGenre.PUZZLE),
    },
    {
      label: "Multiplayer",
      query: "playerModes=multi",
      active: params.get("playerModes") === "multi",
    },
    {
      label: "Open source",
      query: "license=open",
      active: params.get("license") === "open",
    },
  ];

  return (
    <div id="catalog">
      <nav className="collection-nav" aria-label="Browse collections">
        {collections.map(({ label, query, active }) => (
          <Link
            key={label}
            href={`${pathname}${query ? `?${query}` : ""}`}
            scroll={false}
            onClick={cancelSearch}
            className={active ? "is-active" : ""}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="catalog-layout">
        <aside className="catalog-sidebar" aria-label="Catalog filters">
          <div className="sidebar-heading">
            <h2>Refine your search</h2>
            {activeCount > 0 && <button onClick={clear}>Reset</button>}
          </div>
          <button
            className="mobile-filter-toggle"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-controls="catalog-filter-fields"
          >
            Filters {activeCount > 0 && `(${activeCount})`}
            <span aria-hidden="true">{expanded ? "−" : "+"}</span>
          </button>
          <div
            id="catalog-filter-fields"
            className={`filter-fields ${expanded ? "is-expanded" : ""}`}
          >
            {filterOptions.slice(0, 1).map(({ key, label, options }) => (
              <div className="filter-field" key={key}>
                <span>{label}</span>
                <FilterSelect
                  aria-label={label}
                  value={params.get(key) ?? ""}
                  options={options}
                  onChange={(value) => setFilter(key, value)}
                />
              </div>
            ))}
            <div className="filter-field">
              <span>Genre</span>
              <GenreMultiSelect
                selectedGenres={selectedGenres}
                onSelectionChange={(genres) => {
                  const next = new URLSearchParams(params);
                  next.delete("genre");
                  genres.forEach((genre) => next.append("genre", genre));
                  navigate(next);
                }}
              />
            </div>
            <div className="filter-field">
              <span>Year</span>
              <FilterSelect
                aria-label="Year"
                value={params.get("year") ?? ""}
                options={[
                  { value: "", label: "All years" },
                  ...years.map((year) => ({
                    value: String(year),
                    label: String(year),
                  })),
                ]}
                onChange={(value) => setFilter("year", value)}
              />
            </div>
            {filterOptions.slice(1).map(({ key, label, options }) => (
              <div className="filter-field" key={key}>
                <span>{label}</span>
                <FilterSelect
                  aria-label={label}
                  value={params.get(key) ?? ""}
                  options={options}
                  onChange={(value) => setFilter(key, value)}
                />
              </div>
            ))}
            {params.get("author") && (
              <div className="author-filter">
                <span>By {params.get("author")}</span>
                <button
                  aria-label="Remove author filter"
                  onClick={() => setFilter("author", "")}
                >
                  ×
                </button>
              </div>
            )}
            {activeCount > 0 && (
              <button className="clear-filters" onClick={clear}>
                Clear all filters ↗
              </button>
            )}
            <div className="sidebar-note">
              <span aria-hidden="true">↳</span>
              <p>
                Every game starts with a{" "}
                <a
                  href="https://news.ycombinator.com/show"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Hacker News story.
                </a>
              </p>
            </div>
          </div>
        </aside>
        <section
          className="catalog-results"
          aria-label="Games"
          aria-busy={pending}
        >
          <div className="catalog-toolbar">
            <div className="catalog-search">
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path d="m16 16 5 5" />
              </svg>
              <input
                type="search"
                aria-label="Search games"
                placeholder="Search for your next game…"
                value={search}
                onChange={(event) => {
                  const value = event.target.value;
                  setSearch(value);
                  searchRef.current = value;
                  cancelSearch();
                  timer.current = setTimeout(
                    () => navigate(new URLSearchParams(params)),
                    300,
                  );
                }}
              />
            </div>
            <FilterSelect
              aria-label="Sort games"
              wrapperClassName="sort-control"
              value={params.get("sortBy") ?? "releaseDate-desc"}
              options={sortOptions}
              onChange={(value) => setFilter("sortBy", value)}
            />
          </div>
          <div className="results-caption" role="status" aria-live="polite">
            <span>
              {pending
                ? "Finding games…"
                : `${resultCount.toLocaleString("en-US")} ${resultCount === 1 ? "game" : "games"}${activeCount ? " found" : " in the collection"}`}
            </span>
            <span className="results-caption-note">MADE BY THE COMMUNITY</span>
          </div>
          <div
            className={
              pending ? "results-content is-loading" : "results-content"
            }
          >
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}

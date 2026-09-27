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
      ["", "All platforms"],
      ["web", "Browser"],
      ["desktop", "Desktop"],
      ["console", "Console"],
      ["ios", "iOS"],
      ["android", "Android"],
    ],
  },
  {
    key: "playerModes",
    label: "Players",
    options: [
      ["", "Any player mode"],
      ["single", "Single player"],
      ["multi", "Multiplayer"],
    ],
  },
  {
    key: "pricing",
    label: "Price",
    options: [
      ["", "Any price"],
      ["free", "Free"],
      ["freemium", "Freemium"],
      ["paid", "Paid"],
    ],
  },
  {
    key: "license",
    label: "Source code",
    options: [
      ["", "Any availability"],
      ["open", "Open source"],
      ["closed", "Closed source"],
    ],
  },
];

export default function GameFilters({
  children,
  resultCount,
}: {
  children: ReactNode;
  resultCount: number;
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
              <label className="filter-field" key={key}>
                <span>{label}</span>
                <FilterSelect
                  name={key}
                  aria-label={label}
                  value={params.get(key) ?? ""}
                  onChange={(e) => setFilter(key, e.target.value)}
                >
                  {options.map(([value, title]) => (
                    <option key={value} value={value}>
                      {title}
                    </option>
                  ))}
                </FilterSelect>
              </label>
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
            {filterOptions.slice(1).map(({ key, label, options }) => (
              <label className="filter-field" key={key}>
                <span>{label}</span>
                <FilterSelect
                  name={key}
                  aria-label={label}
                  value={params.get(key) ?? ""}
                  onChange={(e) => setFilter(key, e.target.value)}
                >
                  {options.map(([value, title]) => (
                    <option key={value} value={value}>
                      {title}
                    </option>
                  ))}
                </FilterSelect>
              </label>
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
              name="sortBy"
              aria-label="Sort games"
              wrapperClassName="sort-control"
              value={params.get("sortBy") ?? "releaseDate-desc"}
              onChange={(e) => setFilter("sortBy", e.target.value)}
            >
              <option value="releaseDate-desc">Newest first</option>
              <option value="releaseDate-asc">Oldest first</option>
              <option value="hnPoints-desc">Most HN points</option>
              <option value="hnPoints-asc">Fewest HN points</option>
            </FilterSelect>
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

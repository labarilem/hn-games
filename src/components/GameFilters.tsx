'use client';

import { GameGenre } from "@/types/game";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

export default function GameFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isExpanded, setIsExpanded] = useState(false);

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
      return params.toString();
    },
    [searchParams]
  );

  const activeFiltersCount = [
    searchParams.get('platform'),
    searchParams.get('genre'),
    searchParams.get('playerMode'),
    searchParams.get('businessModel'),
    searchParams.get('sortBy'),
  ].filter(Boolean).length;

  const hasSearch = Boolean(searchParams.get('search'));

  return (
    <div className="space-y-4 mb-8">
      {/* Mobile View */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full bg-[#242424] rounded-lg px-4 py-3 flex justify-between items-center text-left"
        >
          <span className="flex items-center gap-2">
            <svg
              className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            Filters
            {(activeFiltersCount > 0 || hasSearch) && (
              <span className="bg-[#646cff] text-white text-sm px-2 py-0.5 rounded-full">
                {activeFiltersCount + (hasSearch ? 1 : 0)}
              </span>
            )}
          </span>
        </button>

        {isExpanded && (
          <div className="mt-2 space-y-2">
            <input
              type="text"
              placeholder="Search games..."
              className="w-full bg-[#242424] rounded-lg px-4 py-3 border border-[#363636] focus:border-[#646cff] focus:ring-1 focus:ring-[#646cff] outline-none"
              onChange={(e) => {
                router.push(`/?${createQueryString('search', e.target.value)}`);
              }}
              defaultValue={searchParams.get('search') ?? ''}
            />
            
            <select
              className="w-full bg-[#242424] rounded-lg px-4 py-3 border border-[#363636] focus:border-[#646cff] focus:ring-1 focus:ring-[#646cff] outline-none"
              onChange={(e) => {
                router.push(`/?${createQueryString('platform', e.target.value)}`);
              }}
              defaultValue={searchParams.get('platform') ?? ''}
            >
              <option value="">All Platforms</option>
              <option value="web">Web</option>
              <option value="desktop">Desktop</option>
            </select>

            <select
              className="w-full bg-[#242424] rounded-lg px-4 py-3 border border-[#363636] focus:border-[#646cff] focus:ring-1 focus:ring-[#646cff] outline-none"
              onChange={(e) => {
                router.push(`/?${createQueryString('genre', e.target.value)}`);
              }}
              defaultValue={searchParams.get('genre') ?? ''}
            >
              <option value="">All Genres</option>
              {Object.values(GameGenre).map((genre) => (
                <option key={genre} value={genre}>
                  {genre.charAt(0).toUpperCase() + genre.slice(1)}
                </option>
              ))}
            </select>

            <select
              className="w-full bg-[#242424] rounded-lg px-4 py-3 border border-[#363636] focus:border-[#646cff] focus:ring-1 focus:ring-[#646cff] outline-none"
              onChange={(e) => {
                router.push(`/?${createQueryString('playerMode', e.target.value)}`);
              }}
              defaultValue={searchParams.get('playerMode') ?? ''}
            >
              <option value="">All Player Modes</option>
              <option value="single">Single Player</option>
              <option value="multi">Multiplayer</option>
            </select>

            <select
              className="w-full bg-[#242424] rounded-lg px-4 py-3 border border-[#363636] focus:border-[#646cff] focus:ring-1 focus:ring-[#646cff] outline-none"
              onChange={(e) => {
                router.push(`/?${createQueryString('businessModel', e.target.value)}`);
              }}
              defaultValue={searchParams.get('businessModel') ?? ''}
            >
              <option value="">All Business Models</option>
              <option value="free">Free</option>
              <option value="commercial">Commercial</option>
            </select>

            <select
              className="w-full bg-[#242424] rounded-lg px-4 py-3 border border-[#363636] focus:border-[#646cff] focus:ring-1 focus:ring-[#646cff] outline-none"
              onChange={(e) => {
                router.push(`/?${createQueryString('sortBy', e.target.value)}`);
              }}
              defaultValue={`${searchParams.get('sortBy') ?? 'releaseDate-desc'}`}
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
      <div className="hidden lg:grid lg:grid-cols-6 gap-4">
        <input
          type="text"
          placeholder="Search games..."
          className="bg-[#242424] rounded-lg px-4 py-3 border border-[#363636] focus:border-[#646cff] focus:ring-1 focus:ring-[#646cff] outline-none"
          onChange={(e) => {
            router.push(`/?${createQueryString('search', e.target.value)}`);
          }}
          defaultValue={searchParams.get('search') ?? ''}
        />
        
        <select
          className="bg-[#242424] rounded-lg px-4 py-3 border border-[#363636] focus:border-[#646cff] focus:ring-1 focus:ring-[#646cff] outline-none"
          onChange={(e) => {
            router.push(`/?${createQueryString('platform', e.target.value)}`);
          }}
          defaultValue={searchParams.get('platform') ?? ''}
        >
          <option value="">All Platforms</option>
          <option value="web">Web</option>
          <option value="desktop">Desktop</option>
        </select>

        <select
          className="bg-[#242424] rounded-lg px-4 py-3 border border-[#363636] focus:border-[#646cff] focus:ring-1 focus:ring-[#646cff] outline-none"
          onChange={(e) => {
            router.push(`/?${createQueryString('genre', e.target.value)}`);
          }}
          defaultValue={searchParams.get('genre') ?? ''}
        >
          <option value="">All Genres</option>
          {Object.values(GameGenre).map((genre) => (
            <option key={genre} value={genre}>
              {genre.charAt(0).toUpperCase() + genre.slice(1)}
            </option>
          ))}
        </select>

        <select
          className="bg-[#242424] rounded-lg px-4 py-3 border border-[#363636] focus:border-[#646cff] focus:ring-1 focus:ring-[#646cff] outline-none"
          onChange={(e) => {
            router.push(`/?${createQueryString('playerMode', e.target.value)}`);
          }}
          defaultValue={searchParams.get('playerMode') ?? ''}
        >
          <option value="">All Player Modes</option>
          <option value="single">Single Player</option>
          <option value="multi">Multiplayer</option>
        </select>

        <select
          className="bg-[#242424] rounded-lg px-4 py-3 border border-[#363636] focus:border-[#646cff] focus:ring-1 focus:ring-[#646cff] outline-none"
          onChange={(e) => {
            router.push(`/?${createQueryString('businessModel', e.target.value)}`);
          }}
          defaultValue={searchParams.get('businessModel') ?? ''}
        >
          <option value="">All Business Models</option>
          <option value="free">Free</option>
          <option value="commercial">Commercial</option>
        </select>

        <select
          className="bg-[#242424] rounded-lg px-4 py-3 border border-[#363636] focus:border-[#646cff] focus:ring-1 focus:ring-[#646cff] outline-none"
          onChange={(e) => {
            router.push(`/?${createQueryString('sortBy', e.target.value)}`);
          }}
          defaultValue={`${searchParams.get('sortBy') ?? 'releaseDate-desc'}`}
        >
          <option value="releaseDate-desc">Newest First</option>
          <option value="releaseDate-asc">Oldest First</option>
          <option value="hnPoints-desc">Most Popular</option>
          <option value="hnPoints-asc">Least Popular</option>
        </select>
      </div>
    </div>
  );
} 
'use client';

import { GameGenre } from "@/types/game";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export default function GameFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
      return params.toString();
    },
    [searchParams]
  );

  return (
    <div className="space-y-4 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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
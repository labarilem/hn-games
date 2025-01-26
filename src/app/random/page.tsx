'use client';

import { Game } from "@/types/game";
import { useCallback, useEffect, useRef, useState } from "react";
import GameCard from "@/components/GameCard";

export default function Random() {
  const [game, setGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initialFetchDone = useRef(false);

  const fetchRandomGame = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/random');
      if (!response.ok) {
        throw new Error('Failed to fetch random game');
      }
      const data = await response.json();
      setGame(data.game);
    } catch (err) {
      setError('Failed to load random game. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchRandomGame();
    }
  }, [fetchRandomGame]);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-4 text-center">Random Game</h1>
      <p className="text-gray-400 mb-8 text-center">
        Discover a random free browser game.
      </p>

      <div className="flex justify-center mb-8">
        <button
          onClick={fetchRandomGame}
          className="bg-[#646cff] text-white px-6 py-3 rounded-lg hover:bg-[#747bff] transition-colors flex items-center gap-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="animate-spin">⟳</span>
              Loading...
            </>
          ) : (
            <>
              <span>⟳</span>
              Try Another Game
            </>
          )}
        </button>
      </div>

      {error ? (
        <div className="text-red-400 text-center">{error}</div>
      ) : game ? (
        <div className="max-w-sm mx-auto">
          <GameCard game={game} />
        </div>
      ) : (
        <div className="text-center text-gray-400">Loading...</div>
      )}
    </div>
  );
} 
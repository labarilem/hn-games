"use client";

import { createSubmitUrl } from "@/lib/issues";
import { useState } from "react";

export function SubmitGameForm() {
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        const input = e.currentTarget.elements.namedItem(
          "hnUrl"
        ) as HTMLInputElement;
        const url = new URL(input.value);
        const id = url.searchParams.get("id") || "";

        if (url.hostname === "news.ycombinator.com" && id) {
          try {
            const response = await fetch(`/api/games/${id}`);
            if (response.ok) {
              const existingGame = await response.json();
              setError(
                `A game with ID ${id} already exists in the catalog. Name: ${existingGame.name}`
              );
              setIsLoading(false);
              return;
            }
            window.open(createSubmitUrl(id), "_blank");
            // Clear the form and error after successful submission
            input.value = "";
            setError("");
            setIsLoading(false);
          } catch (err) {
            setError("Failed to check if game exists. Please try again.");
            setIsLoading(false);
          }
        }
      }}
      className="flex flex-col items-center gap-4"
    >
      <input
        type="url"
        name="hnUrl"
        placeholder="https://news.ycombinator.com/item?id=..."
        pattern="https://news\.ycombinator\.com/item\?id=\d+"
        required
        className="w-full px-4 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
      />
      <button
        type="submit"
        disabled={isLoading}
        className="bg-[#646cff] text-white px-4 py-2 rounded hover:bg-[#747bff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative"
      >
        {isLoading ? (
          <>
            <span className="opacity-0">Submit New Game</span>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          </>
        ) : (
          "Submit New Game"
        )}
      </button>
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
    </form>
  );
}

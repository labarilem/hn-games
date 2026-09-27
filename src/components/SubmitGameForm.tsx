"use client";

import { createSubmitUrl } from "@/lib/issues";
import { useState } from "react";

export function SubmitGameForm() {
  const [errorMsg, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
          const input = e.currentTarget.elements.namedItem(
            "hnUrl",
          ) as HTMLInputElement;
          const url = new URL(input.value);
          const id = url.searchParams.get("id") || "";

          if (url.hostname !== "news.ycombinator.com" || !id) {
            setError("Please enter a valid Hacker News item URL.");
            return;
          }

          const response = await fetch(`/api/games/${id}`);
          if (response.ok) {
            const existingGame = await response.json();
            setError(
              `A game with ID ${id} already exists in the catalog. Name: ${existingGame.name}`,
            );
            return;
          }

          window.open(createSubmitUrl(id), "_blank");
          input.value = "";
          setError("");
        } catch {
          setError("Failed to check if game exists. Please try again.");
        } finally {
          setIsLoading(false);
        }
      }}
      className="w-full"
    >
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
        <input
          type="url"
          name="hnUrl"
          aria-label="Hacker News post URL"
          placeholder="https://news.ycombinator.com/item?id=..."
          pattern="https://news\.ycombinator\.com/item\?id=\d+"
          required
          className="hn-form-input flex-1"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="hn-btn-primary px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed relative w-full sm:w-auto mt-2 sm:mt-0"
        >
          {isLoading ? (
            <>
              <span className="opacity-0">Submit</span>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            </>
          ) : (
            "Submit"
          )}
        </button>
      </div>

      {errorMsg && <p className="mt-2 text-red-400 text-sm">{errorMsg}</p>}
    </form>
  );
}

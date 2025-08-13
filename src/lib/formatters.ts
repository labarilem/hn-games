/**
 * Formats a game genre string for display in the UI
 * - Replaces underscores with spaces
 *
 * @param genre - The raw genre string
 * @returns The formatted genre string
 *
 * @example
 * formatGenre("tower_defense") // "tower defense"
 * formatGenre("action") // "action"
 */
export function formatGenre(genre: string): string {
  return genre.replace(/_/g, " ");
}

/**
 * Formats a game genre string for display in filter dropdowns
 * - Capitalizes the first letter
 * - Replaces underscores with spaces
 *
 * @param genre - The raw genre string
 * @returns The formatted genre string in uppercase
 *
 * @example
 * formatGenreForFilter("tower_defense") // "Tower defense"
 * formatGenreForFilter("action") // "Action"
 */
export function formatGenreForFilter(genre: string): string {
  return (genre.charAt(0).toUpperCase() + genre.slice(1)).replace(/_/g, " ");
}

import { games } from "@/data/games";
import { GameGenre, Platform, PlayerMode, pricing } from "@/types/game";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Pagination
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = Math.min(
    parseInt(searchParams.get("pageSize") || "9"), // Default to 9 items per page
    100
  );

  // Filters
  const search = searchParams.get("search")?.toLowerCase();
  const platform = searchParams.get("platform") as Platform;
  const playerMode = searchParams.get("playerMode") as PlayerMode;
  const author = searchParams.get("author");
  const genre = searchParams.get("genre") as GameGenre;
  const pricing = searchParams.get("pricing") as pricing;
  
  // Sorting
  const sortBy = searchParams.get("sortBy")?.split("-")[0] || "releaseDate";
  const sortOrder = searchParams.get("sortBy")?.split("-")[1] || "desc";

  let filteredGames = [...games];

  // Apply filters
  if (search) {
    filteredGames = filteredGames.filter(
      game =>
        game.name.toLowerCase().includes(search) ||
        game.description.toLowerCase().includes(search)
    );
  }

  if (platform) {
    filteredGames = filteredGames.filter(game =>
      game.platforms.includes(platform)
    );
  }

  if (playerMode) {
    filteredGames = filteredGames.filter(game => game.playerMode === playerMode);
  }

  if (author) {
    filteredGames = filteredGames.filter(game => game.author === author);
  }

  if (genre) {
    filteredGames = filteredGames.filter(game => game.genre === genre);
  }

  if (pricing) {
    filteredGames = filteredGames.filter(
      game => game.pricing === pricing
    );
  }

  // Apply sorting
  filteredGames.sort((a, b) => {
    const aValue = a[sortBy as keyof typeof a];
    const bValue = b[sortBy as keyof typeof b];
    
    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    }
    return aValue < bValue ? 1 : -1;
  });

  // Calculate pagination
  const totalGames = filteredGames.length;
  const totalPages = Math.ceil(totalGames / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedGames = filteredGames.slice(startIndex, endIndex);

  return NextResponse.json({
    games: paginatedGames,
    pagination: {
      page,
      pageSize,
      totalPages,
      totalGames,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  });
} 
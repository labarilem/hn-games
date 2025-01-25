import { games } from "@/data/games";
import { GameGenre, Platform, PlayerMode, BusinessModel } from "@/types/game";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Pagination
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = Math.min(
    parseInt(searchParams.get("pageSize") || "20"),
    100
  );

  // Filters
  const search = searchParams.get("search")?.toLowerCase();
  const platform = searchParams.get("platform") as Platform;
  const playerMode = searchParams.get("playerMode") as PlayerMode;
  const author = searchParams.get("author");
  const genre = searchParams.get("genre") as GameGenre;
  const businessModel = searchParams.get("businessModel") as BusinessModel;
  
  // Sorting
  const sortBy = searchParams.get("sortBy") || "releaseDate";
  const sortOrder = searchParams.get("sortOrder") || "desc";

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

  if (businessModel) {
    filteredGames = filteredGames.filter(
      game => game.businessModel === businessModel
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

  // Apply pagination
  const totalGames = filteredGames.length;
  const totalPages = Math.ceil(totalGames / pageSize);
  const offset = (page - 1) * pageSize;
  const paginatedGames = filteredGames.slice(offset, offset + pageSize);

  return NextResponse.json({
    games: paginatedGames,
    pagination: {
      page,
      pageSize,
      totalPages,
      totalGames,
    },
  });
} 
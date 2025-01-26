import { games } from "@/data/games";
import { NextResponse } from "next/server";

export async function GET() {
  // Filter games that are free and playable on web
  const eligibleGames = games.filter(
    game => game.pricing === 'free' && game.platforms.includes('web')
  );

  if (eligibleGames.length === 0) {
    return NextResponse.json(
      { error: "No eligible games found" },
      { status: 404 }
    );
  }

  // Pick a random game from the filtered list
  const randomGame = eligibleGames[Math.floor(Math.random() * eligibleGames.length)];

  return NextResponse.json({ game: randomGame });
} 
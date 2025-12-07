import { getGameById } from "@/lib/games";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  props: { params: Promise<{ gameId: string }> }
) {
  const params = await props.params;
  if (!params.gameId || !/^\d+$/.test(params.gameId))
    return new NextResponse("Invalid gameId", { status: 400 });

  const game = getGameById(params.gameId);

  if (!game) return new NextResponse("Game not found", { status: 404 });

  return NextResponse.json(game);
}

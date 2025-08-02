import { Platform, PlayerMode, Pricing } from "../types/game";
import { games } from "./games";

export const immediatelyPlayableGames = games.filter(
  (game) =>
    game.pricing === Pricing.FREE &&
    game.platforms.includes(Platform.WEB) &&
    game.playerModes.includes(PlayerMode.SINGLE)
);

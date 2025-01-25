export type Platform = "web" | "desktop";
export type PlayerMode = "single" | "multi";
export type BusinessModel = "free" | "commercial";

export enum GameGenre {
  ACTION = "action",
  ADVENTURE = "adventure",
  PUZZLE = "puzzle",
  STRATEGY = "strategy",
  RPG = "rpg",
  SIMULATION = "simulation",
  PLATFORMER = "platformer",
  ROGUELIKE = "roguelike"
}

export interface Game {
  id: string;
  name: string;
  description: string;
  platforms: Platform[];
  releaseDate: Date;
  playerMode: PlayerMode;
  author: string;
  genre: GameGenre;
  hnUrl: string;
  hnPoints: number;
  playUrl: string;
  businessModel: BusinessModel;
  imageUrl: string;
} 
export type Platform = 'desktop' | 'web' | 'console' | 'ios' | 'android';
export type PlayerMode = "single" | "multi";
export type Pricing = 'free' | 'paid';

// all used
export enum GameGenre {
  WORD = "word",
  ROGUELIKE = "roguelike",
  ACTION = "action",
  ADVENTURE = "adventure",
  PUZZLE = "puzzle",
  RPG = "rpg",
  FITNESS = "fitness",
  CODING = "coding",
  STRATEGY = "strategy",
  TYPING = "typing",
  ARCADE = "arcade",
  SURVIVAL = "survival",
  PLATFORMER = "platformer",
  SPORT = "sport",
  HORROR = "horror",
  CARD = "card",
  SIMULATION = "simulation",
  EDUCATIONAL = "educational",
}

export interface Game {
  id: string;
  name: string;
  description: string;
  platforms: Platform[];
  releaseDate: Date;
  playerMode: PlayerMode[];  // Changed from PlayerMode to PlayerMode[]
  author: string;
  genre: GameGenre;
  hnUrl: string;
  hnPoints: number;
  playUrl: string;
  pricing: Pricing;
  imageUrl: string;
}
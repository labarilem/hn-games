export enum Platform {
  DESKTOP = "desktop",
  WEB = "web",
  CONSOLE = "console",
  IOS = "ios",
  ANDROID = "android",
}

export enum PlayerMode {
  SINGLE = "single",
  MULTI = "multi",
}

export enum Pricing {
  FREE = "free",
  PAID = "paid",
}

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
  QUIZ = "quiz",
}

export interface Game {
  id: string;
  name: string;
  description: string;
  platforms: Platform[];
  releaseDate: Date;
  playerModes: PlayerMode[];
  author: string;
  genre: GameGenre;
  hnUrl: string;
  hnPoints: number;
  playUrl: string;
  pricing: Pricing;
  imageUrl: string;
}

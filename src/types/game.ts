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
  FREEMIUM = "freemium"
}

export enum LicenseType {
  OPEN = "open",
  CLOSED = "closed"
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
  MMO = "mmo",
  IDLE = "idle",
  INCREMENTAL = "incremental",
  SHOOTER = "shooter",
  MEMORY = "memory",
  KIDS = "kids",
  MATH = "math",
  TEXT = "text",
  STEALTH = "stealth",
  MUSIC = "music",
  BOARD = "board",
  TOWER_DEFENSE = "tower_defense",
  COOPERATIVE = "cooperative",
  SANDBOX = "sandbox",
  DRIVING = "driving",
  DAILY = "daily",
  GEOGRAPHY = "geography",
}

export type Game = {
  id: string;
  name: string;
  description: string;
  platforms: Platform[];
  releaseDate: Date;
  playerModes: PlayerMode[];
  author: string;
  genres: GameGenre[];
  hnUrl: string;
  hnPoints: number;
  playUrl: string;
  pricing: Pricing;
  imageUrl: string;
  isActive: boolean;
  sourceCodeUrl: string | null;
};

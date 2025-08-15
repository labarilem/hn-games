
    import { Game, GameGenre, Platform, PlayerMode, Pricing } from "@/types/game";
    
    export const games: Game[] = [
        {id: "18316124",
name: "Achi",
description: "Tic-tac-toe with a twist",
author: "gsurma",
hnPoints: 1,
hnUrl: "https://news.ycombinator.com/item?id=18316124",
imageUrl: "/images/games/18316124.jpg",
playUrl: "https://itunes.apple.com/us/app/achi-strategy-game/id1393799957?ls=1&mt=8",
platforms: [Platform.IOS],
playerModes: [PlayerMode.SINGLE, PlayerMode.MULTI],
genres: [GameGenre.STRATEGY],
pricing: Pricing.PAID,
releaseDate: new Date("2018-10-27T15:25:09.000Z"),
isActive: false,
sourceCodeUrl: null,},
{id: "7191187",
name: "Eliss Lines",
description: "A physics drawing puzzle that challenges your strategic thinking",
author: "phest",
hnPoints: 214,
hnUrl: "https://news.ycombinator.com/item?id=7191187",
imageUrl: "/images/games/7191187.jpg",
playUrl: "http://www.toucheliss.com/",
platforms: [Platform.WEB],
playerModes: [PlayerMode.SINGLE],
genres: [GameGenre.PUZZLE, GameGenre.MATH],
pricing: Pricing.FREE,
releaseDate: new Date("2014-02-06T16:34:32.000Z"),
isActive: false,
sourceCodeUrl: null,}
    ];
    
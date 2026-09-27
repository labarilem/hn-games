import { GameGenre as G } from "../../src/types/game";

// Genre evidence must describe play, not a UI control, implementation detail,
// or another game named as inspiration. Unknown games need review, not action.
function gameplayText(value: string): string {
  return value
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(
      /\b(?:inspired by|similar to|unlike|reminds? (?:me|us) of)\b[^.!?\n]*/gi,
      " ",
    )
    .replace(/[_\u2010-\u2014]/g, "-")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function determineGenres(name: string, description = ""): G[] {
  const title = gameplayText(name);
  const text = `${title}. ${gameplayText(description)}`;
  const genres = new Set<G>();
  const add = (genre: G, pattern: RegExp) => {
    if (pattern.test(text)) genres.add(genre);
  };

  add(
    G.WORD,
    /\b(?:word[- ](?:games?|puzzles?|guessing|building)|crosswords?|hangman|spelling bee|category[- ]guessing|connections? games?|taboo[- ]like|guess a target word)\b/,
  );
  add(
    G.PUZZLE,
    /\b(?:puzzles?|sudoku|hashi|crosswords?|hangman|logic games?|maze games?|category[- ]guessing|connections? games?|word[- ](?:games?|guessing|building)|guessing games?|social deduction|infer the system prompt|figure out what system prompt)\b/,
  );
  if (/\b(?:tetris|2048)\b/.test(title)) genres.add(G.PUZZLE);
  add(G.PUZZLE, /\bsolve (?:a |the )?murder mystery\b/);
  // Wordle adaptations can replace words with characters or chemical elements.
  if (/\bwordle\b/.test(text)) {
    genres.add(G.PUZZLE);
    if (
      !/\b(?:guess(?:ing)? (?:a |the )?(?:characters?|chemical elements?)|character guessing|periodic table)\b/.test(
        text,
      )
    )
      genres.add(G.WORD);
  }

  add(
    G.ROGUELIKE,
    /\b(?:rogue[- ]likes?|roguelites?|procedurally generated dungeons)\b/,
  );
  add(
    G.ACTION,
    /\b(?:action[- ](?:games?|adventure|rpg)|play tag|game of tag|tag against|brick breaker|snake game|game of snake)\b/,
  );
  add(
    G.ADVENTURE,
    /\b(?:text[- ](?:based )?adventure|adventure (?:games?|rpg)|tabletop[- ]style adventure)\b/,
  );
  if (/\badventure\b/.test(title)) genres.add(G.ADVENTURE);
  add(G.RPG, /\b(?:rpgs?|role[- ]playing|roleplaying)\b/);
  if (
    /\bpok[e\u00e9]mon\b/.test(text) &&
    /\b(?:battles?|turn[- ]based)\b/.test(text)
  )
    genres.add(G.RPG);

  add(
    G.CODING,
    /\b(?:(?:programming|coding) (?:games?|puzzles?)|(?:write|program) (?:your own )?(?:webassembly )?(?:bots|control algorithms)|(?:practic\w*|learn\w*) (?:mongodb|sql|programming|coding|queries))\b/,
  );
  add(
    G.STRATEGY,
    /\b(?:(?:strategy|strategic|tactical|automation) games?|tower[- ]defen[cs]e|social deduction|turn[- ]based (?:combat|battles?)|mapping,? pathfinding,? and strategy|political simulation)\b/,
  );
  if (genres.has(G.CODING) && genres.has(G.ROGUELIKE)) genres.add(G.STRATEGY);
  add(G.TOWER_DEFENSE, /\btower[- ]defen[cs]e\b/);
  add(G.TYPING, /\b(?:typing games?|typing speed|typing challenges?)\b/);
  if (/\btyping\b/.test(title)) genres.add(G.TYPING);
  add(
    G.ARCADE,
    /\b(?:arcade(?:[- ]style)? games?|brick breaker|breakout|snake game|game of snake)\b/,
  );
  if (/\btetris\b/.test(title)) genres.add(G.ARCADE);
  // These names identify the submitted game, rather than a reference in prose.
  if (/\b(?:snake|paragopher|paratrooper|paradroid)\b/.test(title)) {
    genres.add(G.ARCADE);
    genres.add(G.ACTION);
  }
  if (/\b(?:paragopher|paratrooper|paradroid)\b/.test(title))
    genres.add(G.SHOOTER);

  add(
    G.SIMULATION,
    /\b(?:(?:political|economic|life|flight|landing|spaceflight|submarine) (?:simulation|simulator)|simulation games?|land a spacecraft)\b/,
  );
  add(
    G.EDUCATIONAL,
    /\b(?:educational games?|(?:learn\w*|teach\w*|practic\w*) (?:you |players to |about )?(?:morse|math|binary math|system prompting|prompting|mongodb|sql|confidence calibration|spacing algorithms)|periodic table|recognize dark patterns)\b/,
  );
  add(
    G.QUIZ,
    /\b(?:quiz(?:zes)?|trivia|flag[- ]guessing|guess (?:the )?(?:historical event|flags?)|identify (?:a |the )?historical event)\b/,
  );
  add(G.QUIZ, /\b(?:character[- ]guessing|guess characters)\b/);
  add(
    G.EDUCATIONAL,
    /\b(?:confidence calibration|calibrate your confidence)\b/,
  );
  if (/\bguess\b[^.!?]{0,100}\b(?:map|historical event)\b/.test(text)) {
    genres.add(G.QUIZ);
    genres.add(G.GEOGRAPHY);
  }
  add(
    G.GEOGRAPHY,
    /\b(?:flag[- ]guessing|geography (?:games?|quiz)|guess (?:the )?(?:country|countries|flags?)|historical event and its time and location)\b/,
  );
  add(
    G.MATH,
    /\b(?:math(?:s|ematical)? (?:games?|puzzles?)|binary math|number puzzles?|fibonacci(?:[- ]like)? sequences)\b/,
  );
  add(
    G.TEXT,
    /\b(?:text[- ](?:based )?adventures?|text[- ]based (?:games?|rpg)|interactive fiction)\b/,
  );
  add(G.MUSIC, /\b(?:(?:music|musical|rhythm) games?|rhythm[- ]based)\b/);
  add(
    G.BOARD,
    /\b(?:board games?|chess(?: game)?|checkers|backgammon|reversi|othello)\b/,
  );
  add(
    G.MEMORY,
    /\b(?:memory (?:games?|puzzles?|challenges?)|memorization games?|memorize (?:the )?(?:cards|patterns|sequence))\b/,
  );
  add(G.MMO, /\b(?:mmos?|mmorpgs?|massively multiplayer)\b/);
  add(G.IDLE, /\bidle (?:games?|clicker|rpg)\b/);
  if (/\bidle\b/.test(title)) genres.add(G.IDLE);
  add(G.INCREMENTAL, /\b(?:incremental(?: games?)?|clicker(?: games?)?)\b/);
  add(G.DAILY, /\bdaily (?:\w+[ -]){0,2}(?:games?|puzzles?|challenges?)\b/);
  add(G.SANDBOX, /\bsandbox games?\b/);
  if (/\bsandbox\b/.test(title)) genres.add(G.SANDBOX);

  add(G.FITNESS, /\b(?:fitness games?|exercise games?|exergames?)\b/);
  add(G.SURVIVAL, /\bsurvival (?:games?|horror)\b/);
  add(G.PLATFORMER, /\b(?:platformers?|platforming games?)\b/);
  add(
    G.SPORT,
    /\b(?:(?:sports?|football|soccer|basketball|tennis|golf|cricket|baseball) games?)\b/,
  );
  add(G.HORROR, /\bhorror (?:games?|adventure|survival)\b/);
  add(
    G.CARD,
    /\b(?:card games?|deck[- ]building|deckbuilders?|solitaire|poker|blackjack)\b/,
  );
  add(
    G.SHOOTER,
    /\b(?:shooters?|shoot(?:ing|[- ]em[- ]up) games?|first[- ]person shooter|fps games?)\b/,
  );
  add(
    G.KIDS,
    /\b(?:kid[- ]friendly|games? for (?:kids|children)|children's games?)\b/,
  );
  add(G.STEALTH, /\bstealth (?:games?|action)\b/);
  add(
    G.COOPERATIVE,
    /\b(?:cooperative|co[- ]op) (?:games?|play|multiplayer)\b/,
  );
  add(
    G.DRIVING,
    /\b(?:(?:driving|racing) (?:games?|simulators?)|kart racing)\b/,
  );

  // Stable order matches the site's existing genre enum and avoids duplicates.
  return Object.values(G).filter((genre) => genres.has(genre));
}

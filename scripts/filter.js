/**
 * This script reads a JSON file containing a list of games and prompts the user to keep or discard each game.
 * The filtered games are saved back to the same file.
 */

const fs = require("fs").promises;
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function filterGames(jsonPath) {
  try {
    // Read and parse the JSON file
    const data = await fs.readFile(jsonPath, "utf8");
    const games = JSON.parse(data);

    // Track games to keep
    const keptGames = [];
    const totalGames = games.length;

    console.log(
      `\nReviewing ${totalGames} games. Press Y to keep (default), N to discard, or Ctrl+C to exit.\n`
    );

    // Process each game sequentially using async/await
    for (let i = 0; i < games.length; i++) {
      const game = games[i];

      // Display progress and title
      process.stdout.write(`[${i + 1}/${totalGames}] ${game.name}\n`);

      // Get user input
      const answer = await new Promise((resolve) => {
        rl.question("Keep this game? [Y/n]: ", (answer) =>
          resolve(answer.toLowerCase())
        );
      });

      // Keep game if response is Y or empty
      if (answer === "" || answer === "y") {
        keptGames.push(game);
        console.log("✓ Kept\n");
      } else {
        console.log("✗ Discarded\n");
      }
    }

    // Save filtered games back to file
    await fs.writeFile(jsonPath, JSON.stringify(keptGames, null, 2));
    console.log(`\nSaved ${keptGames.length} games to ${jsonPath}`);

    rl.close();
  } catch (error) {
    console.error("Error:", error);
    rl.close();
    process.exit(1);
  }
}

// Run the script with the JSON file path
filterGames("scripts/data/new.json");

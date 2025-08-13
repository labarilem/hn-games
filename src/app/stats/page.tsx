import GamesYearChart from "@/components/GamesYearChart";
import StatsCard from "@/components/StatsCard";
import {
  gamesCountByYear,
  totalGamesCount,
  totalRipGamesCount,
} from "../../data/stats";

export default function StatsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-4 text-center">Statistics</h1>

      <p className="text-gray-400 text-center mb-8 px-4">
        Explore metrics and trends from the Hacker News games collection.
      </p>

      <section className="mb-8">
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <StatsCard
              value={totalGamesCount}
              label="Active Games"
              color="text-blue-400"
            />
            <StatsCard
              value={totalRipGamesCount}
              label="RIP Games"
              color="text-red-400"
            />
          </div>
          <GamesYearChart gamesCountByYear={gamesCountByYear} />
        </div>
      </section>
    </div>
  );
}

import { gamesCountByYear } from "../../data/stats";
import GamesYearChart from "@/components/GamesYearChart";

export default function StatsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-4 text-center">Statistics</h1>

      <section className="mb-8">
        <div className="space-y-8">
          <GamesYearChart gamesCountByYear={gamesCountByYear} />
        </div>
      </section>
    </div>
  );
}

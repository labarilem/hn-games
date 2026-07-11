type StatsCardProps = { value: number; label: string; color?: string };

export default function StatsCard({
  value,
  label,
  color = "text-hn-accent",
}: StatsCardProps) {
  return (
    <div className="hn-surface p-6 text-center">
      <div className={`text-4xl font-bold ${color} mb-2`}>
        {value.toLocaleString()}
      </div>
      <div className="text-gray-300 text-sm">{label}</div>
    </div>
  );
}

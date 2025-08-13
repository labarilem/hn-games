type StatsCardProps = { value: number; label: string; color?: string };

export default function StatsCard({
  value,
  label,
  color = "text-blue-400",
}: StatsCardProps) {
  return (
    <div className="bg-gray-800 p-6 rounded-lg text-center">
      <div className={`text-4xl font-bold ${color} mb-2`}>
        {value.toLocaleString()}
      </div>
      <div className="text-gray-300 text-sm">{label}</div>
    </div>
  );
}

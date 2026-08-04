import { Card } from "@/components/ui/card";

/** Bento-style stat card: label, big number, short context line, ghost icon watermark. */
export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <Card className="group relative overflow-hidden p-6">
      <div className="relative z-10 flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="text-3xl font-extrabold tabular-nums text-primary-800">{value}</span>
        {hint && <span className="text-xs font-medium text-muted-foreground">{hint}</span>}
      </div>
      <Icon className="pointer-events-none absolute -bottom-4 -end-4 h-28 w-28 text-primary-800/5 transition-transform duration-300 group-hover:scale-110" />
    </Card>
  );
}

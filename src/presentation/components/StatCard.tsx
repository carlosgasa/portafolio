import type { LucideIcon } from "lucide-react";

type StatGradient = "blue" | "cyan" | "purple" | "pink";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "default" | "positive" | "negative";
  gradient?: StatGradient;
}

const GRADIENT_VAR: Record<StatGradient, string> = {
  blue: "var(--gradient-blue)",
  cyan: "var(--gradient-cyan)",
  purple: "var(--gradient-purple)",
  pink: "var(--gradient-pink)",
};

export function StatCard({ label, value, icon: Icon, tone = "default", gradient = "blue" }: StatCardProps) {
  const backgroundImage =
    tone === "positive"
      ? "var(--gradient-positive)"
      : tone === "negative"
        ? "var(--gradient-negative)"
        : GRADIENT_VAR[gradient];

  return (
    <div
      className="relative flex flex-col gap-3 overflow-hidden rounded-2xl p-4 text-white shadow-lg"
      style={{ backgroundImage }}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-medium text-white/80">{label}</span>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
          <Icon className="size-4 text-white" />
        </div>
      </div>
      <div className="font-mono text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

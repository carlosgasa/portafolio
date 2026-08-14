import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "default" | "positive" | "negative";
}

export function StatCard({ label, value, icon: Icon, tone = "default" }: StatCardProps) {
  return (
    <Card className="border-border/60 bg-card/60">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "font-mono text-2xl font-semibold tabular-nums",
            tone === "positive" && "text-positive",
            tone === "negative" && "text-negative",
            tone === "default" && "text-foreground",
          )}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

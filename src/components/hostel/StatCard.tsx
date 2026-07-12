import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label, value, icon: Icon, hint, tone = "default",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  tone?: "default" | "success" | "warning" | "info" | "danger";
}) {
  const toneMap: Record<string, string> = {
    default: "bg-secondary text-secondary-foreground",
    success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-warning-foreground",
    info: "bg-info/15 text-info",
    danger: "bg-destructive/10 text-destructive",
  };
  return (
    <Card className="glass-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", toneMap[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:mb-8">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

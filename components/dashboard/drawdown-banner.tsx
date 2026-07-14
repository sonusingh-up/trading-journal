import { OctagonAlert, TriangleAlert } from "lucide-react";
import type { DrawdownStatus } from "@/lib/drawdown";
import { Progress } from "@/components/ui/progress";
import { currency } from "@/lib/format";
import { cn } from "@/lib/utils";

export function DrawdownBanner({ statuses }: { statuses: DrawdownStatus[] }) {
  const alerts = statuses.filter((s) => s.level !== "ok");
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-3">
      {alerts.map((status) => {
        const breached = status.level === "breached";
        return (
          <div
            key={status.account_name}
            role="alert"
            className={cn(
              "flex items-start gap-4 rounded-2xl border-2 p-5 shadow-soft",
              breached
                ? "border-destructive/50 bg-destructive/10"
                : "border-amber-500/50 bg-amber-500/10",
            )}
          >
            <div
              className={cn(
                "flex size-10 shrink-0 animate-pulse items-center justify-center rounded-2xl text-white",
                breached ? "bg-destructive" : "bg-amber-500",
              )}
            >
              {breached ? (
                <OctagonAlert className="size-5" />
              ) : (
                <TriangleAlert className="size-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "font-semibold",
                  breached
                    ? "text-destructive"
                    : "text-amber-700 dark:text-amber-300",
                )}
              >
                {breached
                  ? `Daily drawdown limit breached — ${status.account_name}`
                  : `Approaching daily drawdown limit — ${status.account_name}`}
              </p>
              <p className="mt-0.5 text-sm text-foreground/80">
                {currency.format(status.today_loss)} lost today —{" "}
                {status.used_pct.toFixed(0)}% of the{" "}
                {currency.format(status.max_daily_drawdown)} daily limit.{" "}
                {breached
                  ? "Stop trading this account for the rest of the day."
                  : `Only ${currency.format(status.remaining)} of loss room remains.`}
              </p>
              <Progress
                value={Math.min(status.used_pct, 100)}
                className={cn(
                  "mt-3 h-2 bg-white/60 dark:bg-black/20",
                  breached
                    ? "[&_[data-slot=progress-indicator]]:bg-destructive"
                    : "[&_[data-slot=progress-indicator]]:bg-amber-500",
                )}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

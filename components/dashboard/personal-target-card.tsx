import type { Account } from "@/lib/generated/prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { currency, signedCurrency, pnlTone } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PersonalTargetCard({ accounts }: { accounts: Account[] }) {
  const profit = accounts.reduce(
    (sum, a) => sum + (a.current_balance - a.starting_balance),
    0,
  );
  const target = accounts.reduce((sum, a) => sum + a.target_profit, 0);
  const pct =
    target > 0 ? Math.min(Math.max((profit / target) * 100, 0), 100) : 0;

  return (
    <Card className="py-5">
      <CardContent className="px-5">
        <div className="flex items-center justify-between">
          <p className="text-[15px] font-bold">Personal Target</p>
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
            {pct.toFixed(0)}% finished
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <p
            className={cn(
              "text-3xl font-extrabold tracking-tight",
              pnlTone(profit) || "text-foreground",
            )}
          >
            {signedCurrency(profit)}
          </p>
          <p className="text-sm font-semibold text-muted-foreground">
            of {currency.format(target)}
          </p>
        </div>
        <div className="mt-3.5 h-2.5 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-success"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[11.5px] font-semibold text-muted-foreground">
          <span>$0</span>
          <span>{currency.format(target)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

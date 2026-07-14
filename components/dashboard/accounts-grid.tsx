import type { Account, Trade } from "@/lib/generated/prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { currency } from "@/lib/format";
import { cn } from "@/lib/utils";

const ICON_STYLES = [
  "bg-blue-500/10 text-blue-600",
  "bg-emerald-500/10 text-emerald-600",
  "bg-violet-500/10 text-violet-600",
  "bg-amber-500/10 text-amber-600",
];

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export function AccountsGrid({
  accounts,
  trades,
}: {
  accounts: Account[];
  trades: Trade[];
}) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  return (
    <div>
      <p className="px-1 pb-2.5 text-[15px] font-bold">Accounts</p>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        {accounts.map((account, i) => {
          const accountTrades = trades.filter(
            (t) => t.account_name === account.account_name,
          );
          const mtdPnl = accountTrades
            .filter((t) => t.date >= monthStart && t.net_pnl != null)
            .reduce((sum, t) => sum + (t.net_pnl ?? 0), 0);
          const baseline = account.current_balance - mtdPnl;
          const mtdPct = baseline > 0 ? (mtdPnl / baseline) * 100 : 0;
          return (
            <Card key={account.id} className="py-4">
              <CardContent className="px-4">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-xl text-[13px] font-extrabold",
                      ICON_STYLES[i % ICON_STYLES.length],
                    )}
                  >
                    {initials(account.account_name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-bold">
                      {account.account_name}
                    </p>
                    <p className="text-[11px] font-semibold text-muted-foreground">
                      {accountTrades.length}{" "}
                      {accountTrades.length === 1 ? "trade" : "trades"}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-[19px] font-extrabold tracking-tight">
                  {currency.format(account.current_balance)}
                </p>
                <p
                  className={cn(
                    "mt-0.5 text-xs font-bold",
                    mtdPnl > 0
                      ? "text-success"
                      : mtdPnl < 0
                        ? "text-destructive"
                        : "text-muted-foreground",
                  )}
                >
                  {mtdPnl === 0
                    ? "flat MTD"
                    : `${mtdPct > 0 ? "+" : ""}${mtdPct.toFixed(1)}% MTD`}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

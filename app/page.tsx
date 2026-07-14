import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { AccountsGrid } from "@/components/dashboard/accounts-grid";
import { DrawdownBanner } from "@/components/dashboard/drawdown-banner";
import { EquityCurveCard } from "@/components/dashboard/equity-curve-card";
import { NewTradeDialog } from "@/components/dashboard/new-trade-dialog";
import { PersonalTargetCard } from "@/components/dashboard/personal-target-card";
import { PnlCalendar } from "@/components/dashboard/pnl-calendar";
import { RecentTradesCard } from "@/components/dashboard/recent-trades-card";
import { Card, CardContent } from "@/components/ui/card";
import { Reveal } from "@/components/motion/reveal";
import { SiteHeader } from "@/components/site-header";
import { computeDailyDrawdown } from "@/lib/drawdown";
import { currency, signedCurrency, shortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [trades, accounts] = await Promise.all([
    prisma.trade.findMany({
      where: { user_id: user.id },
      orderBy: { date: "desc" },
    }),
    prisma.account.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: "asc" },
    }),
  ]);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const closed = trades.filter((t) => t.net_pnl != null);
  const wins = closed.filter((t) => (t.net_pnl ?? 0) > 0);
  const losses = closed.filter((t) => (t.net_pnl ?? 0) < 0);
  const winRate = closed.length ? (wins.length / closed.length) * 100 : 0;

  const grossWins = wins.reduce((s, t) => s + (t.net_pnl ?? 0), 0);
  const grossLosses = Math.abs(
    losses.reduce((s, t) => s + (t.net_pnl ?? 0), 0),
  );
  const profitFactor = grossLosses > 0 ? grossWins / grossLosses : null;
  const avgWin = wins.length ? grossWins / wins.length : 0;
  const avgLoss = losses.length ? grossLosses / losses.length : 0;
  const avgWL = avgLoss > 0 && avgWin > 0 ? avgWin / avgLoss : null;

  const balance = accounts.reduce((sum, a) => sum + a.current_balance, 0);
  const mtdPnl = closed
    .filter((t) => t.date >= monthStart)
    .reduce((sum, t) => sum + (t.net_pnl ?? 0), 0);
  const mtdBase = balance - mtdPnl;
  const mtdPct = mtdBase > 0 ? (mtdPnl / mtdBase) * 100 : 0;

  const drawdownStatuses = accounts.map((a) => computeDailyDrawdown(a, trades));

  const dailyPnl: Record<number, number> = {};
  const dailyCount: Record<number, number> = {};
  for (const t of closed) {
    if (t.date < monthStart) continue;
    const d = t.date.getDate();
    dailyPnl[d] = (dailyPnl[d] ?? 0) + (t.net_pnl ?? 0);
    dailyCount[d] = (dailyCount[d] ?? 0) + 1;
  }

  const stats = [
    {
      label: "Win Rate",
      value: `${winRate.toFixed(0)}%`,
      tone: "text-success",
    },
    {
      label: "Profit Factor",
      value: profitFactor != null ? profitFactor.toFixed(2) : "—",
      tone: "text-foreground",
    },
    {
      label: "Avg W/L",
      value: avgWL != null ? `1 : ${avgWL.toFixed(1)}` : "—",
      tone: "text-foreground",
    },
  ];

  const recentTrades = trades.slice(0, 8).map((t) => ({
    id: t.id,
    pair: t.pair,
    side: t.side,
    net_pnl: t.net_pnl,
    dateLabel: shortDate.format(t.date),
    account_name: t.account_name,
    screenshot_url: t.screenshot_url,
  }));

  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(now);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader
        active="overview"
        user={{ username: user.username, email: user.email }}
        action={
          <NewTradeDialog
            accounts={accounts.map((a) => ({
              account_name: a.account_name,
              current_balance: a.current_balance,
            }))}
          />
        }
      />

      <main className="mx-auto w-full max-w-[1060px] flex-1 px-4 pb-16">
        <Reveal className="pt-6">
          <DrawdownBanner statuses={drawdownStatuses} />
        </Reveal>

        <Reveal className="pt-3 pb-5 text-center">
          <p className="text-[13px] font-semibold text-muted-foreground">
            Welcome back, {user.username}
          </p>
          <p className="mt-2.5 text-xs font-bold tracking-[0.04em] text-muted-foreground/80 uppercase">
            Total Balance
          </p>
          <p className="mt-1 text-[40px] leading-tight font-extrabold tracking-tight">
            {currency.format(balance)}
          </p>
          <span
            className={cn(
              "mt-1.5 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[13px] font-bold",
              mtdPnl >= 0
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive",
            )}
          >
            {mtdPnl >= 0 ? "▲" : "▼"} {signedCurrency(mtdPnl)} ({mtdPct > 0 ? "+" : ""}
            {mtdPct.toFixed(1)}%) this month
          </span>
        </Reveal>

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="flex min-w-0 flex-col gap-5">
            <section className="grid grid-cols-3 gap-3">
              {stats.map((stat, i) => (
                <Reveal key={stat.label} delay={0.06 + i * 0.05}>
                  <Card className="py-3.5">
                    <CardContent className="px-2 text-center">
                      <p className="text-[10.5px] font-extrabold tracking-wide text-muted-foreground uppercase">
                        {stat.label}
                      </p>
                      <p
                        className={cn(
                          "mt-1 text-lg font-extrabold tracking-tight",
                          stat.tone,
                        )}
                      >
                        {stat.value}
                      </p>
                    </CardContent>
                  </Card>
                </Reveal>
              ))}
            </section>

            <Reveal delay={0.12}>
              <PersonalTargetCard accounts={accounts} />
            </Reveal>

            <Reveal delay={0.18}>
              <AccountsGrid accounts={accounts} trades={trades} />
            </Reveal>

            <Reveal delay={0.24}>
              <RecentTradesCard trades={recentTrades} />
            </Reveal>
          </div>

          <div className="flex min-w-0 flex-col gap-5">
            <Reveal delay={0.27}>
              <EquityCurveCard trades={trades} />
            </Reveal>

            <Reveal delay={0.3}>
              <PnlCalendar
                year={now.getFullYear()}
                month={now.getMonth()}
                today={now.getDate()}
                monthLabel={monthLabel}
                dailyPnl={dailyPnl}
                dailyCount={dailyCount}
              />
            </Reveal>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex w-full max-w-[1060px] items-center justify-between px-4 py-5 text-xs text-muted-foreground">
          <span>Trade Journal — local SQLite via Prisma</span>
          <span className="font-mono">v0.1.0</span>
        </div>
      </footer>
    </div>
  );
}

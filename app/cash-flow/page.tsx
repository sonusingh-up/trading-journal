import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { IncomeStreamsChart } from "@/components/cashflow/income-streams-chart";
import { LogIncomeDialog } from "@/components/cashflow/log-income-dialog";
import { Reveal } from "@/components/motion/reveal";
import { SiteHeader } from "@/components/site-header";
import { sourceSlug, type MonthlyIncomeRow } from "@/lib/income";
import { currency } from "@/lib/format";
import type { IncomeStream } from "@prisma/client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cash Flow — Trade Journal",
  description: "Monthly revenue across your business income streams.",
};

const monthLabel = new Intl.DateTimeFormat("en-US", { month: "short" });
const fullDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const SERIES_DOT_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export default async function CashFlowPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const entries: IncomeStream[] = await prisma.incomeStream.findMany({
    where: { user_id: user.id },
    orderBy: { date: "asc" },
  });

  // Fixed alphabetical order so a source keeps its color as data changes.
  const sources = [...new Set(entries.map((e) => e.source_name))].sort();

  const monthKeys = [
    ...new Set(
      entries.map(
        (e) =>
          `${e.date.getFullYear()}-${String(e.date.getMonth() + 1).padStart(2, "0")}`,
      ),
    ),
  ].sort();

  const chartData: MonthlyIncomeRow[] = monthKeys.map((key) => {
    const [year, month] = key.split("-").map(Number);
    const row: MonthlyIncomeRow = {
      month: monthLabel.format(new Date(year, month - 1, 1)),
    };
    for (const source of sources) row[sourceSlug(source)] = 0;
    for (const e of entries) {
      const eKey = `${e.date.getFullYear()}-${String(e.date.getMonth() + 1).padStart(2, "0")}`;
      if (eKey === key) {
        row[sourceSlug(e.source_name)] =
          (row[sourceSlug(e.source_name)] as number) + e.amount;
      }
    }
    return row;
  });

  const total = entries.reduce((sum, e) => sum + e.amount, 0);
  const now = new Date();
  const thisMonth = entries
    .filter(
      (e) =>
        e.date.getFullYear() === now.getFullYear() &&
        e.date.getMonth() === now.getMonth(),
    )
    .reduce((sum, e) => sum + e.amount, 0);
  const monthlyAverage = monthKeys.length ? total / monthKeys.length : 0;
  const totalsBySource = sources.map((source) => ({
    source,
    total: entries
      .filter((e) => e.source_name === source)
      .reduce((sum, e) => sum + e.amount, 0),
  }));
  const topStream = totalsBySource.reduce(
    (best, s) => (s.total > (best?.total ?? -Infinity) ? s : best),
    undefined as { source: string; total: number } | undefined,
  );

  const stats = [
    {
      label: "This month",
      value: currency.format(thisMonth),
      note: monthLabel.format(now) + " so far",
    },
    {
      label: "Monthly average",
      value: currency.format(monthlyAverage),
      note: `over ${monthKeys.length} months`,
    },
    {
      label: "Top stream",
      value: topStream?.source ?? "—",
      note: topStream ? `${currency.format(topStream.total)} all time` : "no income yet",
    },
  ];

  const recent = [...entries].reverse().slice(0, 10);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader
        active="cashflow"
        user={{ username: user.username, email: user.email }}
        action={<LogIncomeDialog sources={sources} />}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-16">
        <Reveal className="pt-10 pb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">
            Cash Flow
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Revenue across your business income streams
          </p>
        </Reveal>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((stat, i) => (
            <Reveal key={stat.label} delay={0.06 + i * 0.06} className="h-full">
              <Card className="h-full py-5">
                <CardContent className="px-5">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-1.5 text-2xl font-semibold tracking-tight">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {stat.note}
                  </p>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </section>

        <Reveal delay={0.2} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Monthly revenue by stream
              </CardTitle>
              <CardDescription>
                {currency.format(total)} collected across{" "}
                {sources.length} streams
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <IncomeStreamsChart data={chartData} sources={sources} />
              ) : (
                <EmptyState
                  icon={Wallet}
                  title="No income recorded yet"
                  description="Log revenue with the Log income button above and the monthly breakdown will appear here."
                  className="border-none bg-transparent py-10"
                />
              )}
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={0.28} className="mt-10">
          <div className="mb-4">
            <h2 className="text-lg font-semibold tracking-tight">
              Recent income
            </h2>
            <p className="text-sm text-muted-foreground">
              Latest entries across all streams
            </p>
          </div>
          {recent.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No income entries yet"
              description="Each logged payment will show up here with its stream and date."
            />
          ) : (
          <Card className="py-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Source</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="pr-6 text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((entry) => (
                  <TableRow key={entry.id} className="hover:bg-accent/40">
                    <TableCell className="pl-6">
                      <span className="flex items-center gap-2.5 font-medium">
                        <span
                          aria-hidden
                          className="size-2.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor:
                              SERIES_DOT_COLORS[
                                sources.indexOf(entry.source_name) %
                                  SERIES_DOT_COLORS.length
                              ],
                          }}
                        />
                        {entry.source_name}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {currency.format(entry.amount)}
                    </TableCell>
                    <TableCell className="pr-6 text-right text-muted-foreground tabular-nums">
                      {fullDate.format(entry.date)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          )}
        </Reveal>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5 text-xs text-muted-foreground">
          <span>Trade Journal — local SQLite via Prisma</span>
          <span className="font-mono">v0.1.0</span>
        </div>
      </footer>
    </div>
  );
}

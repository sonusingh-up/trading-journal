"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { signedCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const DOW = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export function PnlCalendar({
  year,
  month,
  today,
  monthLabel,
  dailyPnl,
  dailyCount,
}: {
  year: number;
  /** 0-based month */
  month: number;
  today: number;
  monthLabel: string;
  dailyPnl: Record<number, number>;
  dailyCount: Record<number, number>;
}) {
  const tradedDays = Object.keys(dailyCount).map(Number);
  const defaultDay = tradedDays.length
    ? Math.max(...tradedDays.filter((d) => d <= today))
    : today;
  const [selected, setSelected] = React.useState(defaultDay);

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthPnl = Object.values(dailyPnl).reduce((a, b) => a + b, 0);

  const selPnl = dailyPnl[selected] ?? 0;
  const selCount = dailyCount[selected] ?? 0;
  const selDateLabel = `${monthLabel.split(" ")[0]} ${selected}, ${year}`;

  return (
    <Card className="py-5">
      <CardContent className="px-5">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-[15px] font-bold">{monthLabel}</p>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold",
              monthPnl >= 0
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive",
            )}
          >
            {monthPnl >= 0 ? "▲" : "▼"} {signedCurrency(monthPnl)}
          </span>
        </div>
        <p className="mb-3.5 text-xs font-semibold text-muted-foreground">
          Daily net P&L heatmap
        </p>

        <div className="mb-2 grid grid-cols-7 gap-1.5 text-center text-[10.5px] font-extrabold tracking-wide text-muted-foreground">
          {DOW.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: firstDow }).map((_, i) => (
            <div key={`pad-${i}`} className="aspect-square" />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
            const pnl = dailyPnl[d];
            const future = d > today;
            const isToday = d === today;
            const isSelected = d === selected;
            return (
              <button
                key={d}
                type="button"
                disabled={future}
                onClick={() => setSelected(d)}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-[10px] text-[12.5px] font-bold transition-transform",
                  future
                    ? "cursor-default text-slate-300"
                    : "cursor-pointer hover:scale-108",
                  !future &&
                    (pnl == null
                      ? "bg-secondary text-muted-foreground"
                      : pnl > 0
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"),
                  isToday && "bg-primary text-primary-foreground",
                  isSelected &&
                    "ring-2 ring-primary shadow-[0_6px_14px_rgba(37,99,235,0.25)]",
                )}
              >
                {d}
              </button>
            );
          })}
        </div>

        <div className="mt-3.5 flex items-center gap-3.5 text-[11px] font-semibold text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-[3px] bg-emerald-100" />
            Profit day
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-[3px] bg-red-100" />
            Loss day
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-[3px] bg-secondary" />
            No trades
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl bg-secondary/60 p-4">
          <div>
            <p className="text-xs font-bold text-foreground/70">
              {selDateLabel}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
              {selCount === 0
                ? "No trades taken"
                : `${selCount} ${selCount === 1 ? "trade" : "trades"}`}
            </p>
          </div>
          <p
            className={cn(
              "text-xl font-extrabold tracking-tight",
              selCount === 0
                ? "text-muted-foreground"
                : selPnl > 0
                  ? "text-success"
                  : selPnl < 0
                    ? "text-destructive"
                    : "text-foreground",
            )}
          >
            {selCount === 0 ? "—" : signedCurrency(selPnl)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

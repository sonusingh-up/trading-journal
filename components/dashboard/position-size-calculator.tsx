"use client";

import * as React from "react";
import { Calculator, ChevronDown, TriangleAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { currency } from "@/lib/format";
import { cn } from "@/lib/utils";

export type PositionSizeInputs = {
  balance: number;
  riskPct: number;
  stopPips: number;
  /** Value of one pip/point per 1.0 lot, in account currency ($10 for a standard forex lot). */
  pipValuePerLot: number;
};

export type PositionSizeResult = {
  riskAmount: number;
  /** Exact lot size before rounding. */
  rawLots: number;
  /** Rounded DOWN to 0.01 (micro-lot step) so the risk cap is never exceeded. */
  lots: number;
};

export function calculateLotSize({
  balance,
  riskPct,
  stopPips,
  pipValuePerLot,
}: PositionSizeInputs): PositionSizeResult | null {
  if (
    ![balance, riskPct, stopPips, pipValuePerLot].every(
      (n) => Number.isFinite(n) && n > 0,
    )
  ) {
    return null;
  }
  const riskAmount = balance * (riskPct / 100);
  const lossPerLot = stopPips * pipValuePerLot;
  const rawLots = riskAmount / lossPerLot;
  const lots = Math.floor(rawLots * 100) / 100;
  return { riskAmount, rawLots, lots };
}

export function PositionSizeCalculator({
  accountBalance,
}: {
  /** Prefills the balance field; the user can still override it. */
  accountBalance?: number;
}) {
  const [expanded, setExpanded] = React.useState(true);
  const [balance, setBalance] = React.useState("");
  const [riskPct, setRiskPct] = React.useState("1");
  const [stopPips, setStopPips] = React.useState("");
  const [pipValue, setPipValue] = React.useState("10");

  React.useEffect(() => {
    if (accountBalance != null) setBalance(accountBalance.toFixed(2));
  }, [accountBalance]);

  const result = calculateLotSize({
    balance: Number(balance),
    riskPct: Number(riskPct),
    stopPips: Number(stopPips),
    pipValuePerLot: Number(pipValue),
  });
  const riskyRisk = Number(riskPct) > 2;

  return (
    <div className="rounded-2xl border border-border/60 bg-accent/40 p-4">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between gap-2 text-left"
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Calculator className="size-4 text-primary" />
          Position size calculator
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform",
            expanded && "rotate-180",
          )}
        />
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="calc-balance" className="text-xs">
                Account balance ($)
              </Label>
              <Input
                id="calc-balance"
                type="number"
                step="any"
                min="0"
                placeholder="10000"
                className="h-8 rounded-lg bg-background"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="calc-risk" className="text-xs">
                Risk (%)
              </Label>
              <Input
                id="calc-risk"
                type="number"
                step="any"
                min="0"
                placeholder="1"
                className="h-8 rounded-lg bg-background"
                value={riskPct}
                onChange={(e) => setRiskPct(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="calc-stop" className="text-xs">
                Stop loss (pips/points)
              </Label>
              <Input
                id="calc-stop"
                type="number"
                step="any"
                min="0"
                placeholder="25"
                className="h-8 rounded-lg bg-background"
                value={stopPips}
                onChange={(e) => setStopPips(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="calc-pip" className="text-xs">
                Pip value ($ / lot)
              </Label>
              <Input
                id="calc-pip"
                type="number"
                step="any"
                min="0"
                className="h-8 rounded-lg bg-background"
                value={pipValue}
                onChange={(e) => setPipValue(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-xl bg-background/80 px-4 py-3">
            {result ? (
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Risking {currency.format(result.riskAmount)} ({riskPct}%)
                  </p>
                  {riskyRisk && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                      <TriangleAlert className="size-3" />
                      Above the usual 1–2% per trade
                    </p>
                  )}
                </div>
                <p className="text-right">
                  <span className="text-2xl font-semibold tabular-nums tracking-tight text-primary">
                    {result.lots.toFixed(2)}
                  </span>{" "}
                  <span className="text-sm text-muted-foreground">lots</span>
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Fill in balance, risk % and stop loss to size the position.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

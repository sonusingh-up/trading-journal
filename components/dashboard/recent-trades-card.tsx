"use client";

import * as React from "react";
import { ImageIcon, NotebookPen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/empty-state";
import { signedCurrency, pnlTone } from "@/lib/format";
import { cn } from "@/lib/utils";

export type RecentTradeRow = {
  id: string;
  pair: string;
  side: string;
  /** null = position still open */
  net_pnl: number | null;
  dateLabel: string;
  account_name: string;
  screenshot_url: string | null;
};

const ICON_STYLES = [
  "bg-blue-500/10 text-blue-600",
  "bg-emerald-500/10 text-emerald-600",
  "bg-amber-500/10 text-amber-600",
  "bg-violet-500/10 text-violet-600",
  "bg-rose-500/10 text-rose-600",
  "bg-cyan-500/10 text-cyan-600",
];

// Stable per-pair tile color: same pair, same color, every render.
const iconStyle = (pair: string) => {
  let hash = 0;
  for (const ch of pair) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  return ICON_STYLES[hash % ICON_STYLES.length];
};

const TABS = ["All", "Wins", "Losses"] as const;
type Tab = (typeof TABS)[number];

export function RecentTradesCard({ trades }: { trades: RecentTradeRow[] }) {
  const [tab, setTab] = React.useState<Tab>("All");
  const [preview, setPreview] = React.useState<{
    url: string;
    pair: string;
  } | null>(null);

  const filtered = trades.filter((t) =>
    tab === "All"
      ? true
      : tab === "Wins"
        ? (t.net_pnl ?? 0) > 0
        : (t.net_pnl ?? 0) < 0,
  );

  return (
    <Card className="py-5">
      <CardContent className="px-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-[15px] font-bold">Recent Trades</p>
          <div className="flex gap-1 rounded-full bg-secondary p-[3px]">
            {TABS.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => setTab(label)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-bold transition-all",
                  tab === label
                    ? "bg-card text-foreground shadow-[0_3px_8px_rgba(15,23,42,0.08)]"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {trades.length === 0 ? (
          <EmptyState
            icon={NotebookPen}
            title="No trades logged yet"
            description="Record your first position with the New trade button above."
            className="border-none bg-transparent py-8"
          />
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm font-medium text-muted-foreground">
            No {tab.toLowerCase()} yet.
          </p>
        ) : (
          <div className="flex flex-col">
            {filtered.map((trade) => {
              const isOpen = trade.net_pnl == null;
              const isBuy = trade.side === "BUY";
              return (
                <div
                  key={trade.id}
                  className="flex items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-accent/50"
                >
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-[14px] text-xs font-extrabold",
                      iconStyle(trade.pair),
                    )}
                  >
                    {trade.pair.slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold">{trade.pair}</p>
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide uppercase",
                          isBuy
                            ? "bg-success/10 text-success"
                            : "bg-destructive/10 text-destructive",
                        )}
                      >
                        {isBuy ? "Long" : "Short"}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11.5px] font-semibold text-muted-foreground">
                      {trade.account_name} · {trade.dateLabel}
                    </p>
                  </div>
                  {trade.screenshot_url && (
                    <button
                      type="button"
                      onClick={() =>
                        setPreview({
                          url: trade.screenshot_url!,
                          pair: trade.pair,
                        })
                      }
                      className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      title="View chart screenshot"
                    >
                      <ImageIcon className="size-4" />
                      <span className="sr-only">
                        View {trade.pair} screenshot
                      </span>
                    </button>
                  )}
                  <div className="shrink-0 text-right">
                    <p
                      className={cn(
                        "text-sm font-extrabold",
                        isOpen ? "text-muted-foreground" : pnlTone(trade.net_pnl),
                      )}
                    >
                      {isOpen ? "—" : signedCurrency(trade.net_pnl!)}
                    </p>
                    <p
                      className={cn(
                        "text-[11px] font-bold opacity-75",
                        isOpen
                          ? "text-muted-foreground"
                          : pnlTone(trade.net_pnl),
                      )}
                    >
                      {isOpen
                        ? "Open"
                        : (trade.net_pnl ?? 0) > 0
                          ? "Win"
                          : "Loss"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Dialog
          open={preview != null}
          onOpenChange={(open) => !open && setPreview(null)}
        >
          <DialogContent className="rounded-2xl p-3 sm:max-w-2xl">
            <DialogTitle className="px-1 pt-1 text-sm font-bold">
              {preview?.pair} — chart screenshot
            </DialogTitle>
            {preview && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={preview.url}
                alt={`${preview.pair} chart screenshot`}
                className="max-h-[70vh] w-full rounded-xl object-contain"
              />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

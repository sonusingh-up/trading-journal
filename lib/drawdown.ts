import type { Account, Trade } from "@/lib/generated/prisma/client";

export type DrawdownLevel = "ok" | "warning" | "breached";

export type DrawdownStatus = {
  account_name: string;
  max_daily_drawdown: number;
  /** Net P&L booked today (closed trades only). */
  today_net_pnl: number;
  /** How much of today's net result counts against the limit (0 when the day is green). */
  today_loss: number;
  /** today_loss as a percentage of the limit. */
  used_pct: number;
  /** Loss room left before the limit is hit. */
  remaining: number;
  level: DrawdownLevel;
};

/** Warn once today's losses consume this share of the daily limit. */
export const DRAWDOWN_WARNING_THRESHOLD = 0.7;

type AccountLike = Pick<Account, "account_name" | "max_daily_drawdown">;
type TradeLike = Pick<Trade, "account_name" | "net_pnl" | "date">;

/**
 * Daily drawdown is measured on the day's *net* booked P&L (prop-firm style:
 * wins earlier in the day buy back loss room), using the server's local day.
 */
export function computeDailyDrawdown(
  account: AccountLike,
  trades: TradeLike[],
): DrawdownStatus {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todayNet = trades
    .filter(
      (t) =>
        t.account_name === account.account_name &&
        t.net_pnl != null &&
        t.date >= startOfDay,
    )
    .reduce((sum, t) => sum + (t.net_pnl ?? 0), 0);

  const limit = account.max_daily_drawdown;
  const todayLoss = Math.max(0, -todayNet);
  const usedPct = limit > 0 ? (todayLoss / limit) * 100 : 0;
  const level: DrawdownLevel =
    usedPct >= 100
      ? "breached"
      : usedPct >= DRAWDOWN_WARNING_THRESHOLD * 100
        ? "warning"
        : "ok";

  return {
    account_name: account.account_name,
    max_daily_drawdown: limit,
    today_net_pnl: todayNet,
    today_loss: todayLoss,
    used_pct: usedPct,
    remaining: Math.max(0, limit - todayLoss),
    level,
  };
}

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const DEMO_EMAIL = "demo@tradejournal.local";
const DEMO_PASSWORD = "demo1234";

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

// Monthly income per stream, Feb–Jul 2026 (day of month varies by source).
const INCOME_SEED: { source: string; day: number; months: [string, number][] }[] = [
  {
    source: "Affiliate Revenue",
    day: 28,
    months: [
      ["2026-02", 850],
      ["2026-03", 920],
      ["2026-04", 1180],
      ["2026-05", 1050],
      ["2026-06", 1310],
      ["2026-07", 1480],
    ],
  },
  {
    source: "PR Retainers",
    day: 5,
    months: [
      ["2026-02", 2500],
      ["2026-03", 2500],
      ["2026-04", 2500],
      ["2026-05", 3000],
      ["2026-06", 3000],
      ["2026-07", 3000],
    ],
  },
  {
    source: "Prop Firm Payouts",
    day: 17,
    months: [
      ["2026-03", 1840],
      ["2026-05", 2620],
      ["2026-06", 940],
      ["2026-07", 2210],
    ],
  },
];

// Keep demo entries in the past: pull future-dated ones back to yesterday.
function clampToNow(date: Date) {
  const now = new Date();
  if (date <= now) return date;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  yesterday.setHours(9, 0, 0, 0);
  return yesterday;
}

async function main() {
  await prisma.trade.deleteMany();
  await prisma.incomeStream.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      email: DEMO_EMAIL,
      username: "Demo Trader",
      password_hash: await bcrypt.hash(DEMO_PASSWORD, 10),
    },
  });
  const user_id = user.id;

  await prisma.account.createMany({
    data: [
      {
        user_id,
        account_name: "FTMO 100K",
        starting_balance: 100_000,
        // starting + closed P&L below (+420.50 - 310.25 + 884.00)
        current_balance: 100_994.25,
        target_profit: 10_000,
        max_daily_drawdown: 5_000,
      },
      {
        user_id,
        account_name: "Personal",
        starting_balance: 25_000,
        // starting + closed P&L below (+150.75 - 95.30 + 210.40 + 100.00)
        current_balance: 25_365.85,
        target_profit: 2_500,
        max_daily_drawdown: 1_250,
      },
      {
        user_id,
        account_name: "Funded Next 50K",
        starting_balance: 50_000,
        current_balance: 50_000,
        target_profit: 4_000,
        max_daily_drawdown: 2_500,
      },
    ],
  });

  await prisma.trade.createMany({
    data: [
      {
        user_id,
        pair: "EURUSD",
        side: "BUY",
        entry_price: 1.0842,
        exit_price: 1.0884,
        net_pnl: 420.5,
        date: daysAgo(9),
        account_name: "FTMO 100K",
      },
      {
        user_id,
        pair: "GBPJPY",
        side: "SELL",
        entry_price: 193.42,
        exit_price: 193.73,
        net_pnl: -310.25,
        date: daysAgo(7),
        account_name: "FTMO 100K",
      },
      {
        user_id,
        pair: "XAUUSD",
        side: "BUY",
        entry_price: 2382.4,
        exit_price: 2391.2,
        net_pnl: 884.0,
        date: daysAgo(4),
        account_name: "FTMO 100K",
      },
      {
        user_id,
        pair: "EURUSD",
        side: "SELL",
        entry_price: 1.0901,
        exit_price: 1.0886,
        net_pnl: 150.75,
        date: daysAgo(5),
        account_name: "Personal",
      },
      {
        user_id,
        pair: "BTCUSD",
        side: "BUY",
        entry_price: 67_240,
        exit_price: 67_145,
        net_pnl: -95.3,
        date: daysAgo(2),
        account_name: "Personal",
      },
      {
        user_id,
        pair: "GBPUSD",
        side: "BUY",
        entry_price: 1.2755,
        exit_price: 1.2789,
        net_pnl: 210.4,
        date: daysAgo(3),
        account_name: "Personal",
      },
      {
        user_id,
        pair: "XAUUSD",
        side: "BUY",
        entry_price: 2388.1,
        exit_price: 2389.4,
        net_pnl: 100.0,
        date: daysAgo(2),
        account_name: "Personal",
      },
      {
        user_id,
        pair: "US30",
        side: "SELL",
        entry_price: 44_318,
        date: daysAgo(1),
        account_name: "FTMO 100K",
      },
      {
        user_id,
        pair: "NAS100",
        side: "BUY",
        entry_price: 21_054,
        date: daysAgo(0),
        account_name: "Personal",
      },
    ],
  });

  await prisma.incomeStream.createMany({
    data: INCOME_SEED.flatMap(({ source, day, months }) =>
      months.map(([month, amount]) => ({
        user_id,
        source_name: source,
        amount,
        date: clampToNow(
          new Date(`${month}-${String(day).padStart(2, "0")}T09:00:00`),
        ),
      })),
    ),
  });

  const [accounts, trades, income] = await Promise.all([
    prisma.account.count(),
    prisma.trade.count(),
    prisma.incomeStream.count(),
  ]);
  console.log(
    `Seeded user ${DEMO_EMAIL} (password: ${DEMO_PASSWORD}) with ${accounts} accounts, ${trades} trades, ${income} income entries.`,
  );
}

main().finally(() => prisma.$disconnect());

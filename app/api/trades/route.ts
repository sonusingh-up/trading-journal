import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { computeDailyDrawdown } from "@/lib/drawdown";

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Not signed in." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const account = searchParams.get("account");

  const trades = await prisma.trade.findMany({
    where: { user_id: user.id, ...(account ? { account_name: account } : {}) },
    orderBy: { date: "desc" },
  });
  return Response.json(trades);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { pair, side, entry_price, exit_price, net_pnl, date, account_name, screenshot_url } = body;

  if (typeof pair !== "string" || pair.trim() === "") {
    return Response.json(
      { error: "pair is required and must be a non-empty string." },
      { status: 400 },
    );
  }
  const normalizedSide = typeof side === "string" ? side.toUpperCase() : "";
  if (normalizedSide !== "BUY" && normalizedSide !== "SELL") {
    return Response.json(
      { error: 'side is required and must be "BUY" or "SELL".' },
      { status: 400 },
    );
  }
  if (!isFiniteNumber(entry_price)) {
    return Response.json(
      { error: "entry_price is required and must be a number." },
      { status: 400 },
    );
  }
  if (exit_price !== undefined && exit_price !== null && !isFiniteNumber(exit_price)) {
    return Response.json(
      { error: "exit_price must be a number when provided." },
      { status: 400 },
    );
  }
  if (net_pnl !== undefined && net_pnl !== null && !isFiniteNumber(net_pnl)) {
    return Response.json(
      { error: "net_pnl must be a number when provided." },
      { status: 400 },
    );
  }
  let tradeDate: Date | undefined;
  if (date !== undefined && date !== null) {
    tradeDate = new Date(date as string);
    if (Number.isNaN(tradeDate.getTime())) {
      return Response.json(
        { error: "date must be a valid date string when provided." },
        { status: 400 },
      );
    }
  }
  if (typeof account_name !== "string" || account_name.trim() === "") {
    return Response.json(
      { error: "account_name is required and must be a non-empty string." },
      { status: 400 },
    );
  }
  if (
    screenshot_url !== undefined &&
    screenshot_url !== null &&
    (typeof screenshot_url !== "string" ||
      !screenshot_url.startsWith("/uploads/"))
  ) {
    return Response.json(
      { error: "screenshot_url must be a path returned by POST /api/uploads." },
      { status: 400 },
    );
  }

  const name = account_name.trim();
  const account = await prisma.account.findUnique({
    where: {
      user_id_account_name: { user_id: user.id, account_name: name },
    },
  });
  if (!account) {
    return Response.json(
      { error: `No account named "${name}" exists. Create it first via POST /api/accounts.` },
      { status: 404 },
    );
  }

  const data = {
    user_id: user.id,
    pair: pair.trim().toUpperCase(),
    side: normalizedSide,
    entry_price,
    exit_price: exit_price ?? null,
    net_pnl: net_pnl ?? null,
    screenshot_url: screenshot_url ?? null,
    ...(tradeDate ? { date: tradeDate } : {}),
    account_name: name,
  };

  // A closed trade with a P&L also moves the account's current balance.
  const trade = isFiniteNumber(net_pnl)
    ? (
        await prisma.$transaction([
          prisma.trade.create({ data }),
          prisma.account.update({
            where: {
              user_id_account_name: {
                user_id: user.id,
                account_name: name,
              },
            },
            data: { current_balance: { increment: net_pnl } },
          }),
        ])
      )[0]
    : await prisma.trade.create({ data });

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const todayTrades = await prisma.trade.findMany({
    where: {
      user_id: user.id,
      account_name: name,
      date: { gte: startOfDay },
    },
  });
  const daily_drawdown = computeDailyDrawdown(account, todayTrades);

  return Response.json({ trade, daily_drawdown }, { status: 201 });
}

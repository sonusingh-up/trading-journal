import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Not signed in." }, { status: 401 });
  }

  const accounts = await prisma.account.findMany({
    where: { user_id: user.id },
    orderBy: { created_at: "asc" },
    include: { _count: { select: { trades: true } } },
  });
  return Response.json(accounts);
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

  const { account_name, starting_balance, current_balance, target_profit, max_daily_drawdown } = body;

  if (typeof account_name !== "string" || account_name.trim() === "") {
    return Response.json(
      { error: "account_name is required and must be a non-empty string." },
      { status: 400 },
    );
  }
  if (!isFiniteNumber(starting_balance) || starting_balance < 0) {
    return Response.json(
      { error: "starting_balance is required and must be a non-negative number." },
      { status: 400 },
    );
  }
  if (!isFiniteNumber(target_profit) || !isFiniteNumber(max_daily_drawdown)) {
    return Response.json(
      { error: "target_profit and max_daily_drawdown are required and must be numbers." },
      { status: 400 },
    );
  }
  if (current_balance !== undefined && !isFiniteNumber(current_balance)) {
    return Response.json(
      { error: "current_balance must be a number when provided." },
      { status: 400 },
    );
  }

  const name = account_name.trim();
  const existing = await prisma.account.findUnique({
    where: {
      user_id_account_name: { user_id: user.id, account_name: name },
    },
  });
  if (existing) {
    return Response.json(
      { error: `An account named "${name}" already exists.` },
      { status: 409 },
    );
  }

  const account = await prisma.account.create({
    data: {
      user_id: user.id,
      account_name: name,
      starting_balance,
      current_balance: current_balance ?? starting_balance,
      target_profit,
      max_daily_drawdown,
    },
  });

  return Response.json(account, { status: 201 });
}

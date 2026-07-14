import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Not signed in." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source");

  const entries = await prisma.incomeStream.findMany({
    where: { user_id: user.id, ...(source ? { source_name: source } : {}) },
    orderBy: { date: "desc" },
  });
  return Response.json(entries);
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

  const { source_name, amount, date } = body;

  if (typeof source_name !== "string" || source_name.trim() === "") {
    return Response.json(
      { error: "source_name is required and must be a non-empty string." },
      { status: 400 },
    );
  }
  if (!isFiniteNumber(amount) || amount <= 0) {
    return Response.json(
      { error: "amount is required and must be a positive number." },
      { status: 400 },
    );
  }
  let entryDate: Date | undefined;
  if (date !== undefined && date !== null) {
    entryDate = new Date(date as string);
    if (Number.isNaN(entryDate.getTime())) {
      return Response.json(
        { error: "date must be a valid date string when provided." },
        { status: 400 },
      );
    }
  }

  const entry = await prisma.incomeStream.create({
    data: {
      user_id: user.id,
      source_name: source_name.trim(),
      amount,
      ...(entryDate ? { date: entryDate } : {}),
    },
  });

  return Response.json(entry, { status: 201 });
}

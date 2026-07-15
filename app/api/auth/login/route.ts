import { prisma } from "@/lib/prisma";
import { createSession, publicUser, verifyPassword } from "@/lib/auth";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const limited = rateLimit(`login:${clientIp(request)}`, 10, 15 * 60_000);
  if (!limited.ok) return tooManyRequests(limited.retryAfterSec);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { email, password } = body;
  if (typeof email !== "string" || typeof password !== "string") {
    return Response.json(
      { error: "email and password are required." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  // Same message for unknown email and wrong password — don't leak which.
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return Response.json(
      { error: "Incorrect email or password." },
      { status: 401 },
    );
  }

  await createSession(user.id);
  return Response.json(publicUser(user));
}

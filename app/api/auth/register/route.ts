import { prisma } from "@/lib/prisma";
import { createSession, hashPassword, publicUser } from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { email, username, password } = body;

  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return Response.json(
      { error: "A valid email is required." },
      { status: 400 },
    );
  }
  if (typeof password !== "string" || password.length < 8) {
    return Response.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }
  if (
    username !== undefined &&
    (typeof username !== "string" || username.trim().length > 60)
  ) {
    return Response.json(
      { error: "username must be a string of at most 60 characters." },
      { status: 400 },
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    return Response.json(
      { error: "An account with this email already exists — sign in instead." },
      { status: 409 },
    );
  }

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      username:
        typeof username === "string" && username.trim() !== ""
          ? username.trim()
          : normalizedEmail.split("@")[0],
      password_hash: await hashPassword(password),
    },
  });

  await createSession(user.id);
  return Response.json(publicUser(user), { status: 201 });
}

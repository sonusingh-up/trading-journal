import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { User } from "@/lib/generated/prisma/client";

const SESSION_COOKIE = "tj_session";
const SESSION_DAYS = 30;

export const hashPassword = (password: string) => bcrypt.hash(password, 10);

export const verifyPassword = (password: string, hash: string) =>
  bcrypt.compare(password, hash);

/** Creates a DB-backed session and sets the cookie. Route handlers only. */
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expires_at = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  // Opportunistic cleanup so expired sessions don't accumulate.
  await prisma.session.deleteMany({
    where: { user_id: userId, expires_at: { lt: new Date() } },
  });
  await prisma.session.create({
    data: { token, user_id: userId, expires_at },
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: expires_at,
  });
}

/** Resolves the logged-in user from the session cookie, or null. Read-only. */
export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session || session.expires_at < new Date()) return null;
  return session.user;
}

/** Deletes the session and clears the cookie. Route handlers only. */
export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
  store.delete(SESSION_COOKIE);
}

/** Public shape of a user — never expose password_hash. */
export const publicUser = (user: User) => ({
  id: user.id,
  email: user.email,
  username: user.username,
});

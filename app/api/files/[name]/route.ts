import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

// Strict "<uuid>.<ext>" shape — also rules out any path traversal.
const NAME_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp|gif)$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Not signed in." }, { status: 401 });
  }

  const { name } = await params;
  if (!NAME_RE.test(name)) {
    return Response.json({ error: "Not found." }, { status: 404 });
  }

  // Owner-only: 404 (not 403) so file existence isn't leaked to other users.
  const upload = await prisma.upload.findUnique({ where: { name } });
  if (!upload || upload.user_id !== user.id) {
    return Response.json({ error: "Not found." }, { status: 404 });
  }

  try {
    const data = await readFile(path.join(process.cwd(), "uploads", name));
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": MIME[name.split(".").pop()!],
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch {
    return Response.json({ error: "Not found." }, { status: 404 });
  }
}

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const MAX_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Not signed in." }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json(
      { error: "Expected multipart/form-data with a 'file' field." },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json(
      { error: "A 'file' field is required." },
      { status: 400 },
    );
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return Response.json(
      { error: "Unsupported file type — use PNG, JPEG, WebP or GIF." },
      { status: 400 },
    );
  }
  if (file.size > MAX_SIZE) {
    return Response.json(
      { error: "File too large — the limit is 5 MB." },
      { status: 400 },
    );
  }

  const name = `${crypto.randomUUID()}.${ext}`;
  // Private directory (gitignored, outside public/) — files are only served
  // through GET /api/files/[name], which checks session + ownership.
  const dir = path.join(process.cwd(), "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  await prisma.upload.create({ data: { name, user_id: user.id } });

  return Response.json({ url: `/api/files/${name}` }, { status: 201 });
}

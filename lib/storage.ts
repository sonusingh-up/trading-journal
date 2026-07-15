import path from "node:path";

/**
 * Where uploaded screenshots live. Defaults to ./uploads next to the app;
 * point UPLOADS_DIR at a persistent disk in production (e.g. /var/data/uploads
 * on Render) so files survive deploys and restarts.
 */
export const uploadsDir = () =>
  process.env.UPLOADS_DIR ?? path.join(process.cwd(), "uploads");

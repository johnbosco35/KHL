import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { env } from "../config/env.js";
import { badRequest } from "../utils/http-error.js";

export const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

const ALLOWED = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["image/svg+xml", "svg"],
  ["application/pdf", "pdf"],
]);
const MAX_BYTES = 8 * 1024 * 1024;

export function parseDataUrl(dataUrl: string): { mime: string; buffer: Buffer } {
  const m = /^data:([\w/+.-]+)(;base64)?,(.*)$/s.exec(dataUrl);
  if (!m) throw badRequest("File must be a data URL.");
  const mime = m[1]!.toLowerCase();
  const buffer = m[2] ? Buffer.from(m[3]!, "base64") : Buffer.from(decodeURIComponent(m[3]!), "utf8");
  return { mime, buffer };
}

/** Store raw bytes in the API's uploads folder and return a public URL. */
export async function saveFile(buffer: Buffer, mime: string, folder: string): Promise<string> {
  const ext = ALLOWED.get(mime);
  if (!ext) throw badRequest("Unsupported file type. Use JPG, PNG, WEBP, GIF, SVG or PDF.");
  if (buffer.length > MAX_BYTES) throw badRequest("File is too large (max 8 MB).");
  const name = `${folder}/${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
  const full = path.join(UPLOAD_DIR, name);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, buffer);
  return `${env.API_URL.replace(/\/$/, "")}/uploads/${name}`;
}

export async function saveDataUrl(dataUrl: string, folder: string): Promise<string> {
  const { mime, buffer } = parseDataUrl(dataUrl);
  return saveFile(buffer, mime, folder);
}

/** Uploads `value` if it is a data URL; returns other values (existing URLs) unchanged. */
export async function persistImage(value: string, folder: string): Promise<string>;
export async function persistImage(value: string | undefined | null, folder: string): Promise<string | undefined>;
export async function persistImage(value: string | undefined | null, folder: string) {
  if (!value) return undefined;
  return value.startsWith("data:") ? saveDataUrl(value, folder) : value;
}

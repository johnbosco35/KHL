import { randomBytes } from "node:crypto";

export const uid = (prefix: string) => `${prefix}-${randomBytes(4).toString("hex")}`;

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

import type { NextFunction, Request, Response } from "express";
import { isProd } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, ...(err.details ? { details: err.details } : {}) });
    return;
  }
  const e = err as { code?: number | string; type?: string; status?: number; keyValue?: unknown; message?: string };
  if (e.type === "entity.too.large") {
    res.status(413).json({ error: "Upload is too large." });
    return;
  }
  if (e.type === "entity.parse.failed") {
    res.status(400).json({ error: "Malformed JSON body." });
    return;
  }
  if (e.code === 11000) {
    res.status(409).json({ error: "A record with these details already exists.", details: e.keyValue });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Something went wrong.", ...(isProd ? {} : { message: e.message }) });
}

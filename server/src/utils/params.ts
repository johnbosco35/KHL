import type { Request } from "express";
import { badRequest } from "./http-error.js";

/** Read a required route parameter as a string. */
export function param(req: Request, name: string): string {
  const v = req.params[name];
  if (typeof v !== "string" || !v) throw badRequest(`Missing parameter: ${name}`);
  return v;
}

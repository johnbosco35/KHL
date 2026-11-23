import type { Request } from "express";
import type { z } from "zod";
import { badRequest } from "../utils/http-error.js";

/** Parse and validate the request body against a zod schema, throwing a 400 with field errors. */
export function body<S extends z.ZodType>(req: Request, schema: S): z.output<S> {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    const fields: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join(".") || "_";
      fields[key] ??= issue.message;
    }
    const first = Object.entries(fields)[0];
    throw badRequest(first ? `${first[0] === "_" ? "" : `${first[0]}: `}${first[1]}` : "Invalid request.", fields);
  }
  return result.data;
}

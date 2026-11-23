import type { NextFunction, Request, Response } from "express";
import { UserModel } from "../models/user.model.js";
import type { User } from "../models/types.js";
import { verifyToken } from "../services/token.service.js";
import { forbidden, unauthorized } from "../utils/http-error.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

async function resolveUser(req: Request): Promise<User | null> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  const payload = verifyToken(header.slice(7));
  if (!payload) return null;
  const user = await UserModel.findById(payload.sub);
  if (!user || user.status !== "active") return null;
  return user;
}

/** Attaches req.user if a valid token is present; never rejects. */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  req.user = (await resolveUser(req)) ?? undefined;
  next();
}

/** Rejects with 401 unless a valid token for an active account is present. */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const user = await resolveUser(req);
  if (!user) throw unauthorized();
  req.user = user;
  next();
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) throw unauthorized();
  if (req.user.role !== "admin") throw forbidden();
  next();
}

export function requireCustomer(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) throw unauthorized();
  if (req.user.role !== "customer") throw forbidden("Only customer accounts can do this.");
  next();
}

/** The signed-in user (call only after requireAuth). */
export function currentUser(req: Request): User {
  if (!req.user) throw unauthorized();
  return req.user;
}

export const isAdmin = (req: Request) => req.user?.role === "admin";

import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { env, isProd } from "../config/env.js";
import { currentUser } from "../middleware/auth.js";
import { body } from "../middleware/validate.js";
import { UserModel } from "../models/user.model.js";
import type { User } from "../models/types.js";
import { passwordResetMail, sendMail } from "../services/mail.service.js";
import { signToken } from "../services/token.service.js";
import { badRequest, conflict, forbidden, unauthorized } from "../utils/http-error.js";
import { uid } from "../utils/ids.js";
import { authSchemas } from "../validators/schemas.js";

const session = (user: User) => ({ user, token: signToken({ sub: user.id, role: user.role }) });
export const hashPassword = (pw: string) => bcrypt.hash(pw, 12);

export const AuthController = {
  async register(req: Request, res: Response) {
    const data = body(req, authSchemas.register);
    if (await UserModel.findByEmailWithHash(data.email)) throw conflict("An account with this email already exists.");
    const user = await UserModel.create({
      id: uid("cus"),
      name: data.name,
      email: data.email,
      phone: data.phone,
      passwordHash: await hashPassword(data.password),
      role: "customer",
    });
    res.status(201).json(session(user));
  },

  async login(req: Request, res: Response) {
    const { email, password, role } = body(req, authSchemas.login);
    const found = await UserModel.findByEmailWithHash(email);
    if (!found || !(await bcrypt.compare(password, found.passwordHash)))
      throw unauthorized("Incorrect email or password.");
    if (found.role !== role)
      throw forbidden(
        role === "admin"
          ? "This account does not have admin access."
          : "Admin accounts must sign in through the admin portal.",
      );
    if (found.status !== "active") throw forbidden("This account is suspended.");
    const { passwordHash: _omit, ...user } = found;
    res.json(session(user));
  },

  async me(req: Request, res: Response) {
    res.json({ user: currentUser(req) });
  },

  async updateMe(req: Request, res: Response) {
    const me = currentUser(req);
    const patch = body(req, authSchemas.updateProfile);
    if (patch.email && patch.email !== me.email) {
      const other = await UserModel.findByEmailWithHash(patch.email);
      if (other && other.id !== me.id) throw conflict("An account with this email already exists.");
    }
    const user = await UserModel.update(me.id, patch);
    res.json({ user });
  },

  async changePassword(req: Request, res: Response) {
    const me = currentUser(req);
    const { currentPassword, newPassword } = body(req, authSchemas.changePassword);
    const hash = await UserModel.getPasswordHash(me.id);
    if (!hash || !(await bcrypt.compare(currentPassword, hash))) throw badRequest("Current password is incorrect.");
    await UserModel.setPassword(me.id, await hashPassword(newPassword));
    res.json({ ok: true });
  },

  /** Always answers the same way so the endpoint can't be used to discover accounts. */
  async forgotPassword(req: Request, res: Response) {
    const { email, role } = body(req, authSchemas.forgotPassword);
    const user = await UserModel.findByEmailWithHash(email);
    let devResetUrl: string | undefined;
    if (user && user.role === role && user.status === "active") {
      const token = await UserModel.createResetToken(user.id);
      const base = env.APP_URL.replace(/\/$/, "");
      const url = `${base}/reset-password?token=${token}${role === "admin" ? "&admin=1" : ""}`;
      await sendMail(passwordResetMail(user.email, user.name, url));
      if (!isProd) devResetUrl = url;
    }
    res.json({
      ok: true,
      message: "If an account exists for that email, a reset link is on its way.",
      ...(devResetUrl ? { devResetUrl } : {}),
    });
  },

  async resetPassword(req: Request, res: Response) {
    const { token, password } = body(req, authSchemas.resetPassword);
    const userId = await UserModel.consumeResetToken(token);
    if (!userId) throw badRequest("This reset link is invalid or has expired.");
    await UserModel.setPassword(userId, await hashPassword(password));
    const user = await UserModel.findById(userId);
    if (!user || user.status !== "active") throw forbidden("This account is suspended.");
    res.json(session(user));
  },
};

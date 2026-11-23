import { createHash, randomBytes } from "node:crypto";
import type { Document } from "mongodb";
import { collection, type Db } from "../config/db.js";
import { iso, type Role, type User, type UserStatus } from "./types.js";

type UserDoc = Document & {
  id: string; name: string; email: string; phone: string; passwordHash: string;
  role: Role; status: UserStatus; createdAt: Date;
};
type ResetDoc = Document & { tokenHash: string; userId: string; expiresAt: Date; usedAt?: Date };
const users = () => collection<UserDoc>("users");
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const toUser = (u: UserDoc): User => ({
  id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role,
  status: u.status, createdAt: iso(u.createdAt),
});

export const UserModel = {
  async findById(id: string): Promise<User | null> {
    const u = await users().findOne({ id });
    return u ? toUser(u) : null;
  },
  async findByEmailWithHash(email: string): Promise<(User & { passwordHash: string }) | null> {
    const u = await users().findOne({ email: email.toLowerCase() });
    return u ? { ...toUser(u), passwordHash: u.passwordHash } : null;
  },
  async getPasswordHash(id: string): Promise<string | null> {
    const u = await users().findOne({ id }, { projection: { passwordHash: 1 } });
    return u?.passwordHash ?? null;
  },
  async list(): Promise<User[]> {
    return (await users().find().sort({ createdAt: -1 }).toArray()).map(toUser);
  },
  async create(
    u: { id: string; name: string; email: string; phone: string; passwordHash: string; role: Role },
    _db?: Db,
  ): Promise<User> {
    const doc: UserDoc = { id: u.id, name: u.name, email: u.email.toLowerCase(), phone: u.phone,
      passwordHash: u.passwordHash, role: u.role, status: "active", createdAt: new Date() };
    await users().insertOne(doc);
    return toUser(doc);
  },
  async update(id: string, patch: Partial<Pick<User, "name" | "email" | "phone">>): Promise<User | null> {
    const update: Partial<UserDoc> = {};
    if (patch.name !== undefined) update.name = patch.name;
    if (patch.email !== undefined) update.email = patch.email.toLowerCase();
    if (patch.phone !== undefined) update.phone = patch.phone;
    const u = await users().findOneAndUpdate({ id }, { $set: update }, { returnDocument: "after" });
    return u ? toUser(u) : null;
  },
  async setPassword(id: string, passwordHash: string): Promise<void> {
    await users().updateOne({ id }, { $set: { passwordHash } });
  },
  async setStatus(id: string, status: UserStatus): Promise<User | null> {
    const u = await users().findOneAndUpdate({ id }, { $set: { status } }, { returnDocument: "after" });
    return u ? toUser(u) : null;
  },
  async createResetToken(userId: string): Promise<string> {
    const token = randomBytes(32).toString("hex");
    await collection<ResetDoc>("password_resets").insertOne({
      tokenHash: hashToken(token), userId, expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    return token;
  },
  async consumeResetToken(token: string): Promise<string | null> {
    const reset = await collection<ResetDoc>("password_resets").findOneAndUpdate(
      { tokenHash: hashToken(token), usedAt: { $exists: false }, expiresAt: { $gt: new Date() } },
      { $set: { usedAt: new Date() } },
    );
    return reset?.userId ?? null;
  },
};

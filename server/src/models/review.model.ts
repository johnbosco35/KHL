import type { Document } from "mongodb";
import { collection } from "../config/db.js";
import { iso, type Review, type ReviewStatus } from "./types.js";

type ReviewDoc = Document & Omit<Review, "author" | "date"> & { createdAt: Date };
type UserNameDoc = Document & { id: string; name: string };
const reviews = () => collection<ReviewDoc>("reviews");
const toReview = (r: ReviewDoc, author?: string): Review => ({
  id: r.id, productId: r.productId, customerId: r.customerId, author: author ?? "KH client",
  rating: r.rating, text: r.text, date: iso(r.createdAt), status: r.status, ...(r.image ? { image: r.image } : {}),
});

async function withAuthors(rows: ReviewDoc[]): Promise<Review[]> {
  const ids = [...new Set(rows.map((r) => r.customerId))];
  const users = await collection<UserNameDoc>("users").find({ id: { $in: ids } }, { projection: { id: 1, name: 1 } }).toArray();
  const names = new Map(users.map((u) => [u.id, u.name]));
  return rows.map((r) => toReview(r, names.get(r.customerId)));
}

export const ReviewModel = {
  async list(f: { productId?: string; customerId?: string; status?: ReviewStatus } = {}): Promise<Review[]> {
    const filter: Record<string, string> = {};
    if (f.productId) filter.productId = f.productId;
    if (f.customerId) filter.customerId = f.customerId;
    if (f.status) filter.status = f.status;
    return withAuthors(await reviews().find(filter).sort({ createdAt: -1 }).toArray());
  },
  async create(r: {
    id: string; productId: string; customerId: string; rating: number; text: string;
    image?: string; status?: ReviewStatus; createdAt?: string;
  }): Promise<Review> {
    const doc: ReviewDoc = {
      id: r.id, productId: r.productId, customerId: r.customerId, rating: r.rating, text: r.text,
      ...(r.image ? { image: r.image } : {}), status: r.status ?? "pending",
      createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
    };
    await reviews().insertOne(doc);
    return (await this.findById(r.id))!;
  },
  async findById(id: string): Promise<Review | null> {
    const r = await reviews().findOne({ id });
    return r ? (await withAuthors([r]))[0]! : null;
  },
  async setStatus(id: string, status: ReviewStatus): Promise<Review | null> {
    const result = await reviews().updateOne({ id }, { $set: { status } });
    return result.matchedCount ? this.findById(id) : null;
  },
  async delete(id: string): Promise<boolean> {
    const result = await reviews().deleteOne({ id });
    return result.deletedCount > 0;
  },
  async summary(): Promise<Record<string, { average: number; count: number }>> {
    const rows = await reviews().aggregate<{ _id: string; average: number; count: number }>([
      { $match: { status: "approved" } },
      { $group: { _id: "$productId", average: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]).toArray();
    return Object.fromEntries(rows.map((r) => [r._id, { average: Math.round(r.average * 10) / 10, count: r.count }]));
  },
};

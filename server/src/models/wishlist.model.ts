import type { Document } from "mongodb";
import { collection } from "../config/db.js";

type WishlistDoc = Document & { userId: string; productId: string; createdAt: Date };
const wishlist = () => collection<WishlistDoc>("wishlist_items");
export const WishlistModel = {
  /** Product ids in the order they were saved. */
  async list(userId: string): Promise<string[]> {
    return (await wishlist().find({ userId }).sort({ createdAt: 1 }).toArray()).map((r) => r.productId);
  },
  async add(userId: string, productId: string): Promise<void> {
    await wishlist().updateOne(
      { userId, productId }, { $setOnInsert: { createdAt: new Date() } }, { upsert: true },
    );
  },
  async remove(userId: string, productId: string): Promise<void> {
    await wishlist().deleteOne({ userId, productId });
  },
};

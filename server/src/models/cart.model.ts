import type { Document } from "mongodb";
import { collection, type Db } from "../config/db.js";
import { ProductModel } from "./product.model.js";
import type { CartItem, Customization } from "./types.js";

type CartDoc = Document & {
  userId: string; key: string; productId: string; size: string; color: string;
  quantity: number; customization?: Customization; createdAt: Date;
};
const cartItems = () => collection<CartDoc>("cart_items");

export const CartModel = {
  async list(userId: string, db?: Db): Promise<CartItem[]> {
    const docs = await cartItems().find({ userId }, db ? { session: db } : {}).sort({ createdAt: 1 }).toArray();
    const items = await Promise.all(docs.map(async (doc) => {
      const product = await ProductModel.findById(doc.productId, db);
      return product ? {
        key: doc.key, product, quantity: doc.quantity, size: doc.size, color: doc.color,
        ...(doc.customization ? { customization: doc.customization } : {}),
      } : null;
    }));
    return items.filter((item): item is CartItem => item !== null);
  },
  async add(
    userId: string,
    item: { key: string; productId: string; size: string; color: string; quantity: number; customization?: Customization },
  ): Promise<void> {
    const filter = { userId, key: item.key };
    const updated = await cartItems().updateOne(filter, { $inc: { quantity: item.quantity } });
    if (updated.matchedCount) return;
    try {
      await cartItems().insertOne({ ...item, userId, createdAt: new Date() });
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) throw error;
      await cartItems().updateOne(filter, { $inc: { quantity: item.quantity } });
    }
  },
  async setQuantity(userId: string, key: string, quantity: number): Promise<boolean> {
    const result = await cartItems().updateOne({ userId, key }, { $set: { quantity } });
    return result.matchedCount > 0;
  },
  async remove(userId: string, key: string): Promise<boolean> {
    const result = await cartItems().deleteOne({ userId, key });
    return result.deletedCount > 0;
  },
  async clear(userId: string, db?: Db): Promise<void> {
    await cartItems().deleteMany({ userId }, db ? { session: db } : {});
  },
};

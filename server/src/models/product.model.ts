import type { Document } from "mongodb";
import { collection, type Db } from "../config/db.js";
import { iso, type Product, type ProductStatus } from "./types.js";

type ProductDoc = Document & Omit<Product, "createdAt"> & { createdAt: Date };
export type ProductInput = Omit<Product, "createdAt">;
export type ProductFilter = {
  status?: ProductStatus | "all"; category?: string; featured?: boolean;
  newArrival?: boolean; customizable?: boolean; search?: string;
};
const products = () => collection<ProductDoc>("products");
const toProduct = (p: ProductDoc): Product => ({
  id: p.id, sku: p.sku, name: p.name, category: p.category, price: p.price, image: p.image,
  images: p.images, colors: p.colors, sizes: p.sizes, stock: p.stock, featured: p.featured,
  newArrival: p.newArrival, customizable: p.customizable, status: p.status,
  specifications: p.specifications, description: p.description, createdAt: iso(p.createdAt),
});

export const ProductModel = {
  async list(f: ProductFilter = {}): Promise<Product[]> {
    const filter: Record<string, unknown> = {};
    if (f.status && f.status !== "all") filter.status = f.status;
    if (f.category) filter.category = { $regex: `^${escapeRegex(f.category)}$`, $options: "i" };
    if (f.featured !== undefined) filter.featured = f.featured;
    if (f.newArrival !== undefined) filter.newArrival = f.newArrival;
    if (f.customizable !== undefined) filter.customizable = f.customizable;
    if (f.search) {
      const regex = new RegExp(escapeRegex(f.search), "i");
      filter.$or = [{ name: regex }, { category: regex }, { sku: regex }];
    }
    return (await products().find(filter).sort({ createdAt: -1, name: 1 }).toArray()).map(toProduct);
  },
  async findById(id: string, db?: Db): Promise<Product | null> {
    const p = await products().findOne({ id }, db ? { session: db } : {});
    return p ? toProduct(p) : null;
  },
  async findManyForUpdate(ids: string[], db: Db): Promise<Map<string, Product>> {
    const found = await products().find({ id: { $in: ids } }, { session: db }).toArray();
    return new Map(found.map((p) => [p.id, toProduct(p)]));
  },
  async create(p: ProductInput): Promise<Product> {
    const doc: ProductDoc = { ...p, createdAt: new Date() };
    await products().insertOne(doc);
    return toProduct(doc);
  },
  async update(id: string, p: Omit<ProductInput, "id">): Promise<Product | null> {
    const updated = await products().findOneAndUpdate({ id }, { $set: p }, { returnDocument: "after" });
    return updated ? toProduct(updated) : null;
  },
  async decrementStock(id: string, qty: number, db: Db): Promise<void> {
    await products().updateOne({ id }, { $inc: { stock: -qty } }, { session: db });
  },
  async delete(id: string): Promise<boolean> {
    const result = await products().deleteOne({ id });
    return result.deletedCount > 0;
  },
  async renameCategory(from: string, to: string, db?: Db): Promise<void> {
    await products().updateMany({ category: from }, { $set: { category: to } }, db ? { session: db } : {});
  },
  async countInCategory(name: string): Promise<number> {
    return products().countDocuments({ category: name });
  },
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

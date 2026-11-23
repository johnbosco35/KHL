import type { Document } from "mongodb";
import { collection } from "../config/db.js";
import { ProductModel } from "./product.model.js";
import type { Category } from "./types.js";

type CategoryDoc = Document & Category;
const categories = () => collection<CategoryDoc>("categories");
const toCategory = (c: CategoryDoc): Category => ({
  id: c.id, name: c.name, description: c.description, ...(c.image ? { image: c.image } : {}), active: c.active,
});

export const CategoryModel = {
  async list(onlyActive = false): Promise<Category[]> {
    return (await categories().find(onlyActive ? { active: true } : {}).sort({ name: 1 }).toArray()).map(toCategory);
  },
  async findById(id: string): Promise<Category | null> {
    const c = await categories().findOne({ id });
    return c ? toCategory(c) : null;
  },
  async create(c: Category): Promise<Category> {
    const doc: CategoryDoc = { ...c };
    await categories().insertOne(doc);
    return toCategory(doc);
  },
  async update(id: string, c: Omit<Category, "id">): Promise<Category | null> {
    const old = await categories().findOne({ id });
    if (!old) return null;
    const updated = await categories().findOneAndUpdate({ id }, { $set: c }, { returnDocument: "after" });
    if (old.name !== c.name) await ProductModel.renameCategory(old.name, c.name);
    return updated ? toCategory(updated) : null;
  },
  async delete(id: string): Promise<boolean> {
    const result = await categories().deleteOne({ id });
    return result.deletedCount > 0;
  },
};

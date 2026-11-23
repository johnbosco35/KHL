import type { Request, Response } from "express";
import { isAdmin } from "../middleware/auth.js";
import { body } from "../middleware/validate.js";
import { CategoryModel } from "../models/category.model.js";
import { LocationModel } from "../models/location.model.js";
import { ProductModel, type ProductFilter } from "../models/product.model.js";
import { ReviewModel } from "../models/review.model.js";
import type { ProductStatus } from "../models/types.js";
import { persistImage } from "../services/storage.service.js";
import { badRequest, conflict, notFound } from "../utils/http-error.js";
import { slugify, uid } from "../utils/ids.js";
import { param } from "../utils/params.js";
import { categorySchema, locationSchema, productSchema } from "../validators/schemas.js";

const flag = (v: unknown) => (v === "true" || v === "1" ? true : v === "false" || v === "0" ? false : undefined);
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);

async function productInput(req: Request) {
  const data = body(req, productSchema);
  const images = await Promise.all(data.images.map((i) => persistImage(i, "products")));
  const image = (await persistImage(data.image, "products")) ?? images[0];
  if (!image) throw badRequest("Upload at least one image", { images: "Upload at least one image" });
  if (!images.includes(image)) images.unshift(image);
  if (!(await CategoryModel.list()).some((c) => c.name === data.category))
    throw badRequest("Choose an existing category", { category: "Choose an existing category" });
  return { ...data, image, images: images.slice(0, 6) };
}

export const ProductController = {
  /** Public: active products only. Admins may pass ?status=all|draft|archived. */
  async list(req: Request, res: Response) {
    const requested = str(req.query.status) as ProductStatus | "all" | undefined;
    const filter: ProductFilter = {
      status: isAdmin(req) ? (requested ?? "all") : "active",
      category: str(req.query.category),
      featured: flag(req.query.featured),
      newArrival: flag(req.query.newArrival),
      customizable: flag(req.query.customizable),
      search: str(req.query.q),
    };
    const [products, ratings] = await Promise.all([ProductModel.list(filter), ReviewModel.summary()]);
    res.json({ products, ratings });
  },

  async get(req: Request, res: Response) {
    const product = await ProductModel.findById(param(req, "id"));
    if (!product || (product.status !== "active" && !isAdmin(req))) throw notFound("Product not found.");
    const reviews = await ReviewModel.list({ productId: product.id, status: "approved" });
    res.json({ product, reviews });
  },

  async create(req: Request, res: Response) {
    const data = await productInput(req);
    const id = data.id ? slugify(data.id) : slugify(data.name);
    if (!id) throw badRequest("Enter a product name");
    if (await ProductModel.findById(id)) throw conflict("A product with this name already exists. Choose a different name.");
    const sku = data.sku || `KH-${id.slice(0, 3).toUpperCase()}-${data.price}`;
    const product = await ProductModel.create({ ...data, id, sku });
    res.status(201).json({ product });
  },

  async update(req: Request, res: Response) {
    const id = param(req, "id");
    const existing = await ProductModel.findById(id);
    if (!existing) throw notFound("Product not found.");
    const data = await productInput(req);
    const product = await ProductModel.update(id, { ...data, sku: data.sku || existing.sku });
    res.json({ product });
  },

  async remove(req: Request, res: Response) {
    if (!(await ProductModel.delete(param(req, "id")))) throw notFound("Product not found.");
    res.status(204).end();
  },
};

export const CategoryController = {
  async list(req: Request, res: Response) {
    res.json({ categories: await CategoryModel.list(!isAdmin(req)) });
  },

  async create(req: Request, res: Response) {
    const { image: rawImage, id: rawId, ...data } = body(req, categorySchema);
    const id = slugify(rawId ?? data.name) || uid("cat");
    const image = await persistImage(rawImage, "categories");
    const category = await CategoryModel.create({ ...data, id, ...(image ? { image } : {}) });
    res.status(201).json({ category });
  },

  async update(req: Request, res: Response) {
    const { image: rawImage, id: _id, ...data } = body(req, categorySchema);
    const image = await persistImage(rawImage, "categories");
    const category = await CategoryModel.update(param(req, "id"), { ...data, ...(image ? { image } : {}) });
    if (!category) throw notFound("Category not found.");
    res.json({ category });
  },

  async remove(req: Request, res: Response) {
    const id = param(req, "id");
    const category = await CategoryModel.findById(id);
    if (!category) throw notFound("Category not found.");
    const inUse = await ProductModel.countInCategory(category.name);
    if (inUse > 0)
      throw conflict(`${inUse} product${inUse === 1 ? " is" : "s are"} still in this category. Move or delete them first.`);
    await CategoryModel.delete(id);
    res.status(204).end();
  },
};

export const LocationController = {
  async list(req: Request, res: Response) {
    res.json({ locations: await LocationModel.list(!isAdmin(req)) });
  },

  async create(req: Request, res: Response) {
    const data = body(req, locationSchema);
    const location = await LocationModel.create({ ...data, id: data.id ? slugify(data.id) : uid("loc") });
    res.status(201).json({ location });
  },

  async update(req: Request, res: Response) {
    const data = body(req, locationSchema);
    const location = await LocationModel.update(param(req, "id"), data);
    if (!location) throw notFound("Delivery location not found.");
    res.json({ location });
  },

  async remove(req: Request, res: Response) {
    if (!(await LocationModel.delete(param(req, "id")))) throw notFound("Delivery location not found.");
    res.status(204).end();
  },
};

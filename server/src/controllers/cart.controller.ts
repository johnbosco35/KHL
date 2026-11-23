import type { Request, Response } from "express";
import { currentUser } from "../middleware/auth.js";
import { body } from "../middleware/validate.js";
import { CartModel } from "../models/cart.model.js";
import { ProductModel } from "../models/product.model.js";
import { WishlistModel } from "../models/wishlist.model.js";
import { persistImage } from "../services/storage.service.js";
import { badRequest, notFound } from "../utils/http-error.js";
import { uid } from "../utils/ids.js";
import { param } from "../utils/params.js";
import { cartAddSchema, cartQuantitySchema } from "../validators/schemas.js";

const respond = async (req: Request, res: Response, status = 200) =>
  res.status(status).json({ cart: await CartModel.list(currentUser(req).id) });

export const CartController = {
  get: (req: Request, res: Response) => respond(req, res),

  async add(req: Request, res: Response) {
    const data = body(req, cartAddSchema);
    const product = await ProductModel.findById(data.productId);
    if (!product || product.status !== "active") throw notFound("This product is no longer available.");
    if (product.stock <= 0) throw badRequest(`${product.name} is sold out.`);
    const size = data.size ?? product.sizes[0] ?? "M";
    const color = data.color ?? product.colors[0] ?? "Obsidian";
    if (!product.sizes.includes(size)) throw badRequest(`Size ${size} is not available for ${product.name}.`);
    if (!product.colors.includes(color)) throw badRequest(`${color} is not available for ${product.name}.`);

    let customization = data.customization;
    if (customization) {
      if (!product.customizable) throw badRequest(`${product.name} cannot be customised.`);
      const designData = await persistImage(customization.designData, "designs");
      customization = { ...customization, ...(designData ? { designData } : {}) };
    }
    // Custom pieces are always separate lines; standard ones merge by product/size/color.
    const key = customization ? uid("custom") : `${product.id}|${size}|${color}`;
    await CartModel.add(currentUser(req).id, {
      key,
      productId: product.id,
      size,
      color,
      quantity: data.quantity,
      ...(customization ? { customization } : {}),
    });
    await respond(req, res, 201);
  },

  async setQuantity(req: Request, res: Response) {
    const { quantity } = body(req, cartQuantitySchema);
    if (!(await CartModel.setQuantity(currentUser(req).id, param(req, "key"), quantity)))
      throw notFound("Item is not in your bag.");
    await respond(req, res);
  },

  async remove(req: Request, res: Response) {
    await CartModel.remove(currentUser(req).id, param(req, "key"));
    await respond(req, res);
  },

  async clear(req: Request, res: Response) {
    await CartModel.clear(currentUser(req).id);
    await respond(req, res);
  },
};

export const WishlistController = {
  async get(req: Request, res: Response) {
    res.json({ wishlist: await WishlistModel.list(currentUser(req).id) });
  },

  async add(req: Request, res: Response) {
    const productId = param(req, "productId");
    if (!(await ProductModel.findById(productId))) throw notFound("Product not found.");
    await WishlistModel.add(currentUser(req).id, productId);
    res.json({ wishlist: await WishlistModel.list(currentUser(req).id) });
  },

  async remove(req: Request, res: Response) {
    await WishlistModel.remove(currentUser(req).id, param(req, "productId"));
    res.json({ wishlist: await WishlistModel.list(currentUser(req).id) });
  },
};

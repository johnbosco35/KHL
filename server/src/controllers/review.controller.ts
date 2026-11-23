import type { Request, Response } from "express";
import { currentUser, isAdmin } from "../middleware/auth.js";
import { body } from "../middleware/validate.js";
import { ProductModel } from "../models/product.model.js";
import { ReviewModel } from "../models/review.model.js";
import type { ReviewStatus } from "../models/types.js";
import { persistImage } from "../services/storage.service.js";
import { badRequest, notFound } from "../utils/http-error.js";
import { uid } from "../utils/ids.js";
import { param } from "../utils/params.js";
import { reviewSchema, reviewStatusSchema } from "../validators/schemas.js";

export const ReviewController = {
  /** Public: approved reviews (optionally ?productId=). Admins see every status and may filter ?status=. */
  async list(req: Request, res: Response) {
    const productId = typeof req.query.productId === "string" ? req.query.productId : undefined;
    const status = isAdmin(req)
      ? ((typeof req.query.status === "string" ? req.query.status : undefined) as ReviewStatus | undefined)
      : "approved";
    res.json({ reviews: await ReviewModel.list({ productId, status }) });
  },

  /** The signed-in customer's own reviews, any status. */
  async mine(req: Request, res: Response) {
    res.json({ reviews: await ReviewModel.list({ customerId: currentUser(req).id }) });
  },

  async create(req: Request, res: Response) {
    const me = currentUser(req);
    const data = body(req, reviewSchema);
    const product = await ProductModel.findById(data.productId);
    if (!product || product.status !== "active") throw badRequest("This product is not available for review.");
    const image = await persistImage(data.image, "reviews");
    const review = await ReviewModel.create({
      id: uid("rev"),
      productId: product.id,
      customerId: me.id,
      rating: data.rating,
      text: data.text,
      ...(image ? { image } : {}),
    });
    res.status(201).json({ review });
  },

  async setStatus(req: Request, res: Response) {
    const { status } = body(req, reviewStatusSchema);
    const review = await ReviewModel.setStatus(param(req, "id"), status);
    if (!review) throw notFound("Review not found.");
    res.json({ review });
  },

  async remove(req: Request, res: Response) {
    if (!(await ReviewModel.delete(param(req, "id")))) throw notFound("Review not found.");
    res.status(204).end();
  },
};

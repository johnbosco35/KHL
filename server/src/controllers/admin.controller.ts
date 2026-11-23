import type { Request, Response } from "express";
import { collection } from "../config/db.js";
import { body } from "../middleware/validate.js";
import { NewsletterModel } from "../models/newsletter.model.js";
import { OrderModel } from "../models/order.model.js";
import { PaymentModel } from "../models/payment.model.js";
import { ReviewModel } from "../models/review.model.js";
import { SettingsModel, settingsSchemas, type SettingsKey } from "../models/settings.model.js";
import { UserModel } from "../models/user.model.js";
import { saveDataUrl } from "../services/storage.service.js";
import { badRequest, notFound } from "../utils/http-error.js";
import { param } from "../utils/params.js";
import { customerStatusSchema, newsletterSchema, uploadSchema } from "../validators/schemas.js";

export const CustomerController = {
  /** Customers with their order count and lifetime spend (paid payments). */
  async list(_req: Request, res: Response) {
    const [orderRows, paymentRows] = await Promise.all([
      collection("orders").aggregate<{ _id: string; count: number }>([
        { $group: { _id: "$customerId", count: { $sum: 1 } } },
      ]).toArray(),
      collection("payments").aggregate<{ _id: string; total: number }>([
        { $match: { status: "paid" } },
        { $group: { _id: "$customerId", total: { $sum: "$amount" } } },
      ]).toArray(),
    ]);
    const orderCounts = new Map(orderRows.map((r) => [r._id, r.count]));
    const spending = new Map(paymentRows.map((r) => [r._id, r.total]));
    const customers = (await UserModel.list())
      .filter((u) => u.role === "customer")
      .map((u) => ({ ...u, orderCount: orderCounts.get(u.id) ?? 0, totalSpent: spending.get(u.id) ?? 0 }));
    res.json({ customers });
  },

  async get(req: Request, res: Response) {
    const customer = await UserModel.findById(param(req, "id"));
    if (!customer || customer.role !== "customer") throw notFound("Customer not found.");
    const [orders, payments, reviews] = await Promise.all([
      OrderModel.list(customer.id),
      PaymentModel.list({ customerId: customer.id }),
      ReviewModel.list({ customerId: customer.id }),
    ]);
    res.json({ customer, orders, payments, reviews });
  },

  async setStatus(req: Request, res: Response) {
    const { status } = body(req, customerStatusSchema);
    const existing = await UserModel.findById(param(req, "id"));
    if (!existing || existing.role !== "customer") throw notFound("Customer not found.");
    res.json({ customer: await UserModel.setStatus(existing.id, status) });
  },
};

export const StatsController = {
  async dashboard(_req: Request, res: Response) {
    const users = collection("users");
    const orders = collection("orders");
    const payments = collection("payments");
    const products = collection("products");
    const reviews = collection("reviews");
    const [
      revenueRows, totalOrders, openOrders, pendingPayments, customers, activeProducts, lowStock, pendingReviews,
    ] = await Promise.all([
      payments.aggregate<{ total: number }>([
        { $match: { status: "paid" } }, { $group: { _id: null, total: { $sum: "$amount" } } },
      ]).toArray(),
      orders.countDocuments(),
      orders.countDocuments({ status: { $ne: "delivered" } }),
      payments.countDocuments({ status: "pending_verification" }),
      users.countDocuments({ role: "customer" }),
      products.countDocuments({ status: "active" }),
      products.countDocuments({ status: "active", stock: { $lte: 5 } }),
      reviews.countDocuments({ status: "pending" }),
    ]);
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 12);
    const monthly = await orders.aggregate<{ month: string; revenue: number; orders: number }>([
      { $match: { date: { $gt: cutoff } } },
      { $lookup: { from: "payments", localField: "paymentId", foreignField: "id", as: "payment" } },
      { $unwind: "$payment" },
      { $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
        revenue: { $sum: { $cond: [{ $eq: ["$payment.status", "paid"] }, "$total", 0] } },
        orders: { $sum: 1 },
      } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, month: "$_id", revenue: 1, orders: 1 } },
    ]).toArray();
    res.json({
      totals: {
        revenue: revenueRows[0]?.total ?? 0,
        orders: totalOrders,
        openOrders,
        pendingPayments,
        customers,
        activeProducts,
        lowStock,
        pendingReviews,
      },
      monthly,
    });
  },
};

const settingsKey = (req: Request): SettingsKey => {
  const key = param(req, "key");
  if (!(key in settingsSchemas)) throw notFound("Unknown settings section.");
  return key as SettingsKey;
};

export const SettingsController = {
  /** Public: brand, bank-transfer details and WhatsApp contact shown on the storefront. */
  async all(_req: Request, res: Response) {
    res.json({ settings: await SettingsModel.getAll() });
  },

  async get(req: Request, res: Response) {
    res.json({ settings: await SettingsModel.get(settingsKey(req)) });
  },

  async update(req: Request, res: Response) {
    const key = settingsKey(req);
    const current = await SettingsModel.get(key);
    const parsed = body(req, settingsSchemas[key].partial()) as Record<string, unknown>;
    // zod fills defaults for omitted fields even in .partial(), so keep only the fields actually sent.
    const sent = Object.keys((req.body ?? {}) as object);
    const patch = Object.fromEntries(Object.entries(parsed).filter(([k]) => sent.includes(k)));
    const merged = settingsSchemas[key].parse({ ...current, ...patch });
    res.json({ settings: await SettingsModel.set(key, merged as never) });
  },
};

export const NewsletterController = {
  async subscribe(req: Request, res: Response) {
    const { email } = body(req, newsletterSchema);
    const created = await NewsletterModel.subscribe(email);
    res.status(created ? 201 : 200).json({ ok: true, message: "Welcome to the KH Luxury private list" });
  },
  async list(_req: Request, res: Response) {
    res.json({ subscribers: await NewsletterModel.list() });
  },
  async remove(req: Request, res: Response) {
    if (!(await NewsletterModel.remove(param(req, "email")))) throw notFound("Subscriber not found.");
    res.status(204).end();
  },
};

export const UploadController = {
  /** Stores a data URL and returns its public URL (for product/category images, designs, etc.). */
  async create(req: Request, res: Response) {
    const { dataUrl, folder } = body(req, uploadSchema);
    if (!dataUrl.startsWith("data:")) throw badRequest("File must be a data URL.");
    res.status(201).json({ url: await saveDataUrl(dataUrl, folder) });
  },
};

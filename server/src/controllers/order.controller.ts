import type { Request, Response } from "express";
import { transaction } from "../config/db.js";
import { currentUser, isAdmin } from "../middleware/auth.js";
import { body } from "../middleware/validate.js";
import { CartModel } from "../models/cart.model.js";
import { LocationModel } from "../models/location.model.js";
import { OrderModel } from "../models/order.model.js";
import { PaymentModel } from "../models/payment.model.js";
import { ProductModel } from "../models/product.model.js";
import type { Order, OrderItem, Payment, PaymentStatus, Receipt } from "../models/types.js";
import { saveDataUrl } from "../services/storage.service.js";
import { badRequest, forbidden, notFound } from "../utils/http-error.js";
import { param } from "../utils/params.js";
import { orderStatusSchema, paymentActionSchema, placeOrderSchema, receiptSchema } from "../validators/schemas.js";

export const VAT_RATE = 0.075;
const DELIVERY_DAYS = 5;

/** Loads an order the current user may see (own order, or any order for admins). */
async function visibleOrder(req: Request, id: string): Promise<Order> {
  const order = await OrderModel.findById(id);
  if (!order || (!isAdmin(req) && order.customerId !== currentUser(req).id)) throw notFound("Order not found.");
  return order;
}

export const OrderController = {
  /** Customers get their own orders; admins get every order. */
  async list(req: Request, res: Response) {
    const me = currentUser(req);
    res.json({ orders: await OrderModel.list(me.role === "admin" ? undefined : me.id) });
  },

  async get(req: Request, res: Response) {
    const order = await visibleOrder(req, param(req, "id"));
    res.json({ order, payment: await PaymentModel.findByOrderId(order.id) });
  },

  /** Turns the customer's bag into an order + a payment awaiting a bank-transfer receipt. */
  async place(req: Request, res: Response) {
    const me = currentUser(req);
    const input = body(req, placeOrderSchema);

    const result = await transaction(async (db) => {
      const cart = await CartModel.list(me.id, db);
      if (!cart.length) throw badRequest("Your bag is empty.");
      const loc = await LocationModel.findById(input.delivery.locationId, db);
      if (!loc || !loc.active) throw badRequest("Choose an available delivery location.");

      // Read products in the same MongoDB transaction before validating and decrementing stock.
      const products = await ProductModel.findManyForUpdate([...new Set(cart.map((i) => i.product.id))], db);
      const wanted = new Map<string, number>();
      for (const i of cart) wanted.set(i.product.id, (wanted.get(i.product.id) ?? 0) + i.quantity);
      for (const [id, qty] of wanted) {
        const p = products.get(id);
        if (!p || p.status !== "active") throw badRequest(`${p?.name ?? "An item in your bag"} is no longer available.`);
        if (p.stock < qty)
          throw badRequest(p.stock === 0 ? `${p.name} is sold out.` : `Only ${p.stock} of ${p.name} left in stock.`);
      }

      const items: OrderItem[] = cart.map((i) => {
        const p = products.get(i.product.id)!;
        return {
          productId: p.id,
          name: p.name,
          image: p.image,
          price: p.price,
          quantity: i.quantity,
          size: i.size,
          color: i.color,
          ...(i.customization ? { customization: i.customization } : {}),
        };
      });
      const subtotal = items.reduce((n, i) => n + i.price * i.quantity, 0);
      const vat = Math.round(subtotal * VAT_RATE);
      const n = await OrderModel.nextNumber(db);
      const now = new Date();
      const order = await OrderModel.create(
        {
          id: `KH-${n}`,
          customerId: me.id,
          date: now.toISOString(),
          items,
          subtotal,
          vat,
          deliveryFee: loc.fee,
          total: subtotal + vat + loc.fee,
          contact: input.contact,
          delivery: { ...input.delivery, locationName: loc.name },
          expectedDelivery: new Date(now.getTime() + DELIVERY_DAYS * 864e5).toISOString(),
          status: "placed",
          paymentId: `PAY-${n}`,
        },
        db,
      );
      const payment = await PaymentModel.create(
        {
          id: order.paymentId,
          orderId: order.id,
          customerId: me.id,
          amount: order.total,
          date: order.date,
          status: "awaiting_receipt",
          notes: [],
        },
        db,
      );
      for (const [id, qty] of wanted) await ProductModel.decrementStock(id, qty, db);
      return { order, payment };
    });

    res.status(201).json(result);
  },

  /**
   * Customer uploads a bank-transfer receipt. This never confirms payment — it moves the payment
   * to pending verification for an admin, and clears the customer's bag.
   */
  async submitReceipt(req: Request, res: Response) {
    const me = currentUser(req);
    const order = await visibleOrder(req, param(req, "id"));
    if (order.customerId !== me.id) throw forbidden("Only the customer who placed this order can upload a receipt.");
    const data = body(req, receiptSchema);
    const url = await saveDataUrl(data.dataUrl, "receipts");
    const receipt: Receipt = { name: data.name, type: data.type, dataUrl: url, uploadedAt: new Date().toISOString() };

    const result = await transaction(async (db) => {
      const pay = await PaymentModel.findByOrderId(order.id, db, true);
      if (!pay) throw notFound("Payment not found.");
      if (pay.status === "paid") throw badRequest("This order has already been paid.");
      const payment = await PaymentModel.update(
        pay.id,
        { status: "pending_verification", receipt, note: "Customer uploaded a receipt." },
        db,
      );
      const updated = await OrderModel.setStatus(order.id, "payment_verification", db);
      await CartModel.clear(me.id, db);
      return { order: updated, payment };
    });
    res.json(result);
  },

  async setStatus(req: Request, res: Response) {
    const { status } = body(req, orderStatusSchema);
    const order = await OrderModel.setStatus(param(req, "id"), status);
    if (!order) throw notFound("Order not found.");
    res.json({ order });
  },
};

export const PaymentController = {
  async list(req: Request, res: Response) {
    const me = currentUser(req);
    const status = typeof req.query.status === "string" ? (req.query.status as PaymentStatus) : undefined;
    res.json({ payments: await PaymentModel.list({ customerId: me.role === "admin" ? undefined : me.id, status }) });
  },

  async get(req: Request, res: Response) {
    const payment = await PaymentModel.findById(param(req, "id"));
    if (!payment || (!isAdmin(req) && payment.customerId !== currentUser(req).id)) throw notFound("Payment not found.");
    res.json({ payment, order: await OrderModel.findById(payment.orderId) });
  },

  /** Admin verifies a receipt: confirm → paid; reject / resubmit → customer must act again. */
  async action(req: Request, res: Response) {
    const { action, note } = body(req, paymentActionSchema);
    const id = param(req, "id");
    const result = await transaction(async (db) => {
      const pay = await PaymentModel.findById(id, db, true);
      if (!pay) throw notFound("Payment not found.");
      if (action === "confirm" && pay.status === "paid") throw badRequest("This payment is already confirmed.");
      const status: PaymentStatus = action === "confirm" ? "paid" : action === "reject" ? "rejected" : "resubmit";
      const text =
        action === "confirm"
          ? "Payment confirmed by admin."
          : action === "reject"
            ? `Payment rejected${note ? `: ${note}` : "."}`
            : `New receipt requested${note ? `: ${note}` : "."}`;
      const payment: Payment = await PaymentModel.update(id, { status, note: text }, db);
      const order = await OrderModel.setStatus(
        pay.orderId,
        action === "confirm" ? "payment_confirmed" : "payment_verification",
        db,
      );
      return { payment, order };
    });
    res.json(result);
  },
};

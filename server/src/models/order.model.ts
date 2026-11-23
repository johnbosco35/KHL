import type { Document } from "mongodb";
import { collection, type Db } from "../config/db.js";
import { iso, type Order, type OrderStatus } from "./types.js";

type OrderDoc = Document & Omit<Order, "date" | "expectedDelivery"> & {
  date: Date; expectedDelivery: Date;
};
const orders = () => collection<OrderDoc>("orders");
const toOrder = (o: OrderDoc): Order => ({
  id: o.id, customerId: o.customerId, date: iso(o.date), items: o.items, subtotal: o.subtotal, vat: o.vat,
  deliveryFee: o.deliveryFee, total: o.total, contact: o.contact, delivery: o.delivery,
  expectedDelivery: iso(o.expectedDelivery), status: o.status, paymentId: o.paymentId,
});

export const OrderModel = {
  async nextNumber(db: Db): Promise<number> {
    const counter = await collection<Document & { _id: string; value: number }>("counters")
      .findOneAndUpdate({ _id: "order_number" }, { $inc: { value: 1 } },
        { upsert: true, returnDocument: "after", session: db });
    return counter!.value;
  },
  async list(customerId?: string): Promise<Order[]> {
    const filter = customerId ? { customerId } : {};
    return (await orders().find(filter).sort({ date: -1 }).toArray()).map(toOrder);
  },
  async findById(id: string, db?: Db): Promise<Order | null> {
    const o = await orders().findOne({ id }, db ? { session: db } : {});
    return o ? toOrder(o) : null;
  },
  async create(o: Order, db: Db): Promise<Order> {
    const doc: OrderDoc = { ...o, date: new Date(o.date), expectedDelivery: new Date(o.expectedDelivery) };
    await orders().insertOne(doc, { session: db });
    return toOrder(doc);
  },
  async setStatus(id: string, status: OrderStatus, db?: Db): Promise<Order | null> {
    const o = await orders().findOneAndUpdate({ id }, { $set: { status } },
      { returnDocument: "after", ...(db ? { session: db } : {}) });
    return o ? toOrder(o) : null;
  },
};

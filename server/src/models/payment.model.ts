import type { Document } from "mongodb";
import { collection, type Db } from "../config/db.js";
import { iso, type Payment, type PaymentNote, type PaymentStatus } from "./types.js";

type PaymentDoc = Document & Omit<Payment, "date"> & { date: Date };
const payments = () => collection<PaymentDoc>("payments");
const toPayment = (p: PaymentDoc): Payment => ({
  id: p.id, orderId: p.orderId, customerId: p.customerId, amount: p.amount, date: iso(p.date),
  status: p.status, ...(p.receipt ? { receipt: p.receipt } : {}), notes: p.notes,
});

export const PaymentModel = {
  async list(f: { customerId?: string; status?: PaymentStatus } = {}): Promise<Payment[]> {
    const filter: Record<string, string> = {};
    if (f.customerId) filter.customerId = f.customerId;
    if (f.status) filter.status = f.status;
    return (await payments().find(filter).sort({ date: -1 }).toArray()).map(toPayment);
  },
  async findById(id: string, db?: Db, _lock = false): Promise<Payment | null> {
    const p = await payments().findOne({ id }, db ? { session: db } : {});
    return p ? toPayment(p) : null;
  },
  async findByOrderId(orderId: string, db?: Db, _lock = false): Promise<Payment | null> {
    const p = await payments().findOne({ orderId }, db ? { session: db } : {});
    return p ? toPayment(p) : null;
  },
  async create(p: Payment, db: Db): Promise<Payment> {
    const doc: PaymentDoc = { ...p, date: new Date(p.date) };
    await payments().insertOne(doc, { session: db });
    return toPayment(doc);
  },
  async update(
    id: string,
    patch: { status: PaymentStatus; note: string; receipt?: Payment["receipt"] },
    db?: Db,
  ): Promise<Payment> {
    const note: PaymentNote = { at: new Date().toISOString(), text: patch.note };
    const p = await payments().findOneAndUpdate({ id }, [{
      $set: {
        status: patch.status,
        date: new Date(),
        notes: { $concatArrays: [{ $ifNull: ["$notes", []] }, [note]] },
        ...(patch.receipt ? { receipt: patch.receipt } : {}),
      },
    }],
      { returnDocument: "after", ...(db ? { session: db } : {}) });
    if (!p) throw new Error(`Payment ${id} not found.`);
    return toPayment(p);
  },
};

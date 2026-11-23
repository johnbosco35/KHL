import type { Document } from "mongodb";
import { collection } from "../config/db.js";
import { iso } from "./types.js";

type SubscriberDoc = Document & { email: string; createdAt: Date };
const subscribers = () => collection<SubscriberDoc>("newsletter_subscribers");
export const NewsletterModel = {
  /** Returns true if this is a new subscriber. */
  async subscribe(email: string): Promise<boolean> {
    const result = await subscribers().updateOne(
      { email: email.toLowerCase() }, { $setOnInsert: { createdAt: new Date() } }, { upsert: true },
    );
    return result.upsertedCount > 0;
  },
  async list(): Promise<{ email: string; createdAt: string }[]> {
    const rows = await subscribers().find().sort({ createdAt: -1 }).toArray();
    return rows.map((r) => ({ email: r.email, createdAt: iso(r.createdAt) }));
  },
  async remove(email: string): Promise<boolean> {
    const result = await subscribers().deleteOne({ email: email.toLowerCase() });
    return result.deletedCount > 0;
  },
};

import { MongoClient, type ClientSession, type Collection, type Document } from "mongodb";
import { env } from "./env.js";

export type Db = ClientSession;

const client = new MongoClient(env.MONGODB_URI);
let connected = false;

export async function connectDb(): Promise<void> {
  if (connected) return;
  await client.connect();
  connected = true;
  const db = client.db();
  await Promise.all([
    ...[
      "users",
      "categories",
      "products",
      "delivery_locations",
      "reviews",
      "orders",
      "payments",
    ].map((name) => db.collection(name).createIndex({ id: 1 }, { unique: true })),
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("categories").createIndex({ name: 1 }, { unique: true }),
    db.collection("products").createIndex({ sku: 1 }, { unique: true }),
    db.collection("products").createIndex({ category: 1 }),
    db.collection("products").createIndex({ status: 1 }),
    db.collection("reviews").createIndex({ productId: 1 }),
    db.collection("cart_items").createIndex({ userId: 1, key: 1 }, { unique: true }),
    db.collection("wishlist_items").createIndex({ userId: 1, productId: 1 }, { unique: true }),
    db.collection("orders").createIndex({ customerId: 1 }),
    db.collection("payments").createIndex({ orderId: 1 }, { unique: true }),
    db.collection("newsletter_subscribers").createIndex({ email: 1 }, { unique: true }),
    db.collection("settings").createIndex({ key: 1 }, { unique: true }),
    db.collection("password_resets").createIndex({ tokenHash: 1 }, { unique: true }),
    db.collection("password_resets").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db
      .collection<Document & { _id: string }>("counters")
      .updateOne({ _id: "order_number" }, { $setOnInsert: { value: 1000 } }, { upsert: true }),
  ]);
  console.log(`✔ Connected to MongoDB database "${db.databaseName}".`);
}

export function collection<T extends Document = Document>(name: string): Collection<T> {
  if (!connected) throw new Error("MongoDB has not been connected.");
  return client.db().collection<T>(name);
}

export async function transaction<T>(fn: (session: Db) => Promise<T>): Promise<T> {
  const session = client.startSession();
  try {
    let result!: T;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}

export async function closeDb(): Promise<void> {
  if (!connected) return;
  connected = false;
  await client.close();
}

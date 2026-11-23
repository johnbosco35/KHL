import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import type { Document } from "mongodb";
import { closeDb, collection, connectDb } from "../config/db.js";
import { env } from "../config/env.js";
import { defaultSettings, SETTINGS_KEYS } from "../models/settings.model.js";
import type { DeliveryLocation } from "../models/types.js";
import { saveFile } from "../services/storage.service.js";
import { slugify } from "../utils/ids.js";

const ASSETS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../seed-assets");
const log = (message: string) => console.log(`  ${message}`);
const categories = ["Tees", "Polos", "Joggers", "Jackets", "Shorts", "Blank Tees"];

const locations: DeliveryLocation[] = [
  { id: "loc-ikoyi", name: "Ikoyi", address: "Ikoyi, Lagos", description: "Door delivery across Ikoyi and Obalende.", fee: 3500, eta: "1–2 working days", active: true },
  { id: "loc-vi", name: "Victoria Island", address: "Victoria Island, Lagos", description: "Door delivery across VI and Oniru.", fee: 3500, eta: "1–2 working days", active: true },
  { id: "loc-lekki", name: "Lekki Phase 1", address: "Lekki Phase 1, Lagos", description: "Door delivery across Lekki Phase 1.", fee: 4500, eta: "1–3 working days", active: true },
  { id: "loc-studio", name: "Studio pickup", address: "14 Bourdillon Road, Ikoyi", description: "Collect from the KH Luxury studio.", fee: 0, eta: "Ready in 24 hours", active: true },
  { id: "loc-abuja", name: "Abuja Central", address: "Central Business District, Abuja", description: "Courier delivery to Abuja.", fee: 8000, eta: "3–5 working days", active: false },
];

type ImageKey = "e1" | "e2" | "e3" | "hero";
const imageFiles: Record<ImageKey, string> = {
  e1: "kh-editorial-1.jpg", e2: "kh-editorial-2.jpg", e3: "kh-editorial-3.jpg", hero: "kh-hero.jpg",
};
const productFixtures = [
  { id: "obsidian-essential-tee", name: "Obsidian Essential Tee", category: "Tees", price: 48500, image: "e1" as const, colors: ["Obsidian", "Ivory"], sizes: ["S", "M", "L", "XL"], stock: 14, featured: true, newArrival: true, description: "A precise heavyweight cotton tee cut for a relaxed, architectural drape." },
  { id: "signature-sculpt-polo", name: "Signature Sculpt Polo", category: "Polos", price: 62000, image: "e1" as const, colors: ["Obsidian", "Espresso"], sizes: ["M", "L", "XL"], stock: 8, featured: true, description: "Fine-gauge cotton knit with a structured collar and clean concealed placket." },
  { id: "atelier-tailored-short", name: "Atelier Tailored Short", category: "Shorts", price: 54500, image: "e2" as const, colors: ["Obsidian", "Sand"], sizes: ["XS", "S", "M", "L"], stock: 6, newArrival: true, description: "Crisp tailoring, a high waist, and considered ease for warm city days." },
  { id: "noir-structure-jacket", name: "Noir Structure Jacket", category: "Jackets", price: 128000, image: "e2" as const, colors: ["Obsidian"], sizes: ["S", "M", "L"], stock: 4, featured: true, description: "A confident shoulder line and fluid body balance strength with movement." },
  { id: "heritage-bomber", name: "Heritage Bomber", category: "Jackets", price: 146000, image: "e3" as const, colors: ["Espresso", "Obsidian"], sizes: ["M", "L", "XL"], stock: 0, newArrival: true, description: "Supple technical twill with understated hardware and a refined cropped proportion." },
  { id: "ivory-foundation-tee", name: "Ivory Foundation Tee", category: "Blank Tees", price: 35000, image: "e3" as const, colors: ["Ivory", "Obsidian", "Sand"], sizes: ["S", "M", "L", "XL", "XXL"], stock: 25, customizable: true, description: "Our premium blank canvas, made for custom expression in dense combed cotton." },
  { id: "essential-tailored-jogger", name: "Essential Tailored Jogger", category: "Joggers", price: 72500, image: "e1" as const, colors: ["Obsidian", "Espresso"], sizes: ["S", "M", "L", "XL"], stock: 9, description: "An elevated jogger with tailored pleats, a clean waistband, and quiet comfort." },
  { id: "sand-studio-short", name: "Sand Studio Short", category: "Shorts", price: 49000, image: "e2" as const, colors: ["Sand", "Ivory"], sizes: ["XS", "S", "M", "L"], stock: 7, status: "draft", description: "Minimal warm-weather tailoring grounded in a soft mineral palette." },
];

async function seedAdmin() {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    log("⚠ ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin account.");
    return;
  }
  if (env.ADMIN_PASSWORD.length < 8) throw new Error("ADMIN_PASSWORD must be at least 8 characters.");
  const result = await collection("users").updateOne(
    { id: "admin-1" },
    { $setOnInsert: {
      id: "admin-1", name: env.ADMIN_NAME, email: env.ADMIN_EMAIL.toLowerCase(), phone: "",
      passwordHash: await bcrypt.hash(env.ADMIN_PASSWORD, 12), role: "admin", status: "active", createdAt: new Date(),
    } },
    { upsert: true },
  );
  log(result.upsertedCount ? `✔ Admin account created: ${env.ADMIN_EMAIL}` : "• Admin account already exists.");
}

async function seedCatalogue() {
  for (const name of categories) {
    await collection("categories").updateOne(
      { id: slugify(name) },
      { $setOnInsert: { id: slugify(name), name, description: `KH Luxury ${name.toLowerCase()}, considered for everyday confidence.`, active: true } },
      { upsert: true },
    );
  }
  for (const location of locations) {
    await collection("delivery_locations").updateOne(
      { id: location.id }, { $setOnInsert: location }, { upsert: true },
    );
  }
  log("✔ Categories and delivery locations.");

  const productCollection = collection("products");
  if (await productCollection.countDocuments()) {
    log("• Products already exist — catalogue left unchanged.");
    return;
  }
  const uploadedImages: Record<ImageKey, string> = {} as Record<ImageKey, string>;
  for (const [key, file] of Object.entries(imageFiles) as [ImageKey, string][]) {
    uploadedImages[key] = await saveFile(await readFile(path.join(ASSETS, file)), "image/jpeg", "products");
  }
  const otherImages: ImageKey[] = ["e3", "e1", "hero"];
  for (const product of productFixtures) {
    const images = [uploadedImages[product.image], ...otherImages.filter((key) => key !== product.image).slice(0, 2).map((key) => uploadedImages[key])];
    await productCollection.insertOne({
      ...product,
      sku: `KH-${product.id.slice(0, 3).toUpperCase()}-${product.price}`,
      image: uploadedImages[product.image],
      images,
      featured: !!product.featured,
      newArrival: !!product.newArrival,
      customizable: !!product.customizable,
      status: product.status ?? "active",
      specifications: "100% premium cotton · Made in Lagos · Cold wash, air dry",
      createdAt: new Date("2026-09-01T10:00:00Z"),
    });
  }
  log(`✔ ${productFixtures.length} products (images stored locally).`);
}

async function seedDemo() {
  const hash = await bcrypt.hash("password123", 12);
  const customers = [
    { id: "cus-1001", name: "Amara Okafor", email: "amara@example.com", phone: "+234 801 111 2233", date: "2026-03-04T09:00:00Z" },
    { id: "cus-1002", name: "Daniel Mensah", email: "daniel@example.com", phone: "+234 802 222 3344", date: "2026-05-12T09:00:00Z" },
    { id: "cus-1003", name: "Zainab Bello", email: "zainab@example.com", phone: "+234 803 333 4455", date: "2026-06-21T09:00:00Z" },
  ];
  for (const customer of customers) {
    await collection("users").updateOne(
      { id: customer.id },
      { $setOnInsert: { ...customer, passwordHash: hash, role: "customer", status: "active", createdAt: new Date(customer.date) } },
      { upsert: true },
    );
  }
  const demoOrders = [
    { n: 1004, customerId: "cus-1001", date: "2026-09-24T10:00:00Z", products: [["obsidian-essential-tee", 2, "M", "Obsidian"], ["atelier-tailored-short", 1, "S", "Sand"]], locationId: "loc-ikoyi", status: "payment_verification", paymentStatus: "pending_verification" },
    { n: 1003, customerId: "cus-1002", date: "2026-09-19T10:00:00Z", products: [["noir-structure-jacket", 1, "L", "Obsidian"]], locationId: "loc-vi", status: "out_for_delivery", paymentStatus: "paid" },
    { n: 1002, customerId: "cus-1003", date: "2026-09-10T10:00:00Z", products: [["signature-sculpt-polo", 1, "M", "Espresso"]], locationId: "loc-lekki", status: "delivered", paymentStatus: "paid" },
    { n: 1001, customerId: "cus-1001", date: "2026-09-02T10:00:00Z", products: [["essential-tailored-jogger", 1, "M", "Obsidian"]], locationId: "loc-studio", status: "delivered", paymentStatus: "paid" },
  ];
  const productMap = new Map((await collection("products").find().toArray()).map((p) => [p.id, p]));
  const customerMap = new Map(customers.map((c) => [c.id, c]));
  const locationMap = new Map(locations.map((l) => [l.id, l]));
  for (const item of demoOrders) {
    const customer = customerMap.get(item.customerId)!;
    const location = locationMap.get(item.locationId)!;
    const lines = item.products.flatMap(([id, quantity, size, color]) => {
      const product = productMap.get(id as string);
      return product ? [{
        productId: product.id, name: product.name, image: product.image, price: product.price,
        quantity: quantity as number, size: size as string, color: color as string,
      }] : [];
    });
    if (!lines.length) continue;
    const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
    const vat = Math.round(subtotal * 0.075);
    const id = `KH-${item.n}`;
    const date = new Date(item.date);
    await collection("orders").updateOne({ id }, { $setOnInsert: {
      id, customerId: item.customerId, date, items: lines, subtotal, vat, deliveryFee: location.fee,
      total: subtotal + vat + location.fee,
      contact: { name: customer.name, email: customer.email, phone: customer.phone },
      delivery: { address: "14 Bourdillon Road", city: location.name, state: "Lagos", locationId: location.id, locationName: location.name },
      expectedDelivery: new Date(date.getTime() + 4 * 864e5), status: item.status, paymentId: `PAY-${item.n}`,
    } }, { upsert: true });
    await collection("payments").updateOne({ id: `PAY-${item.n}` }, { $setOnInsert: {
      id: `PAY-${item.n}`, orderId: id, customerId: item.customerId, amount: subtotal + vat + location.fee,
      date, status: item.paymentStatus, notes: item.paymentStatus === "paid" ? [{ at: item.date, text: "Payment confirmed by admin." }] : [],
    } }, { upsert: true });
  }
  await collection<Document & { _id: string; value: number }>("counters")
    .updateOne({ _id: "order_number" }, { $max: { value: 1004 } }, { upsert: true });
  const reviews: [string, string, string, number, string, string, string][] = [
    ["rev-1", "noir-structure-jacket", "cus-1001", 5, "The quality is immediate—the weight, the fit, the restraint. It feels considered.", "2026-09-12T10:00:00Z", "approved"],
    ["rev-2", "obsidian-essential-tee", "cus-1002", 5, "Arrived beautifully presented and fits like it was made for me.", "2026-09-15T10:00:00Z", "approved"],
    ["rev-3", "ivory-foundation-tee", "cus-1003", 4, "The custom tee process was effortless. The result feels truly personal.", "2026-09-20T10:00:00Z", "pending"],
    ["rev-4", "obsidian-essential-tee", "cus-1003", 2, "Delivery took longer than I expected.", "2026-09-22T10:00:00Z", "hidden"],
  ];
  for (const [id, productId, customerId, rating, text, date, status] of reviews) {
    if (!productMap.has(productId)) continue;
    await collection("reviews").updateOne({ id }, { $setOnInsert: {
      id, productId, customerId, rating, text, status, createdAt: new Date(date),
    } }, { upsert: true });
  }
  await collection("wishlist_items").updateOne(
    { userId: "cus-1001", productId: "noir-structure-jacket" },
    { $setOnInsert: { createdAt: new Date() } }, { upsert: true },
  );
  log("✔ Demo customers, orders, payments, reviews (customer password: password123).");
}

async function main() {
  await connectDb();
  console.log("Seeding KH Luxury MongoDB…");
  await seedAdmin();
  await seedCatalogue();
  for (const key of SETTINGS_KEYS) {
    await collection("settings").updateOne(
      { key }, { $setOnInsert: { key, value: defaultSettings[key], updatedAt: new Date() } }, { upsert: true },
    );
  }
  log("✔ Store settings.");
  if (process.argv.includes("--demo")) await seedDemo();
  console.log("✔ Done.");
}

main()
  .catch((err) => {
    console.error("✖ Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(() => closeDb());

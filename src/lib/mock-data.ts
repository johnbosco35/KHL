import editorial1 from "@/assets/kh-editorial-1.jpg";
import editorial2 from "@/assets/kh-editorial-2.jpg";
import editorial3 from "@/assets/kh-editorial-3.jpg";
import hero from "@/assets/kh-hero.jpg";

// ---------- Types (shaped to map 1:1 onto future database tables) ----------
export type ProductStatus = "active" | "draft" | "archived";
export type Product = {
  id: string; sku: string; name: string; category: string; price: number; image: string; images: string[];
  colors: string[]; sizes: string[]; stock: number; featured?: boolean; newArrival?: boolean; customizable?: boolean;
  status: ProductStatus; specifications: string; description: string; createdAt: string;
};
export type Category = { id: string; name: string; description: string; image?: string; active: boolean };
export type DeliveryLocation = { id: string; name: string; address: string; description: string; fee: number; eta: string; active: boolean };
export type ReviewStatus = "pending" | "approved" | "hidden" | "rejected";
export type Review = { id: string; productId: string; customerId: string; rating: number; text: string; date: string; status: ReviewStatus; image?: string };
export type Role = "customer" | "admin";
export type User = { id: string; name: string; email: string; phone: string; password: string; role: Role; createdAt: string; status: "active" | "suspended" };
export type Customization = { blank: string; instructions: string; designName?: string; designData?: string };
export type CartItem = { key: string; product: Product; quantity: number; size: string; color: string; customization?: Customization };
export type OrderItem = { productId: string; name: string; image: string; price: number; quantity: number; size: string; color: string; customization?: Customization };
export const ORDER_STEPS = ["placed", "payment_verification", "payment_confirmed", "processing", "ready", "out_for_delivery", "delivered"] as const;
export type OrderStatus = (typeof ORDER_STEPS)[number];
export const ORDER_STEP_LABELS: Record<OrderStatus, string> = { placed: "Order placed", payment_verification: "Payment verification", payment_confirmed: "Payment confirmed", processing: "Processing", ready: "Ready for delivery/pickup", out_for_delivery: "Out for delivery", delivered: "Delivered" };
export type Order = {
  id: string; customerId: string; date: string; items: OrderItem[]; subtotal: number; vat: number; deliveryFee: number; total: number;
  contact: { name: string; email: string; phone: string };
  delivery: { address: string; city: string; state: string; locationId: string; locationName: string };
  expectedDelivery: string; status: OrderStatus; paymentId: string;
};
export type PaymentStatus = "awaiting_receipt" | "pending_verification" | "paid" | "rejected" | "resubmit";
export const PAYMENT_LABELS: Record<PaymentStatus, string> = { awaiting_receipt: "Awaiting receipt", pending_verification: "Pending verification", paid: "Paid", rejected: "Rejected", resubmit: "Resubmit receipt" };
export type Receipt = { name: string; type: string; dataUrl: string; uploadedAt: string };
export type Payment = { id: string; orderId: string; customerId: string; amount: number; date: string; status: PaymentStatus; receipt?: Receipt; notes: { at: string; text: string }[] };

export const formatPrice = (value: number) => `₦${value.toLocaleString("en-NG")}`;
export const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
export const VAT_RATE = 0.075;
export const shopCategories = ["New Arrivals", "Featured"];

// ---------- Seed data ----------
const p = (o: Omit<Product, "images" | "status" | "specifications" | "createdAt" | "sku"> & Partial<Product>): Product => ({
  images: [o.image, ...[editorial3, editorial1, hero].filter((image) => image !== o.image).slice(0, 2)], status: "active", sku: `KH-${o.id.slice(0, 3).toUpperCase()}-${o.price}`,
  specifications: "100% premium cotton · Made in Lagos · Cold wash, air dry", createdAt: "2026-09-01T10:00:00Z", ...o,
});
export const seedProducts: Product[] = [
  p({ id: "obsidian-essential-tee", name: "Obsidian Essential Tee", category: "Tees", price: 48500, image: editorial1, colors: ["Obsidian", "Ivory"], sizes: ["S", "M", "L", "XL"], stock: 14, featured: true, newArrival: true, description: "A precise heavyweight cotton tee cut for a relaxed, architectural drape." }),
  p({ id: "signature-sculpt-polo", name: "Signature Sculpt Polo", category: "Polos", price: 62000, image: editorial1, colors: ["Obsidian", "Espresso"], sizes: ["M", "L", "XL"], stock: 8, featured: true, description: "Fine-gauge cotton knit with a structured collar and clean concealed placket." }),
  p({ id: "atelier-tailored-short", name: "Atelier Tailored Short", category: "Shorts", price: 54500, image: editorial2, colors: ["Obsidian", "Sand"], sizes: ["XS", "S", "M", "L"], stock: 6, newArrival: true, description: "Crisp tailoring, a high waist, and considered ease for warm city days." }),
  p({ id: "noir-structure-jacket", name: "Noir Structure Jacket", category: "Jackets", price: 128000, image: editorial2, colors: ["Obsidian"], sizes: ["S", "M", "L"], stock: 4, featured: true, description: "A confident shoulder line and fluid body balance strength with movement." }),
  p({ id: "heritage-bomber", name: "Heritage Bomber", category: "Jackets", price: 146000, image: editorial3, colors: ["Espresso", "Obsidian"], sizes: ["M", "L", "XL"], stock: 0, newArrival: true, description: "Supple technical twill with understated hardware and a refined cropped proportion." }),
  p({ id: "ivory-foundation-tee", name: "Ivory Foundation Tee", category: "Blank Tees", price: 35000, image: editorial3, colors: ["Ivory", "Obsidian", "Sand"], sizes: ["S", "M", "L", "XL", "XXL"], stock: 25, customizable: true, description: "Our premium blank canvas, made for custom expression in dense combed cotton." }),
  p({ id: "essential-tailored-jogger", name: "Essential Tailored Jogger", category: "Joggers", price: 72500, image: editorial1, colors: ["Obsidian", "Espresso"], sizes: ["S", "M", "L", "XL"], stock: 9, description: "An elevated jogger with tailored pleats, a clean waistband, and quiet comfort." }),
  p({ id: "sand-studio-short", name: "Sand Studio Short", category: "Shorts", price: 49000, image: editorial2, colors: ["Sand", "Ivory"], sizes: ["XS", "S", "M", "L"], stock: 7, status: "draft", description: "Minimal warm-weather tailoring grounded in a soft mineral palette." }),
];
/** Seed catalog shared by the storefront and its product detail routes. */
export const products = seedProducts;

export const seedCategories: Category[] = ["Tees", "Polos", "Joggers", "Jackets", "Shorts", "Blank Tees"].map((name) => ({ id: name.toLowerCase().replace(/\s+/g, "-"), name, description: `KH Luxury ${name.toLowerCase()}, considered for everyday confidence.`, active: true }));
export const categories = [...seedCategories.map((c) => c.name), ...shopCategories];

export const seedLocations: DeliveryLocation[] = [
  { id: "loc-ikoyi", name: "Ikoyi", address: "Ikoyi, Lagos", description: "Door delivery across Ikoyi and Obalende.", fee: 3500, eta: "1–2 working days", active: true },
  { id: "loc-vi", name: "Victoria Island", address: "Victoria Island, Lagos", description: "Door delivery across VI and Oniru.", fee: 3500, eta: "1–2 working days", active: true },
  { id: "loc-lekki", name: "Lekki Phase 1", address: "Lekki Phase 1, Lagos", description: "Door delivery across Lekki Phase 1.", fee: 4500, eta: "1–3 working days", active: true },
  { id: "loc-studio", name: "Studio pickup", address: "14 Bourdillon Road, Ikoyi", description: "Collect from the KH Luxury studio.", fee: 0, eta: "Ready in 24 hours", active: true },
  { id: "loc-abuja", name: "Abuja Central", address: "Central Business District, Abuja", description: "Courier delivery to Abuja.", fee: 8000, eta: "3–5 working days", active: false },
];

export const seedUsers: User[] = [
  { id: "admin-1", name: "Adaora Okeke", email: "admin@khluxury.com", phone: "+234 800 000 0001", password: "Admin123!", role: "admin", createdAt: "2026-01-10T09:00:00Z", status: "active" },
  { id: "cus-1001", name: "Amara Okafor", email: "amara@example.com", phone: "+234 801 111 2233", password: "password123", role: "customer", createdAt: "2026-03-04T09:00:00Z", status: "active" },
  { id: "cus-1002", name: "Daniel Mensah", email: "daniel@example.com", phone: "+234 802 222 3344", password: "password123", role: "customer", createdAt: "2026-05-12T09:00:00Z", status: "active" },
  { id: "cus-1003", name: "Zainab Bello", email: "zainab@example.com", phone: "+234 803 333 4455", password: "password123", role: "customer", createdAt: "2026-06-21T09:00:00Z", status: "active" },
];

export const seedReviews: Review[] = [
  { id: "rev-1", productId: "noir-structure-jacket", customerId: "cus-1001", rating: 5, text: "The quality is immediate—the weight, the fit, the restraint. It feels considered.", date: "2026-09-12T10:00:00Z", status: "approved" },
  { id: "rev-2", productId: "obsidian-essential-tee", customerId: "cus-1002", rating: 5, text: "Arrived beautifully presented and fits like it was made for me.", date: "2026-09-15T10:00:00Z", status: "approved" },
  { id: "rev-3", productId: "ivory-foundation-tee", customerId: "cus-1003", rating: 4, text: "The custom tee process was effortless. The result feels truly personal.", date: "2026-09-20T10:00:00Z", status: "pending" },
  { id: "rev-4", productId: "obsidian-essential-tee", customerId: "cus-1003", rating: 2, text: "Delivery took longer than I expected.", date: "2026-09-22T10:00:00Z", status: "hidden" },
];

const receiptSvg = (name: string, amount: number) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="420" height="620"><rect width="100%" height="100%" fill="#fff"/><text x="30" y="60" font-family="Arial" font-size="22" font-weight="bold">Example Bank</text><text x="30" y="90" font-family="Arial" font-size="13" fill="#666">Transfer receipt</text><line x1="30" y1="115" x2="390" y2="115" stroke="#ddd"/><text x="30" y="160" font-family="Arial" font-size="13" fill="#666">Sender</text><text x="30" y="182" font-family="Arial" font-size="16">${name}</text><text x="30" y="225" font-family="Arial" font-size="13" fill="#666">Beneficiary</text><text x="30" y="247" font-family="Arial" font-size="16">KH Luxury · 0000000000</text><text x="30" y="290" font-family="Arial" font-size="13" fill="#666">Amount</text><text x="30" y="322" font-family="Arial" font-size="28" font-weight="bold">NGN ${amount.toLocaleString("en-NG")}</text><text x="30" y="370" font-family="Arial" font-size="13" fill="#666">Status</text><text x="30" y="392" font-family="Arial" font-size="16" fill="#1a7f37">Successful</text></svg>`)}`;

const mkOrder = (id: string, customer: User, date: string, items: [Product, number, string, string][], locId: string, status: OrderStatus, payStatus: PaymentStatus): [Order, Payment] => {
  const loc = seedLocations.find((l) => l.id === locId) ?? seedLocations[0]!;
  const orderItems = items.map(([pr, q, s, c]) => ({ productId: pr.id, name: pr.name, image: pr.image, price: pr.price, quantity: q, size: s, color: c }));
  const subtotal = orderItems.reduce((n, i) => n + i.price * i.quantity, 0); const vat = Math.round(subtotal * VAT_RATE); const total = subtotal + vat + loc.fee;
  const payId = `PAY-${id.slice(3)}`;
  const order: Order = { id, customerId: customer.id, date, items: orderItems, subtotal, vat, deliveryFee: loc.fee, total, contact: { name: customer.name, email: customer.email, phone: customer.phone }, delivery: { address: "14 Bourdillon Road", city: loc.name, state: "Lagos", locationId: loc.id, locationName: loc.name }, expectedDelivery: new Date(new Date(date).getTime() + 4 * 864e5).toISOString(), status, paymentId: payId };
  const payment: Payment = { id: payId, orderId: id, customerId: customer.id, amount: total, date, status: payStatus, receipt: { name: `receipt-${id}.svg`, type: "image/svg+xml", dataUrl: receiptSvg(customer.name, total), uploadedAt: date }, notes: [] };
  return [order, payment];
};
const [u1, u2, u3] = [seedUsers[1]!, seedUsers[2]!, seedUsers[3]!];
const sp = (i: number) => seedProducts[i]!;
const seeded = [
  mkOrder("KH-1004", u1, "2026-09-24T10:00:00Z", [[sp(0), 2, "M", "Obsidian"], [sp(2), 1, "S", "Sand"]], "loc-ikoyi", "payment_verification", "pending_verification"),
  mkOrder("KH-1003", u2, "2026-09-19T10:00:00Z", [[sp(3), 1, "L", "Obsidian"]], "loc-vi", "out_for_delivery", "paid"),
  mkOrder("KH-1002", u3, "2026-09-10T10:00:00Z", [[sp(1), 1, "M", "Espresso"]], "loc-lekki", "delivered", "paid"),
  mkOrder("KH-1001", u1, "2026-09-02T10:00:00Z", [[sp(6), 1, "M", "Obsidian"]], "loc-studio", "delivered", "paid"),
];
export const seedOrders: Order[] = seeded.map(([o]) => o);
export const seedPayments: Payment[] = seeded.map(([, pay]) => pay);

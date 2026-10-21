import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  seedCategories, seedLocations, seedOrders, seedPayments, seedProducts, seedReviews, seedUsers, VAT_RATE,
  type CartItem, type Category, type Customization, type DeliveryLocation, type Order, type OrderStatus, type Payment, type Product,
  type Receipt, type Review, type ReviewStatus, type User,
} from "@/lib/mock-data";

/**
 * Mock data layer. Everything lives in one persisted object (localStorage) so each record
 * exists once and every screen reads the same source. Swap these actions for backend calls later.
 */
type DB = {
  products: Product[]; categories: Category[]; locations: DeliveryLocation[]; reviews: Review[];
  users: User[]; orders: Order[]; payments: Payment[];
  carts: Record<string, CartItem[]>; wishlists: Record<string, string[]>;
  sessionUserId: string | null; resetTokens: Record<string, string>;
};
export type PendingAction =
  | { type: "cart"; productId: string; size: string; color: string; quantity: number; returnTo: string }
  | { type: "wishlist"; productId: string; returnTo: string }
  | { type: "navigate"; returnTo: string };

const KEY = "kh-luxury-db-v2"; const PENDING = "kh-luxury-pending";
const seed = (): DB => ({ products: seedProducts, categories: seedCategories, locations: seedLocations, reviews: seedReviews, users: seedUsers, orders: seedOrders, payments: seedPayments, carts: {}, wishlists: { "cus-1001": ["noir-structure-jacket"] }, sessionUserId: null, resetTokens: {} });
const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
const now = () => new Date().toISOString();

function useDBState() {
  const [db, setDb] = useState<DB>(seed);
  const [ready, setReady] = useState(false);
  useEffect(() => { try { const raw = localStorage.getItem(KEY); if (raw) setDb({ ...seed(), ...JSON.parse(raw) }); } catch { /* ignore */ } setReady(true); }, []);
  const first = useRef(true);
  useEffect(() => { if (!ready) return; if (first.current) { first.current = false; return; } try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { toast.error("Storage is full — try a smaller file."); } }, [db, ready]);
  return { db, setDb, ready };
}

function useAppValue() {
  const { db, setDb, ready } = useDBState();
  const user = db.users.find((u) => u.id === db.sessionUserId) ?? null;
  // Tracks the session synchronously so an action resumed right after sign-in targets the new account.
  const sessionRef = useRef<string | null>(null); sessionRef.current = db.sessionUserId;
  const update = useCallback((fn: (d: DB) => Partial<DB>) => setDb((d) => ({ ...d, ...fn(d) })), [setDb]);

  // ---------- Auth ----------
  const signIn = (email: string, password: string, role: "customer" | "admin"): User => {
    const u = db.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
    if (!u || u.password !== password) throw new Error("Incorrect email or password.");
    if (u.role !== role) throw new Error(role === "admin" ? "This account does not have admin access." : "Admin accounts must sign in through the admin portal.");
    if (u.status !== "active") throw new Error("This account is suspended.");
    sessionRef.current = u.id; update(() => ({ sessionUserId: u.id })); return u;
  };
  const signUp = (data: { name: string; email: string; phone: string; password: string }): User => {
    if (db.users.some((x) => x.email.toLowerCase() === data.email.trim().toLowerCase())) throw new Error("An account with this email already exists.");
    const u: User = { id: uid("cus"), name: data.name.trim(), email: data.email.trim().toLowerCase(), phone: data.phone.trim(), password: data.password, role: "customer", createdAt: now(), status: "active" };
    sessionRef.current = u.id; update((d) => ({ users: [...d.users, u], sessionUserId: u.id })); return u;
  };
  const signOut = () => update(() => ({ sessionUserId: null }));
  const requestReset = (email: string, role: "customer" | "admin") => {
    const u = db.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase() && x.role === role);
    if (!u) return null; const token = Math.random().toString(36).slice(2, 12);
    update((d) => ({ resetTokens: { ...d.resetTokens, [token]: u.id } })); return token;
  };
  const resetPassword = (token: string, password: string): User => {
    const id = db.resetTokens[token]; const u = db.users.find((x) => x.id === id);
    if (!u) throw new Error("This reset link is invalid or has expired.");
    update((d) => { const t = { ...d.resetTokens }; delete t[token]; return { users: d.users.map((x) => x.id === id ? { ...x, password } : x), resetTokens: t }; });
    return u;
  };
  const updateProfile = (patch: Partial<Pick<User, "name" | "phone" | "email">>) => user && update((d) => ({ users: d.users.map((x) => x.id === user.id ? { ...x, ...patch } : x) }));
  const changePassword = (current: string, next: string) => { if (!user || user.password !== current) throw new Error("Current password is incorrect."); update((d) => ({ users: d.users.map((x) => x.id === user.id ? { ...x, password: next } : x) })); };

  // ---------- Cart & wishlist (per customer) ----------
  const cart = user ? db.carts[user.id] ?? [] : [];
  const wishlist = user ? db.wishlists[user.id] ?? [] : [];
  const setCart = (fn: (c: CartItem[]) => CartItem[]) => { const id = sessionRef.current; if (id) update((d) => ({ carts: { ...d.carts, [id]: fn(d.carts[id] ?? []) } })); };
  const addToCart = (product: Product, size?: string, color?: string, quantity = 1, customization?: Customization) => {
    const s = size ?? product.sizes.at(0) ?? "M"; const c = color ?? product.colors.at(0) ?? "Obsidian";
    const key = customization ? uid("custom") : `${product.id}|${s}|${c}`;
    setCart((items) => { const f = items.find((i) => i.key === key); return f ? items.map((i) => i === f ? { ...i, quantity: i.quantity + quantity } : i) : [...items, { key, product, quantity, size: s, color: c, ...(customization ? { customization } : {}) }]; });
    toast.success(`${product.name} added to bag`);
  };
  const removeFromCart = (key: string) => setCart((items) => items.filter((i) => i.key !== key));
  const updateQuantity = (key: string, q: number) => setCart((items) => items.map((i) => i.key === key ? { ...i, quantity: Math.max(1, q) } : i));
  const toggleWishlist = (id: string, opts?: { onlyAdd?: boolean }) => {
    const uidNow = sessionRef.current; if (!uidNow) return; const has = (db.wishlists[uidNow] ?? []).includes(id);
    if (has && opts?.onlyAdd) return;
    update((d) => { const list = d.wishlists[uidNow] ?? []; return { wishlists: { ...d.wishlists, [uidNow]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id] } }; });
    toast(has ? "Removed from wishlist" : "Saved to wishlist");
  };

  // ---------- Orders & payments ----------
  const placeOrder = (input: { contact: Order["contact"]; delivery: Omit<Order["delivery"], "locationName">; }): Order => {
    if (!user) throw new Error("Please sign in."); if (!cart.length) throw new Error("Your bag is empty.");
    const loc = db.locations.find((l) => l.id === input.delivery.locationId && l.active); if (!loc) throw new Error("Choose an available delivery location.");
    const items = cart.map((i) => ({ productId: i.product.id, name: i.product.name, image: i.product.image, price: i.product.price, quantity: i.quantity, size: i.size, color: i.color, ...(i.customization ? { customization: i.customization } : {}) }));
    const subtotal = items.reduce((n, i) => n + i.price * i.quantity, 0); const vat = Math.round(subtotal * VAT_RATE);
    const n = 1000 + db.orders.length + 1; const id = `KH-${n}`; const payId = `PAY-${n}`;
    const order: Order = { id, customerId: user.id, date: now(), items, subtotal, vat, deliveryFee: loc.fee, total: subtotal + vat + loc.fee, contact: input.contact, delivery: { ...input.delivery, locationName: loc.name }, expectedDelivery: new Date(Date.now() + 5 * 864e5).toISOString(), status: "placed", paymentId: payId };
    const payment: Payment = { id: payId, orderId: id, customerId: user.id, amount: order.total, date: now(), status: "awaiting_receipt", notes: [] };
    update((d) => ({ orders: [order, ...d.orders], payments: [payment, ...d.payments] })); return order;
  };
  /** Receipt upload never confirms payment; it only moves it to pending verification and clears the bag. */
  const submitReceipt = (orderId: string, receipt: Receipt) => update((d) => {
    const o = d.orders.find((x) => x.id === orderId);
    return {
      payments: d.payments.map((p) => p.orderId === orderId ? { ...p, receipt, status: "pending_verification", date: now(), notes: [...p.notes, { at: now(), text: "Customer uploaded a receipt." }] } : p),
      orders: d.orders.map((x) => x.id === orderId ? { ...x, status: "payment_verification" } : x),
      carts: o ? { ...d.carts, [o.customerId]: [] } : d.carts,
    };
  });
  const paymentAction = (paymentId: string, action: "confirm" | "reject" | "resubmit", note?: string) => update((d) => {
    const pay = d.payments.find((p) => p.id === paymentId); if (!pay) return {};
    const status = action === "confirm" ? "paid" : action === "reject" ? "rejected" : "resubmit";
    const text = action === "confirm" ? "Payment confirmed by admin." : action === "reject" ? `Payment rejected${note ? `: ${note}` : "."}` : `New receipt requested${note ? `: ${note}` : "."}`;
    return {
      payments: d.payments.map((p) => p.id === paymentId ? { ...p, status, notes: [...p.notes, { at: now(), text }] } : p),
      orders: d.orders.map((o) => o.id === pay.orderId ? { ...o, status: action === "confirm" ? "payment_confirmed" : "payment_verification" } : o),
    };
  });
  const setOrderStatus = (orderId: string, status: OrderStatus) => update((d) => ({ orders: d.orders.map((o) => o.id === orderId ? { ...o, status } : o) }));

  // ---------- Catalogue admin ----------
  const saveProduct = (p: Product) => update((d) => ({ products: d.products.some((x) => x.id === p.id) ? d.products.map((x) => x.id === p.id ? p : x) : [p, ...d.products] }));
  const deleteProduct = (id: string) => update((d) => ({ products: d.products.filter((x) => x.id !== id) }));
  const saveCategory = (c: Category) => update((d) => {
    const old = d.categories.find((x) => x.id === c.id);
    return { categories: old ? d.categories.map((x) => x.id === c.id ? c : x) : [...d.categories, c], products: old && old.name !== c.name ? d.products.map((p) => p.category === old.name ? { ...p, category: c.name } : p) : d.products };
  });
  const deleteCategory = (id: string) => update((d) => ({ categories: d.categories.filter((x) => x.id !== id) }));
  const saveLocation = (l: DeliveryLocation) => update((d) => ({ locations: d.locations.some((x) => x.id === l.id) ? d.locations.map((x) => x.id === l.id ? l : x) : [...d.locations, l] }));
  const deleteLocation = (id: string) => update((d) => ({ locations: d.locations.filter((x) => x.id !== id) }));
  const setReviewStatus = (id: string, status: ReviewStatus) => update((d) => ({ reviews: d.reviews.map((r) => r.id === id ? { ...r, status } : r) }));
  const addReview = (r: Omit<Review, "id" | "date" | "status" | "customerId">) => user && update((d) => ({ reviews: [{ ...r, id: uid("rev"), customerId: user.id, date: now(), status: "pending" }, ...d.reviews] }));

  return {
    ...db, ready, user, cart, wishlist, uid,
    signIn, signUp, signOut, requestReset, resetPassword, updateProfile, changePassword,
    addToCart, removeFromCart, updateQuantity, toggleWishlist, clearCart: () => setCart(() => []),
    placeOrder, submitReceipt, paymentAction, setOrderStatus,
    saveProduct, deleteProduct, saveCategory, deleteCategory, saveLocation, deleteLocation, setReviewStatus, addReview,
  };
}
export type AppStore = ReturnType<typeof useAppValue>;
const Ctx = createContext<AppStore | null>(null);
export function AppProvider({ children }: { children: ReactNode }) { const v = useAppValue(); return <Ctx.Provider value={v}>{children}</Ctx.Provider>; }
export function useApp() { const v = useContext(Ctx); if (!v) throw new Error("AppProvider missing"); return v; }

export const savePending = (a: PendingAction) => { try { sessionStorage.setItem(PENDING, JSON.stringify(a)); } catch { /* ignore */ } };
export const takePending = (): PendingAction | null => { try { const r = sessionStorage.getItem(PENDING); sessionStorage.removeItem(PENDING); return r ? JSON.parse(r) : null; } catch { return null; } };
export const readFileAsDataUrl = (f: File) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(f); });
export const usePublicProducts = () => { const { products } = useApp(); return useMemo(() => products.filter((p) => p.status === "active"), [products]); };
export const useApprovedReviews = (productId?: string) => { const { reviews, users } = useApp(); return reviews.filter((r) => r.status === "approved" && (!productId || r.productId === productId)).map((r) => ({ ...r, author: users.find((u) => u.id === r.customerId)?.name ?? "KH client" })); };

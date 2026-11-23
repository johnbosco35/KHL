import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { api, ApiError, errorMessage, tokenStore, uploadIfDataUrl } from "@/lib/api";
import {
  defaultSettings,
  type CartItem,
  type Category,
  type Customization,
  type DeliveryLocation,
  type Order,
  type OrderStatus,
  type Payment,
  type Product,
  type Receipt,
  type Review,
  type ReviewStatus,
  type Role,
  type Settings,
  type SettingsKey,
  type User,
} from "@/lib/mock-data";

/**
 * App data layer backed by the KH Luxury API (src/lib/api.ts → server/).
 *
 * Every screen reads the same shared state from `useApp()`. Data actions show their own error toast
 * and resolve to `null` / `false` when they fail, so callers only branch on success. Auth actions
 * (signIn, signUp, resetPassword) throw instead, because the auth form displays the message itself.
 */
type DB = {
  products: Product[];
  categories: Category[];
  locations: DeliveryLocation[];
  reviews: Review[];
  users: User[];
  orders: Order[];
  payments: Payment[];
  cart: CartItem[];
  wishlist: string[];
  settings: Settings;
};
export type PendingAction =
  | {
      type: "cart";
      productId: string;
      size: string;
      color: string;
      quantity: number;
      returnTo: string;
    }
  | { type: "wishlist"; productId: string; returnTo: string }
  | { type: "navigate"; returnTo: string };

const PENDING = "kh-luxury-pending";
const empty: DB = {
  products: [],
  categories: [],
  locations: [],
  reviews: [],
  users: [],
  orders: [],
  payments: [],
  cart: [],
  wishlist: [],
  settings: defaultSettings,
};
const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

/** Loads everything the given account (or a guest) is allowed to see. */
async function loadFor(user: User | null): Promise<Partial<DB>> {
  const [p, c, l, r, s] = await Promise.all([
    api<{ products: Product[] }>("GET", "/products"),
    api<{ categories: Category[] }>("GET", "/categories"),
    api<{ locations: DeliveryLocation[] }>("GET", "/delivery-locations"),
    api<{ reviews: Review[] }>("GET", "/reviews"),
    api<{ settings: Settings }>("GET", "/settings"),
  ]);
  const base: Partial<DB> = {
    products: p.products,
    categories: c.categories,
    locations: l.locations,
    reviews: r.reviews,
    settings: s.settings,
    users: user ? [user] : [],
    orders: [],
    payments: [],
    cart: [],
    wishlist: [],
  };
  if (user?.role === "customer") {
    const [cart, wish, orders, payments, mine] = await Promise.all([
      api<{ cart: CartItem[] }>("GET", "/cart"),
      api<{ wishlist: string[] }>("GET", "/wishlist"),
      api<{ orders: Order[] }>("GET", "/orders"),
      api<{ payments: Payment[] }>("GET", "/payments"),
      api<{ reviews: Review[] }>("GET", "/reviews/mine"),
    ]);
    const own = new Set(mine.reviews.map((x) => x.id));
    return {
      ...base,
      cart: cart.cart,
      wishlist: wish.wishlist,
      orders: orders.orders,
      payments: payments.payments,
      reviews: [...mine.reviews, ...r.reviews.filter((x) => !own.has(x.id))],
    };
  }
  if (user?.role === "admin") {
    const [orders, payments, customers] = await Promise.all([
      api<{ orders: Order[] }>("GET", "/orders"),
      api<{ payments: Payment[] }>("GET", "/payments"),
      api<{ customers: User[] }>("GET", "/admin/customers"),
    ]);
    return {
      ...base,
      orders: orders.orders,
      payments: payments.payments,
      users: [user, ...customers.customers],
    };
  }
  return base;
}

const upsert = <T extends { id: string }>(list: T[], item: T, prepend = false) =>
  list.some((x) => x.id === item.id)
    ? list.map((x) => (x.id === item.id ? item : x))
    : prepend
      ? [item, ...list]
      : [...list, item];

function useAppValue() {
  const [db, setDb] = useState<DB>(empty);
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const userRef = useRef<User | null>(null);
  userRef.current = user;

  const update = useCallback((fn: (d: DB) => Partial<DB>) => setDb((d) => ({ ...d, ...fn(d) })), []);

  /** Re-fetches all data for the current session. */
  const refresh = useCallback(async (as: User | null = userRef.current) => {
    try {
      const data = await loadFor(as);
      setDb((d) => ({ ...d, ...data }));
      setLoadError(null);
    } catch (err) {
      setLoadError(errorMessage(err));
    }
  }, []);

  const endSession = useCallback(
    (as: User | null) => {
      tokenStore.set(null);
      userRef.current = null;
      setUser(null);
      setDb((d) => ({ ...d, cart: [], wishlist: [], orders: [], payments: [], users: [] }));
      return refresh(null).then(() => as);
    },
    [refresh],
  );

  // Restore the session (if any) and load initial data.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let me: User | null = null;
      if (tokenStore.get()) {
        try {
          me = (await api<{ user: User }>("GET", "/auth/me")).user;
        } catch (err) {
          if (err instanceof ApiError && err.status === 401) tokenStore.set(null);
        }
      }
      if (cancelled) return;
      userRef.current = me;
      setUser(me);
      await refresh(me);
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  /** Runs an API action; on failure shows a toast and returns `fallback`. */
  const run = useCallback(
    async <T,>(fn: () => Promise<T>, fallback: T): Promise<T> => {
      try {
        return await fn();
      } catch (err) {
        if (err instanceof ApiError && err.status === 401 && userRef.current) {
          toast.error("Your session has ended. Please sign in again.");
          await endSession(null);
        } else toast.error(errorMessage(err));
        return fallback;
      }
    },
    [endSession],
  );

  // ---------- Auth (these throw; the auth form shows the error) ----------
  const startSession = async (res: { user: User; token: string }) => {
    tokenStore.set(res.token);
    userRef.current = res.user;
    setUser(res.user);
    await refresh(res.user);
    return res.user;
  };
  const signIn = async (email: string, password: string, role: Role): Promise<User> =>
    startSession(await api("POST", "/auth/login", { email: email.trim(), password, role }));
  const signUp = async (data: { name: string; email: string; phone: string; password: string }) =>
    startSession(await api("POST", "/auth/register", data));
  const signOut = () => void endSession(null);
  /** Returns the reset token when the API exposes it (development only), otherwise null. */
  const requestReset = async (email: string, role: Role): Promise<string | null> => {
    const res = await api<{ devResetUrl?: string }>("POST", "/auth/forgot-password", {
      email: email.trim(),
      role,
    });
    return res.devResetUrl ? new URL(res.devResetUrl).searchParams.get("token") : null;
  };
  const resetPassword = async (token: string, password: string): Promise<User> =>
    (await api<{ user: User }>("POST", "/auth/reset-password", { token, password })).user;

  // ---------- Profile ----------
  const updateProfile = (patch: Partial<Pick<User, "name" | "phone" | "email">>) =>
    run(async () => {
      const { user: u } = await api<{ user: User }>("PATCH", "/auth/me", patch);
      userRef.current = u;
      setUser(u);
      update((d) => ({ users: upsert(d.users, u) }));
      return true;
    }, false);
  const changePassword = (currentPassword: string, newPassword: string) =>
    run(async () => {
      await api("POST", "/auth/me/password", { currentPassword, newPassword });
      return true;
    }, false);

  // ---------- Bag & wishlist ----------
  const addToCart = (
    product: Product,
    size?: string,
    color?: string,
    quantity = 1,
    customization?: Customization,
  ) =>
    run(async () => {
      const { cart } = await api<{ cart: CartItem[] }>("POST", "/cart", {
        productId: product.id,
        size,
        color,
        quantity,
        ...(customization ? { customization } : {}),
      });
      update(() => ({ cart }));
      toast.success(`${product.name} added to bag`);
      return true;
    }, false);
  const removeFromCart = (key: string) =>
    run(async () => {
      const { cart } = await api<{ cart: CartItem[] }>(
        "DELETE",
        `/cart/${encodeURIComponent(key)}`,
      );
      update(() => ({ cart }));
      return true;
    }, false);
  const updateQuantity = (key: string, q: number) =>
    run(async () => {
      const { cart } = await api<{ cart: CartItem[] }>(
        "PATCH",
        `/cart/${encodeURIComponent(key)}`,
        { quantity: Math.min(99, Math.max(1, q)) },
      );
      update(() => ({ cart }));
      return true;
    }, false);
  const clearCart = () =>
    run(async () => {
      const { cart } = await api<{ cart: CartItem[] }>("DELETE", "/cart");
      update(() => ({ cart }));
      return true;
    }, false);
  const toggleWishlist = (id: string, opts?: { onlyAdd?: boolean }) =>
    run(async () => {
      const has = db.wishlist.includes(id);
      if (has && opts?.onlyAdd) return true;
      const { wishlist } = await api<{ wishlist: string[] }>(
        has ? "DELETE" : "PUT",
        `/wishlist/${encodeURIComponent(id)}`,
      );
      update(() => ({ wishlist }));
      toast(has ? "Removed from wishlist" : "Saved to wishlist");
      return true;
    }, false);

  // ---------- Orders & payments ----------
  const placeOrder = (input: {
    contact: Order["contact"];
    delivery: Omit<Order["delivery"], "locationName">;
  }) =>
    run(async () => {
      const { order, payment } = await api<{ order: Order; payment: Payment }>(
        "POST",
        "/orders",
        input,
      );
      update((d) => ({
        orders: upsert(d.orders, order, true),
        payments: upsert(d.payments, payment, true),
      }));
      // Stock changed — refresh the catalogue quietly.
      void api<{ products: Product[] }>("GET", "/products")
        .then(({ products }) => update(() => ({ products })))
        .catch(() => undefined);
      return order;
    }, null as Order | null);
  /** Receipt upload never confirms payment; it only moves it to pending verification and clears the bag. */
  const submitReceipt = (orderId: string, receipt: Omit<Receipt, "uploadedAt">) =>
    run(async () => {
      const res = await api<{ order: Order; payment: Payment }>(
        "POST",
        `/orders/${encodeURIComponent(orderId)}/receipt`,
        receipt,
      );
      update((d) => ({
        orders: upsert(d.orders, res.order, true),
        payments: upsert(d.payments, res.payment, true),
        cart: [],
      }));
      return true;
    }, false);
  const paymentAction = (
    paymentId: string,
    action: "confirm" | "reject" | "resubmit",
    note?: string,
  ) =>
    run(async () => {
      const res = await api<{ order: Order; payment: Payment }>(
        "POST",
        `/payments/${encodeURIComponent(paymentId)}/actions`,
        { action, ...(note ? { note } : {}) },
      );
      update((d) => ({
        orders: upsert(d.orders, res.order),
        payments: upsert(d.payments, res.payment),
      }));
      return true;
    }, false);
  const setOrderStatus = (orderId: string, status: OrderStatus) =>
    run(async () => {
      const { order } = await api<{ order: Order }>(
        "PATCH",
        `/orders/${encodeURIComponent(orderId)}/status`,
        { status },
      );
      update((d) => ({ orders: upsert(d.orders, order) }));
      return true;
    }, false);

  // ---------- Catalogue admin ----------
  const saveProduct = (p: Product) =>
    run(async () => {
      const images: string[] = [];
      for (const img of p.images) images.push(await uploadIfDataUrl(img, "products"));
      const image = await uploadIfDataUrl(p.image, "products");
      const exists = db.products.some((x) => x.id === p.id);
      const { createdAt: _c, ...body } = { ...p, image, images };
      const { product } = await api<{ product: Product }>(
        exists ? "PUT" : "POST",
        exists ? `/products/${encodeURIComponent(p.id)}` : "/products",
        body,
      );
      update((d) => ({ products: upsert(d.products, product, true) }));
      return product;
    }, null as Product | null);
  const deleteProduct = (id: string) =>
    run(async () => {
      await api("DELETE", `/products/${encodeURIComponent(id)}`);
      update((d) => ({ products: d.products.filter((x) => x.id !== id) }));
      return true;
    }, false);
  const saveCategory = (c: Category) =>
    run(async () => {
      const old = db.categories.find((x) => x.id === c.id);
      const image = c.image ? await uploadIfDataUrl(c.image, "categories") : null;
      const { category } = await api<{ category: Category }>(
        old ? "PUT" : "POST",
        old ? `/categories/${encodeURIComponent(c.id)}` : "/categories",
        { ...c, image },
      );
      update((d) => ({ categories: upsert(d.categories, category) }));
      if (old && old.name !== category.name) await refresh(); // products were renamed too
      return true;
    }, false);
  const deleteCategory = (id: string) =>
    run(async () => {
      await api("DELETE", `/categories/${encodeURIComponent(id)}`);
      update((d) => ({ categories: d.categories.filter((x) => x.id !== id) }));
      return true;
    }, false);
  const saveLocation = (l: DeliveryLocation) =>
    run(async () => {
      const exists = db.locations.some((x) => x.id === l.id);
      const { location } = await api<{ location: DeliveryLocation }>(
        exists ? "PUT" : "POST",
        exists ? `/delivery-locations/${encodeURIComponent(l.id)}` : "/delivery-locations",
        l,
      );
      update((d) => ({ locations: upsert(d.locations, location) }));
      return true;
    }, false);
  const deleteLocation = (id: string) =>
    run(async () => {
      await api("DELETE", `/delivery-locations/${encodeURIComponent(id)}`);
      update((d) => ({ locations: d.locations.filter((x) => x.id !== id) }));
      return true;
    }, false);

  // ---------- Reviews ----------
  const setReviewStatus = (id: string, status: ReviewStatus) =>
    run(async () => {
      const { review } = await api<{ review: Review }>(
        "PATCH",
        `/reviews/${encodeURIComponent(id)}/status`,
        { status },
      );
      update((d) => ({ reviews: upsert(d.reviews, review) }));
      return true;
    }, false);
  const addReview = (r: { productId: string; rating: number; text: string; image?: string }) =>
    run(async () => {
      const image = r.image ? await uploadIfDataUrl(r.image, "reviews") : undefined;
      const { review } = await api<{ review: Review }>("POST", "/reviews", {
        ...r,
        ...(image ? { image } : {}),
      });
      update((d) => ({ reviews: upsert(d.reviews, review, true) }));
      return true;
    }, false);

  // ---------- Settings & newsletter ----------
  const saveSettings = <K extends SettingsKey>(key: K, value: Partial<Settings[K]>) =>
    run(async () => {
      const { settings } = await api<{ settings: Settings[K] }>("PUT", `/settings/${key}`, value);
      update((d) => ({ settings: { ...d.settings, [key]: settings } }));
      return true;
    }, false);
  const subscribe = (email: string) =>
    run(async () => {
      await api("POST", "/newsletter", { email });
      return true;
    }, false);

  return {
    ...db,
    ready,
    loadError,
    user,
    uid,
    refresh,
    signIn,
    signUp,
    signOut,
    requestReset,
    resetPassword,
    updateProfile,
    changePassword,
    addToCart,
    removeFromCart,
    updateQuantity,
    toggleWishlist,
    clearCart,
    placeOrder,
    submitReceipt,
    paymentAction,
    setOrderStatus,
    saveProduct,
    deleteProduct,
    saveCategory,
    deleteCategory,
    saveLocation,
    deleteLocation,
    setReviewStatus,
    addReview,
    saveSettings,
    subscribe,
  };
}
export type AppStore = ReturnType<typeof useAppValue>;
const Ctx = createContext<AppStore | null>(null);
export function AppProvider({ children }: { children: ReactNode }) {
  const v = useAppValue();
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}
export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("AppProvider missing");
  return v;
}

export const savePending = (a: PendingAction) => {
  try {
    sessionStorage.setItem(PENDING, JSON.stringify(a));
  } catch {
    /* ignore */
  }
};
export const takePending = (): PendingAction | null => {
  try {
    const r = sessionStorage.getItem(PENDING);
    sessionStorage.removeItem(PENDING);
    return r ? JSON.parse(r) : null;
  } catch {
    return null;
  }
};
export const readFileAsDataUrl = (f: File) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = rej;
    r.readAsDataURL(f);
  });
export const usePublicProducts = () => {
  const { products } = useApp();
  return useMemo(() => products.filter((p) => p.status === "active"), [products]);
};
export const useApprovedReviews = (productId?: string) => {
  const { reviews } = useApp();
  return useMemo(
    () =>
      reviews.filter((r) => r.status === "approved" && (!productId || r.productId === productId)),
    [reviews, productId],
  );
};

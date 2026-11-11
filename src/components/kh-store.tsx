import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Heart,
  Menu,
  Search,
  ShoppingBag,
  UserRound,
  MessageCircle,
  ArrowRight,
  Minus,
  Plus,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/new logo.jpeg";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Customization, Product } from "@/lib/mock-data";
import { formatPrice } from "@/lib/mock-data";
import { AppProvider, savePending, useApp, type PendingAction } from "@/lib/app-store";
import { cn } from "@/lib/utils";
import { Tilt } from "@/components/kh-3d";

export const StoreProvider = AppProvider;

/** Customer actions that require a signed-in customer. Guests are sent to sign in and the action resumes afterwards. */
export function useStore() {
  const app = useApp();
  const navigate = useNavigate();
  const { pathname, search, hash } = useLocation();
  const path = `${pathname}${search}${hash}`;
  const gate = (action: PendingAction): boolean => {
    if (!app.user) {
      savePending(action);
      toast("Please create an account or sign in to continue.");
      navigate(`/login?redirect=${encodeURIComponent(action.returnTo)}`);
      return false;
    }
    if (app.user.role !== "customer") {
      toast.error("Admin accounts cannot shop. Sign in with a customer account.");
      return false;
    }
    return true;
  };
  return {
    cart: app.cart,
    wishlist: app.wishlist,
    user: app.user,
    addToCart: (
      product: Product,
      size?: string,
      color?: string,
      quantity = 1,
      customization?: Customization,
    ) => {
      if (product.stock <= 0) {
        toast.error("This piece is currently sold out.");
        return;
      }
      if (
        gate({
          type: "cart",
          productId: product.id,
          size: size ?? product.sizes.at(0) ?? "M",
          color: color ?? product.colors.at(0) ?? "Obsidian",
          quantity,
          returnTo: path,
        })
      )
        app.addToCart(product, size, color, quantity, customization);
    },
    toggleWishlist: (id: string) => {
      if (gate({ type: "wishlist", productId: id, returnTo: path })) app.toggleWishlist(id);
    },
    requireCustomer: (returnTo = path) => gate({ type: "navigate", returnTo }),
    removeFromCart: app.removeFromCart,
    updateQuantity: app.updateQuantity,
  };
}

const nav = [
  ["Home", "/"],
  ["Shop", "/shop"],
  ["Collections", "/collections"],
  ["Customize", "/customize"],
  ["About", "/about"],
] as const;
export function Logo({
  inverse = false,
  compact = false,
}: {
  inverse?: boolean;
  compact?: boolean;
}) {
  return (
    <span className={cn("relative block overflow-hidden", compact ? "h-10 w-16" : "h-12 w-24")}>
      <img
        src={logo}
        alt="KH Luxury"
        className={cn(
          "absolute inset-0 h-full w-full scale-[1.7] object-contain mix-blend-multiply",
          inverse && "invert mix-blend-screen",
        )}
      />
    </span>
  );
}

function AccountMenu() {
  const { user, signOut } = useApp();
  const navigate = useNavigate();
  if (!user)
    return (
      <Link to="/login" aria-label="Sign in" className="icon-link">
        <UserRound />
      </Link>
    );
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button aria-label="Account menu" className="icon-link">
          <UserRound className="text-luxury" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user.role === "admin" ? (
          <DropdownMenuItem onClick={() => navigate("/admin/dashboard")}>
            Admin dashboard
          </DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuItem onClick={() => navigate("/account")}>My account</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/account/orders")}>
              My orders
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            signOut();
            toast("You have been signed out");
            navigate("/", { replace: true });
          }}
        >
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Fades + lifts its children into view the first time they scroll on screen. */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "article";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag
      ref={ref}
      className={cn("reveal", shown && "is-visible", className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}

function useScrolled(offset = 24) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > offset);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [offset]);
  return scrolled;
}

const announcements = [
  "Complimentary delivery in Lagos on orders over ₦150,000",
  "Made in Lagos · Crafted in small batches",
  "Bespoke tees — make it unmistakably yours",
  "Concierge on WhatsApp · +234 810 023 4233",
];

export function SiteHeader() {
  const { pathname: path } = useLocation();
  const { cart, wishlist, user } = useApp();
  const scrolled = useScrolled();
  return (
    <>
      <div className="overflow-hidden bg-primary py-2.5 text-[10px] uppercase tracking-[0.24em] text-primary-foreground/85">
        <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
          {[...announcements, ...announcements].map((a, i) => (
            <span key={i} className="flex items-center gap-10 px-5 whitespace-nowrap">
              {a}
              <span className="text-luxury">✦</span>
            </span>
          ))}
        </div>
      </div>
      <header
        className={cn(
          "sticky top-0 z-40 border-b transition-all duration-500",
          scrolled
            ? "border-border/70 bg-background/90 shadow-[0_8px_30px_-18px_rgba(0,0,0,.35)] backdrop-blur-xl"
            : "border-transparent bg-background",
        )}
      >
        <div
          className={cn(
            "mx-auto grid max-w-[1440px] grid-cols-[auto_1fr_auto] items-center gap-4 px-4 transition-[height] duration-500 sm:px-8",
            scrolled ? "h-16" : "h-20",
          )}
        >
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full max-w-sm">
              <SheetHeader>
                <SheetTitle>
                  <Logo />
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-12 grid gap-1">
                {nav.map(([label, to]) => (
                  <Link key={to} to={to} className="border-b py-4 font-display text-2xl">
                    {label}
                  </Link>
                ))}
                <Link
                  to={user ? "/account" : "/login"}
                  className="border-b py-4 font-display text-2xl"
                >
                  {user ? "My account" : "Sign in"}
                </Link>
              </nav>
              <Link to="/contact" className="mt-10 flex items-center gap-2 text-sm">
                <MessageCircle className="size-4 text-luxury" /> WhatsApp concierge
              </Link>
            </SheetContent>
          </Sheet>
          <Link to="/" className="justify-self-center lg:justify-self-start">
            <Logo />
          </Link>
          <nav className="hidden items-center justify-center gap-8 lg:flex">
            {nav.map(([label, to]) => (
              <Link
                key={to}
                to={to}
                data-active={path === to}
                className={cn(
                  "link-underline text-[11px] font-medium uppercase tracking-[0.2em] transition-colors hover:text-luxury",
                  path === to && "text-luxury",
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center justify-end gap-1">
            <Link to="/shop" aria-label="Search" className="icon-link">
              <Search />
            </Link>
            <Link to="/wishlist" aria-label="Wishlist" className="icon-link relative">
              <Heart />
              <Count value={wishlist.length} />
            </Link>
            <CartDrawer>
              <span className="icon-link relative">
                <ShoppingBag />
                <Count value={cart.reduce((n, i) => n + i.quantity, 0)} />
              </span>
            </CartDrawer>
            <AccountMenu />
          </div>
        </div>
      </header>
    </>
  );
}
function Count({ value }: { value: number }) {
  return value ? (
    <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-luxury text-[9px] font-bold text-primary">
      {value}
    </span>
  ) : null;
}

export function CartDrawer({ children }: { children: ReactNode }) {
  const { cart, removeFromCart, updateQuantity } = useApp();
  const subtotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button aria-label="Open shopping bag">{children}</button>
      </SheetTrigger>
      <SheetContent className="flex w-full max-w-md flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-3xl font-normal">Your Bag</SheetTitle>
        </SheetHeader>
        <div className="mt-6 flex-1 space-y-6 overflow-auto">
          {cart.length === 0 ? (
            <EmptyState
              title="Your bag is empty"
              text="Explore the latest KH Luxury pieces."
              link="/shop"
              action="Shop collection"
            />
          ) : (
            cart.map(({ key, product, quantity, size, color, customization }) => (
              <div key={key} className="grid grid-cols-[88px_1fr] gap-4 border-b pb-6">
                <img
                  src={product.image}
                  alt={product.name}
                  className="aspect-[3/4] w-full object-cover"
                />
                <div className="min-w-0">
                  <p className="font-display text-lg">{product.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {color} / {size}
                    {customization ? " · Custom" : ""}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <Quantity value={quantity} onChange={(v) => updateQuantity(key, v)} />
                    <span className="text-sm">{formatPrice(product.price * quantity)}</span>
                  </div>
                  <Button
                    variant="link"
                    className="mt-2 h-auto p-0 text-xs text-muted-foreground"
                    onClick={() => removeFromCart(key)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
        {cart.length > 0 && (
          <div className="border-t pt-5">
            <div className="mb-5 flex justify-between">
              <span>Subtotal</span>
              <strong>{formatPrice(subtotal)}</strong>
            </div>
            <Button asChild size="lg" className="w-full">
              <Link to="/checkout">
                Proceed to checkout <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="mt-2 w-full">
              <Link to="/cart">View bag</Link>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const liked = wishlist.includes(product.id);
  const soldOut = product.stock <= 0;
  const alt = product.images?.find((i) => i !== product.image);
  return (
    <article className="group min-w-0">
      <Tilt className="shadow-[0_20px_40px_-28px_rgba(0,0,0,.45)] group-hover:shadow-[0_35px_60px_-30px_rgba(0,0,0,.55)]">
        <div className="relative overflow-hidden bg-secondary">
          <Link to={`/product/${product.id}`} className="block">
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              className={cn(
                "aspect-[3/4] w-full object-cover transition-all duration-[1200ms] ease-out group-hover:scale-[1.05]",
                alt && "group-hover:opacity-0",
                soldOut && "grayscale-[.6]",
              )}
            />
            {alt && (
              <img
                src={alt}
                alt=""
                aria-hidden
                loading="lazy"
                className="absolute inset-0 h-full w-full scale-[1.05] object-cover opacity-0 transition-all duration-[1200ms] ease-out group-hover:scale-100 group-hover:opacity-100"
              />
            )}
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/45 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          </Link>
          <button
            className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-background/85 shadow-sm backdrop-blur transition-all duration-300 hover:scale-110 hover:bg-background"
            aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
            onClick={() => toggleWishlist(product.id)}
          >
            <Heart className={cn("size-4 transition-colors", liked && "fill-luxury text-luxury")} />
          </button>
          <div className="absolute inset-x-3 bottom-3 grid translate-y-4 grid-cols-2 gap-2 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 max-md:hidden">
            <Button asChild variant="secondary" className="bg-background/90 backdrop-blur">
              <Link to={`/product/${product.id}`}>View</Link>
            </Button>
            <Button disabled={soldOut} onClick={() => addToCart(product)}>
              {soldOut ? "Sold out" : "Add to bag"}
            </Button>
          </div>
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {product.newArrival && (
              <span className="bg-background/90 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[.2em] backdrop-blur">
                New
              </span>
            )}
            {soldOut ? (
              <span className="bg-primary px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[.2em] text-primary-foreground">
                Sold out
              </span>
            ) : product.stock <= 5 ? (
              <span className="bg-luxury px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[.2em] text-primary">
                Only {product.stock} left
              </span>
            ) : null}
          </div>
        </div>
      </Tilt>
      <div className="pt-4">
        <p className="text-[10px] uppercase tracking-[.2em] text-muted-foreground">
          {product.category}
        </p>
        <div className="mt-1.5 grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2">
          <Link
            to={`/product/${product.id}`}
            className="min-w-0 truncate font-display text-xl transition-colors hover:text-luxury"
          >
            {product.name}
          </Link>
          <span className="shrink-0 text-sm font-medium tracking-wide">
            {formatPrice(product.price)}
          </span>
        </div>
        <div className="mt-2 flex gap-1.5">
          {product.colors.map((c) => (
            <span
              key={c}
              title={c}
              className={cn(
                "size-3 rounded-full border border-border",
                c === "Obsidian" && "bg-primary",
                c === "Ivory" && "bg-background",
                c === "Espresso" && "bg-deep",
                c === "Sand" && "bg-secondary",
              )}
            />
          ))}
        </div>
      </div>
    </article>
  );
}

export function Quantity({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="grid h-9 grid-cols-3 items-center border">
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={() => onChange(value - 1)}
        aria-label="Decrease"
      >
        <Minus />
      </Button>
      <span className="text-center text-sm">{value}</span>
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={() => onChange(value + 1)}
        aria-label="Increase"
      >
        <Plus />
      </Button>
    </div>
  );
}

export function EmptyState({
  title,
  text,
  link,
  action,
}: {
  title: string;
  text: string;
  link?: string;
  action?: string;
}) {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <ShoppingBag className="mx-auto size-8 text-luxury" />
      <h2 className="mt-5 font-display text-3xl">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
      {link && action && (
        <Button asChild className="mt-6">
          <Link to={link}>{action}</Link>
        </Button>
      )}
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-[1440px] items-end gap-8 border-b border-primary-foreground/10 px-6 py-14 md:grid-cols-2 md:px-10">
        <div>
          <p className="eyebrow">The private list</p>
          <h3 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
            First to know. <span className="italic text-luxury">First to wear.</span>
          </h3>
        </div>
        <form
          className="flex border-b border-primary-foreground/30 transition-colors focus-within:border-luxury"
          onSubmit={(e) => {
            e.preventDefault();
            (e.currentTarget as HTMLFormElement).reset();
            toast.success("Welcome to the KH Luxury private list");
          }}
        >
          <input
            type="email"
            required
            placeholder="Your email address"
            aria-label="Email address"
            className="h-14 flex-1 bg-transparent text-sm placeholder:text-primary-foreground/40 focus:outline-none"
          />
          <button
            type="submit"
            className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.2em] text-luxury transition-colors hover:text-primary-foreground"
          >
            Subscribe <ArrowRight className="size-4" />
          </button>
        </form>
      </div>
      <div className="mx-auto grid max-w-[1440px] gap-12 px-6 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-10">
        <div>
          <Logo inverse />
          <p className="mt-6 font-display text-2xl italic tracking-wide text-luxury">
            Wear your personality.
          </p>
          <p className="mt-5 max-w-xs text-sm leading-6 text-primary-foreground/60">
            Modern African luxury, shaped with confidence and made for a considered life.
          </p>
        </div>
        <FooterList
          title="Explore"
          items={[
            ["Shop", "/shop"],
            ["Collections", "/collections"],
            ["Customize", "/customize"],
          ]}
        />
        <FooterList
          title="Company"
          items={[
            ["About", "/about"],
            ["Contact", "/contact"],
            ["Admin", "/admin/login"],
          ]}
        />
        <div>
          <p className="text-xs uppercase tracking-[.18em] text-luxury">Concierge</p>
          <p className="mt-4 text-sm text-primary-foreground/60">
            WhatsApp
            <br />
            +2348100234233
          </p>
          <div className="mt-5 flex gap-4 text-xs uppercase tracking-wider">
            <a
              href="https://www.instagram.com/kh_luxury.ltd?psln=NWl4d3dlOHNicGty&utm_source=qr"
              target="_blank"
              rel="noreferrer"
            >
              <span>Instagram</span>
            </a>
            <a
              href="https://www.tiktok.com/@kh_luxury?_r=1&_t=ZS-9B1LR5Fwc7B"
              target="_blank"
              rel="noreferrer"
            >
              <span>TikTok</span>
            </a>
          </div>
        </div>
      </div>
      <p
        aria-hidden
        className="pointer-events-none select-none px-4 text-center font-display text-[22vw] leading-[.8] tracking-tight text-primary-foreground/[.04] md:text-[16vw]"
      >
        KH LUXURY
      </p>
      <div className="relative border-t border-primary-foreground/10 px-6 py-5 text-center text-[10px] uppercase tracking-[.2em] text-primary-foreground/45">
        © {new Date().getFullYear()} KH Luxury ·{" "}
        <Link to="/terms" className="hover:text-luxury">
          Terms
        </Link>{" "}
        ·{" "}
        <Link to="/privacy" className="hover:text-luxury">
          Privacy
        </Link>
      </div>
    </footer>
  );
}
function FooterList({
  title,
  items,
}: {
  title: string;
  items: readonly (readonly [string, string])[];
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[.18em] text-luxury">{title}</p>
      <div className="mt-4 grid gap-3">
        {items.map(([label, to]) => (
          <Link
            key={to}
            to={to}
            className="text-sm text-primary-foreground/60 hover:text-primary-foreground"
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/+2348100234233"
      target="_blank"
      rel="noreferrer"
      aria-label="Contact KH Luxury on WhatsApp"
      className="group fixed bottom-5 right-5 z-40 flex h-12 items-center gap-0 rounded-full bg-primary pl-3.5 pr-3.5 text-primary-foreground shadow-[0_10px_30px_-10px_rgba(0,0,0,.5)] ring-1 ring-luxury/40 transition-all duration-500 hover:-translate-y-1 hover:gap-2 hover:pr-5"
    >
      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-luxury/20 [animation-duration:3s]" />
      <MessageCircle className="size-5 text-luxury" />
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-[10px] font-semibold uppercase tracking-[.2em] transition-all duration-500 group-hover:max-w-40">
        Concierge
      </span>
    </a>
  );
}

import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Filter,
  Heart,
  Loader2,
  MapPin,
  Package,
  Search,
  ShieldCheck,
  Star,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import hero from "@/assets/kh-hero.jpg";
import editorial1 from "@/assets/kh-editorial-1.jpg";
import editorial2 from "@/assets/kh-editorial-2.jpg";
import editorial3 from "@/assets/kh-editorial-3.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ProductCard, EmptyState, Logo, Quantity, Reveal, useStore } from "@/components/kh-store";
import { Carousel3D, Tilt, useParallax } from "@/components/kh-3d";
import { RequireAuth } from "@/components/kh-auth";
import {
  readFileAsDataUrl,
  useApp,
  useApprovedReviews,
  usePublicProducts,
} from "@/lib/app-store";
import {
  formatDate,
  formatPrice,
  ORDER_STEP_LABELS,
  ORDER_STEPS,
  PAYMENT_LABELS,
  shopCategories,
  VAT_RATE,
  whatsappLink,
  type Order,
  type Payment,
  type Product,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const MAX_UPLOAD = 8 * 1024 * 1024;
/** Reads a user-chosen file as a data URL after checking its size and type. */
async function readUpload(file: File, accept: "image" | "image-or-pdf"): Promise<string | null> {
  const okType =
    file.type.startsWith("image/") || (accept === "image-or-pdf" && file.type === "application/pdf");
  if (!okType) {
    toast.error(accept === "image" ? "Please choose an image." : "Please choose an image or PDF.");
    return null;
  }
  if (file.size > MAX_UPLOAD) {
    toast.error("File is too large (max 8 MB).");
    return null;
  }
  return readFileAsDataUrl(file);
}

function Loading() {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <Loader2 className="size-5 animate-spin text-luxury" />
    </div>
  );
}

export function PageIntro({
  eyebrow,
  title,
  text,
}: {
  eyebrow?: string;
  title: string;
  text?: string;
}) {
  return (
    <div className="mx-auto max-w-[1440px] px-5 pb-10 pt-16 sm:px-8 sm:pt-24">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-3 max-w-4xl font-display text-5xl leading-[.98] sm:text-7xl">{title}</h1>
      {text && (
        <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
          {text}
        </p>
      )}
    </div>
  );
}
export function SectionTitle({
  eyebrow,
  title,
  link,
}: {
  eyebrow: string;
  title: string;
  link?: string;
}) {
  return (
    <div className="mb-8 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
      <div className="min-w-0">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-2 font-display text-4xl sm:text-5xl">{title}</h2>
      </div>
      {link && (
        <Button asChild variant="link" className="shrink-0">
          <Link to={link}>
            View all <ArrowRight />
          </Link>
        </Button>
      )}
    </div>
  );
}

/** Slowly spinning 3D gold coin with an orbiting text ring. */
function Medallion() {
  return (
    <div className="relative size-56 [perspective:900px] xl:size-64">
      <svg
        viewBox="0 0 200 200"
        className="absolute -inset-8 h-[calc(100%+4rem)] w-[calc(100%+4rem)] animate-[spin_28s_linear_infinite] text-luxury/80"
        aria-hidden
      >
        <defs>
          <path id="kh-orbit" d="M100,100 m-88,0 a88,88 0 1,1 176,0 a88,88 0 1,1 -176,0" />
        </defs>
        <text className="fill-current text-[10px] uppercase tracking-[.42em]">
          <textPath href="#kh-orbit">Wear your personality ✦ Made in Lagos ✦ KH Luxury ✦</textPath>
        </text>
      </svg>
      <div className="relative h-full w-full animate-coin [transform-style:preserve-3d]">
        {[0, 180].map((r) => (
          <div
            key={r}
            className="absolute inset-0 grid place-items-center rounded-full border border-white/30 [backface-visibility:hidden] shadow-[inset_0_0_30px_rgba(0,0,0,.35),0_30px_60px_-20px_rgba(0,0,0,.7)]"
            style={{
              transform: `rotateY(${r}deg) translateZ(6px)`,
              background:
                "radial-gradient(circle at 30% 25%, oklch(.9 .07 88), oklch(.7 .08 80) 45%, oklch(.45 .06 65) 100%)",
            }}
          >
            <div className="grid size-[78%] place-items-center rounded-full border border-black/15 shadow-[inset_0_2px_8px_rgba(255,255,255,.5),inset_0_-4px_10px_rgba(0,0,0,.25)]">
              <div className="text-center text-primary">
                <p className="font-display text-6xl leading-none tracking-tight xl:text-7xl">KH</p>
                <p className="mt-1 text-[9px] font-semibold uppercase tracking-[.4em]">
                  {r ? "Lagos" : "Luxury"}
                </p>
              </div>
            </div>
          </div>
        ))}
        {/* coin edge */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="absolute inset-0 rounded-full"
            style={{
              transform: `translateZ(${i * 2 - 5}px)`,
              background: "oklch(.5 .06 70)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

const fallbackQuotes = [
  {
    text: "The quality is immediate—the weight, the fit, the restraint. It feels considered.",
    author: "Adaeze N.",
    rating: 5,
  },
  {
    text: "My jacket arrived beautifully presented and fits like it was made for me.",
    author: "Michael O.",
    rating: 5,
  },
  {
    text: "The custom tee process was effortless. The result feels truly personal.",
    author: "Temi A.",
    rating: 5,
  },
];

export function HomePage() {
  const heroRef = useParallax<HTMLElement>();
  const products = usePublicProducts();
  const reviews = useApprovedReviews();
  const fresh = products.filter((p) => p.newArrival);
  const newArrivals = (fresh.length ? fresh : products).slice(0, 4);
  const featured = products.filter((p) => p.featured && !newArrivals.includes(p));
  const bestSellers = (featured.length ? featured : products.slice(4)).slice(0, 4);
  const quotes = reviews.filter((r) => r.rating >= 4).slice(0, 3);
  const testimonials = quotes.length
    ? quotes.map((r) => ({ text: r.text, author: r.author ?? "KH client", rating: r.rating }))
    : fallbackQuotes;
  return (
    <main>
      <section
        ref={heroRef}
        className="grain relative min-h-[calc(100svh-7rem)] overflow-hidden bg-primary [perspective:1200px]"
      >
        <div
          data-depth="24"
          className="absolute -inset-10 transition-transform duration-700 ease-out"
        >
          <img
            src={hero}
            alt="KH Luxury campaign"
            width={1536}
            height={1024}
            className="h-full w-full animate-slow-zoom object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-transparent to-primary/20" />
        <div className="relative mx-auto flex min-h-[calc(100svh-7rem)] max-w-[1440px] items-end px-6 pb-20 pt-36 sm:px-10 sm:pb-28">
          <div
            data-depth="-14"
            className="max-w-2xl text-primary-foreground transition-transform duration-700 ease-out [transform-style:preserve-3d]"
          >
            <p className="mb-6 flex animate-fade-up items-center gap-4 text-[11px] uppercase tracking-[.3em] text-luxury">
              <span className="gold-rule" /> The Foundational Collection
            </p>
            <h1 className="animate-fade-up font-display text-6xl leading-[.9] delay-1 sm:text-8xl lg:text-[8.5rem]">
              Quiet power.
              <br />
              <span className="italic text-gold-gradient">Distinctly yours.</span>
            </h1>
            <p className="mt-8 max-w-md animate-fade-up text-sm leading-7 text-primary-foreground/75 delay-2 sm:text-base">
              Modern African luxury composed with intention—for those who move with confidence, not
              noise.
            </p>
            <div className="mt-10 flex animate-fade-up flex-wrap gap-3 delay-3">
              <Button
                asChild
                size="lg"
                className="bg-background text-foreground hover:bg-background/90"
              >
                <Link to="/shop">
                  Shop collection <ArrowRight />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              >
                <Link to="/about">Our story</Link>
              </Button>
            </div>
          </div>
          <div
            data-depth="40"
            className="absolute right-[8%] top-1/2 hidden -translate-y-1/2 transition-transform duration-700 ease-out lg:block"
          >
            <Medallion />
          </div>
          <div className="absolute bottom-8 right-6 hidden animate-fade items-center gap-4 text-[10px] uppercase tracking-[.3em] text-primary-foreground/60 delay-4 sm:right-10 md:flex">
            Scroll
            <span className="relative block h-14 w-px overflow-hidden bg-primary-foreground/15">
              <span className="absolute inset-0 animate-scroll-cue bg-luxury" />
            </span>
          </div>
        </div>
      </section>
      <section className="border-b bg-background">
        <div className="mx-auto grid max-w-[1440px] grid-cols-2 divide-border md:grid-cols-4 md:divide-x">
          {[
            [Package, "Made in Lagos", "Small-batch atelier craft"],
            [ShieldCheck, "Secure checkout", "Verified bank transfer"],
            [Star, "Bespoke pieces", "Customise your signature tee"],
            [MapPin, "Lagos delivery", "Complimentary over ₦150k"],
          ].map(([Icon, title, text], i) => {
            const I = Icon as typeof Package;
            return (
              <Reveal
                key={String(title)}
                delay={i * 90}
                className="flex items-center gap-4 px-5 py-7 sm:px-8"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-full border border-luxury/40 text-luxury">
                  <I className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[.16em]">
                    {String(title)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{String(text)}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>
      <section className="section">
        <Reveal>
          <SectionTitle eyebrow="The edit" title="New arrivals" link="/shop" />
        </Reveal>
        <div className="product-grid">
          {newArrivals.map((p, i) => (
            <Reveal key={p.id} delay={i * 110}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </section>
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-secondary/70 to-background py-20 sm:py-28">
        <Reveal className="mx-auto max-w-2xl px-6 text-center">
          <p className="eyebrow">The collection in the round</p>
          <h2 className="mt-3 font-display text-4xl sm:text-6xl">
            Every angle, <span className="italic text-luxury">considered.</span>
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">Drag to explore the full edit.</p>
        </Reveal>
        {products.length >= 3 && (
          <Reveal delay={150} className="mt-6">
            <Carousel3D products={products.slice(0, 8)} />
          </Reveal>
        )}
      </section>
      <section className="grid bg-primary text-primary-foreground lg:grid-cols-2">
        <div className="group relative overflow-hidden">
          <img
            src={editorial2}
            alt="Featured KH Luxury collection"
            width={1024}
            height={1280}
            loading="lazy"
            className="h-[75vh] w-full object-cover transition-transform duration-[2000ms] ease-out group-hover:scale-105"
          />
          <span className="absolute left-6 top-6 font-display text-8xl leading-none text-primary-foreground/20 sm:text-9xl">
            01
          </span>
        </div>
        <div className="flex items-center px-7 py-16 sm:px-16">
          <Reveal className="max-w-lg">
            <p className="eyebrow text-luxury">Featured / 01</p>
            <h2 className="mt-4 font-display text-5xl sm:text-7xl">
              The Noir
              <br />
              Structure
            </h2>
            <p className="mt-6 text-sm leading-7 text-primary-foreground/65">
              Purposeful silhouettes meet effortless movement. A study in proportion, composure, and
              contemporary form.
            </p>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="mt-8 border-luxury bg-transparent text-primary-foreground hover:bg-luxury hover:text-primary"
            >
              <Link to="/collections">Discover the collection</Link>
            </Button>
          </Reveal>
        </div>
      </section>
      <section className="section">
        <Reveal>
          <SectionTitle eyebrow="Most considered" title="Best sellers" />
        </Reveal>
        <div className="product-grid">
          {bestSellers.map((p, i) => (
            <Reveal key={p.id} delay={i * 110}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </section>
      <section className="bg-secondary py-20">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8">
          <SectionTitle eyebrow="Find your form" title="Shop by category" />
          <div className="grid gap-3 md:grid-cols-3">
            {[
              ["Tees", editorial1],
              ["Jackets", editorial3],
              ["Shorts", editorial2],
            ].map(([c, img], i) => (
              <Reveal key={c} delay={i * 120}>
                <Tilt max={6}>
                  <Link
                    to={`/category/${String(c).toLowerCase()}`}
                    className="group relative block overflow-hidden"
                  >
                    <img
                      src={img}
                      alt={`${c} collection`}
                      loading="lazy"
                      className="aspect-[4/5] w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.06]"
                    />
                    <div className="absolute inset-0 bg-image-overlay transition-opacity duration-500 group-hover:opacity-90" />
                    <span className="absolute inset-3 border border-primary-foreground/0 transition-colors duration-500 group-hover:border-primary-foreground/30" />
                    <div className="absolute inset-x-6 bottom-6 flex items-end justify-between text-primary-foreground">
                      <div>
                        <p className="text-[10px] uppercase tracking-[.3em] text-luxury">
                          0{i + 1}
                        </p>
                        <span className="mt-1 block font-display text-4xl">{c}</span>
                      </div>
                      <span className="grid size-11 place-items-center rounded-full border border-primary-foreground/40 transition-all duration-500 group-hover:border-luxury group-hover:bg-luxury group-hover:text-primary">
                        <ArrowRight className="size-4 -rotate-45 transition-transform duration-500 group-hover:rotate-0" />
                      </span>
                    </div>
                  </Link>
                </Tilt>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <section className="section grid items-center gap-12 lg:grid-cols-2">
        <div className="order-2 lg:order-1">
          <p className="eyebrow">Your mark</p>
          <h2 className="mt-3 font-display text-5xl sm:text-6xl">
            A blank canvas.
            <br />
            Made personal.
          </h2>
          <p className="mt-6 max-w-lg leading-7 text-muted-foreground">
            Begin with our heavyweight foundation tee, then make it unmistakably yours. Select the
            cut, colour, placement, and artwork.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link to="/customize">
              Customize your tee <ArrowRight />
            </Link>
          </Button>
        </div>
        <img
          src={editorial3}
          alt="Customized luxury tee"
          loading="lazy"
          className="order-1 aspect-[5/4] w-full object-cover lg:order-2"
        />
      </section>
      <section className="border-y bg-background py-24 text-center">
        <div className="mx-auto max-w-3xl px-6">
          <p className="eyebrow">Our philosophy</p>
          <blockquote className="reveal is-visible mt-6 font-display text-4xl italic leading-tight sm:text-6xl">
            “Luxury is not excess. It is the confidence of choosing only what matters.”
          </blockquote>
          <Button asChild variant="link" className="mt-8">
            <Link to="/about">
              Read our story <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
      <section className="section">
        <SectionTitle eyebrow="In their words" title="The KH community" />
        <div className="grid gap-px bg-border md:grid-cols-3">
          {testimonials.map((q, i) => (
            <article
              key={i}
              className="relative bg-background p-8 transition-colors duration-500 hover:bg-card sm:p-10"
            >
              <span className="absolute right-8 top-4 font-display text-7xl leading-none text-luxury/25">
                ”
              </span>
              <Stars rating={q.rating} />
              <p className="mt-6 font-display text-2xl leading-snug">“{q.text}”</p>
              <p className="mt-8 text-xs uppercase tracking-wider text-muted-foreground">
                {q.author}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export function ShopPage({ initialCategory }: { initialCategory?: string }) {
  const { categories: cats, ready } = useApp();
  const products = usePublicProducts();
  const categories = useMemo(
    () => [...cats.filter((c) => c.active).map((c) => c.name), ...shopCategories],
    [cats],
  );
  // URLs use lower-case names (/category/tees); match them to the real category name.
  const fromUrl = initialCategory
    ? (categories.find((c) => c.toLowerCase() === initialCategory.toLowerCase()) ??
      initialCategory)
    : "All";
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(fromUrl);
  const [sort, setSort] = useState("featured");
  useEffect(() => setCategory(fromUrl), [fromUrl]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = products.filter(
      (p) =>
        (category === "All" ||
          p.category.toLowerCase() === category.toLowerCase() ||
          (category === "New Arrivals" && p.newArrival) ||
          (category === "Featured" && p.featured)) &&
        (p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)),
    );
    const by: Record<string, (a: Product, b: Product) => number> = {
      low: (a, b) => a.price - b.price,
      high: (a, b) => b.price - a.price,
      new: (a, b) => b.createdAt.localeCompare(a.createdAt),
      featured: (a, b) => Number(!!b.featured) - Number(!!a.featured),
      popular: (a, b) => Number(!!b.featured) - Number(!!a.featured) || a.stock - b.stock,
    };
    return [...list].sort(by[sort] ?? (() => 0));
  }, [products, query, category, sort]);
  if (!ready) return <Loading />;
  return (
    <main>
      <PageIntro
        eyebrow="KH Collection"
        title={initialCategory ? titleCase(initialCategory) : "The full collection"}
        text="Quiet essentials and confident statements, designed to live beyond a season."
      />
      <div className="mx-auto max-w-[1440px] px-5 pb-24 sm:px-8">
        <div className="mb-10 grid gap-3 border-y py-4 md:grid-cols-[1fr_auto_auto]">
          <label className="flex min-w-0 items-center gap-2">
            <Search className="size-4" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the collection"
              className="border-0 shadow-none focus-visible:ring-0"
            />
          </label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="min-w-48">
              <Filter />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="min-w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="new">Newest</SelectItem>
              <SelectItem value="low">Price: low to high</SelectItem>
              <SelectItem value="high">Price: high to low</SelectItem>
              <SelectItem value="popular">Popular</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="mb-7 flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
          <span>{filtered.length} pieces</span>
          <span>Sizes XS—XXL</span>
        </div>
        {filtered.length ? (
          <div className="product-grid">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <EmptyState title="No pieces found" text="Try another category or a broader search." />
        )}
      </div>
    </main>
  );
}

export function CollectionsPage() {
  return (
    <main>
      <PageIntro
        eyebrow="The collections"
        title="Stories in form"
        text="Each KH Luxury collection begins with an attitude—translated into cloth, proportion, and considered detail."
      />
      <div className="mx-auto grid max-w-[1440px] gap-12 px-5 pb-24 sm:px-8 lg:grid-cols-2">
        {[
          [
            "The Noir Structure",
            "An exercise in confidence, balance, and the enduring authority of black.",
            editorial2,
            "Jackets",
          ],
          [
            "Foundation / 01",
            "Elevated essentials engineered as the foundation of a modern wardrobe.",
            editorial1,
            "Tees",
          ],
          [
            "After Hours",
            "Relaxed tailoring for movement between day, evening, and everything between.",
            editorial3,
            "Joggers",
          ],
        ].map(([title, text, img, cat], i) => (
          <Link
            key={title}
            to={`/category/${String(cat).toLowerCase()}`}
            className={cn("group", i === 0 && "lg:col-span-2")}
          >
            <div className="overflow-hidden">
              <img
                src={img}
                alt={title}
                className={cn(
                  "w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]",
                  i === 0 ? "max-h-[70vh] aspect-[16/8]" : "aspect-[4/5]",
                )}
              />
            </div>
            <p className="mt-5 text-xs uppercase tracking-[.2em] text-luxury">
              Collection 0{i + 1}
            </p>
            <h2 className="mt-2 font-display text-4xl">{title}</h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">{text}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}

export function ProductPage({ product }: { product: Product }) {
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const products = usePublicProducts();
  const reviews = useApprovedReviews(product.id);
  const [size, setSize] = useState(product.sizes.at(0) ?? "M");
  const [color, setColor] = useState(product.colors.at(0) ?? "Obsidian");
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const soldOut = product.stock <= 0;
  const related = [
    ...products.filter((p) => p.id !== product.id && p.category === product.category),
    ...products.filter((p) => p.id !== product.id && p.category !== product.category),
  ].slice(0, 4);
  const average = reviews.length
    ? reviews.reduce((n, r) => n + r.rating, 0) / reviews.length
    : 0;
  useEffect(() => {
    setSize(product.sizes.at(0) ?? "M");
    setColor(product.colors.at(0) ?? "Obsidian");
    setQty(1);
  }, [product.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <main>
      <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8">
        <div className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/shop">Shop</Link>
          <ChevronRight className="size-3" />
          <span>{product.category}</span>
          <ChevronRight className="size-3" />
          <span>{product.name}</span>
        </div>
        <div className="grid gap-10 lg:grid-cols-[1.2fr_.8fr]">
          <div className="grid gap-3 sm:grid-cols-2">
            {product.images.map((image, index) => (
              <img
                key={image}
                src={image}
                alt={index === 0 ? product.name : `${product.name} campaign view ${index}`}
                className={cn(
                  "w-full object-cover",
                  index === 0 ? "aspect-[3/4] sm:col-span-2" : "aspect-square",
                )}
              />
            ))}
          </div>
          <aside className="lg:sticky lg:top-28 lg:h-fit">
            <p className="eyebrow">{product.category}</p>
            <h1 className="mt-3 font-display text-5xl">{product.name}</h1>
            <p className="mt-3 text-lg">{formatPrice(product.price)}</p>
            {reviews.length > 0 && (
              <a href="#reviews" className="mt-3 flex items-center gap-2 text-xs">
                <Stars rating={Math.round(average)} />
                {average.toFixed(1)} · {reviews.length} review{reviews.length > 1 ? "s" : ""}
              </a>
            )}
            <p className="mt-6 leading-7 text-muted-foreground">{product.description}</p>
            <fieldset className="mt-8">
              <legend className="text-xs uppercase tracking-wider">Color — {color}</legend>
              <div className="mt-3 flex gap-2">
                {product.colors.map((c) => (
                  <Button
                    key={c}
                    variant={color === c ? "default" : "outline"}
                    size="sm"
                    onClick={() => setColor(c)}
                  >
                    {c}
                  </Button>
                ))}
              </div>
            </fieldset>
            <fieldset className="mt-7">
              <div className="flex justify-between">
                <legend className="text-xs uppercase tracking-wider">Select size</legend>
                <button className="text-xs underline">Size guide</button>
              </div>
              <div className="mt-3 grid grid-cols-5 gap-2">
                {product.sizes.map((s) => (
                  <Button
                    key={s}
                    variant={size === s ? "default" : "outline"}
                    onClick={() => setSize(s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </fieldset>
            <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
              <span className={cn("size-2 rounded-full", soldOut ? "bg-destructive" : "bg-success")} />
              {soldOut ? "Currently sold out" : `${product.stock} pieces available`}
            </p>
            <div className="mt-6 grid grid-cols-[auto_1fr_auto] gap-2">
              <Quantity
                value={qty}
                onChange={(v) => setQty(Math.min(Math.max(1, v), Math.max(1, product.stock)))}
              />
              <Button
                size="lg"
                disabled={soldOut || adding}
                onClick={async () => {
                  setAdding(true);
                  await addToCart(product, size, color, qty);
                  setAdding(false);
                }}
              >
                {adding && <Loader2 className="animate-spin" />}
                {soldOut ? "Sold out" : "Add to bag"}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10"
                onClick={() => toggleWishlist(product.id)}
              >
                <Heart
                  className={wishlist.includes(product.id) ? "fill-current text-luxury" : ""}
                />
              </Button>
            </div>
            <Accordion type="single" collapsible className="mt-8 border-t">
              <AccordionItem value="details">
                <AccordionTrigger>Product information</AccordionTrigger>
                <AccordionContent>
                  {product.specifications ||
                    "Heavyweight premium cotton. Relaxed silhouette. Finished with precision in Lagos. Cold wash, reshape, and air dry."}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="shipping">
                <AccordionTrigger>Delivery & returns</AccordionTrigger>
                <AccordionContent>
                  Lagos delivery in 1–3 working days. Nationwide delivery in 3–7 working days.
                  Returns accepted within 7 days in original condition.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </aside>
        </div>
      </div>
      <section id="reviews" className="section pb-0">
        <SectionTitle eyebrow="Client notes" title="Reviews" />
        {reviews.length ? (
          <div className="grid gap-px bg-border md:grid-cols-2">
            {reviews.map((r) => (
              <article key={r.id} className="bg-background p-7">
                <Stars rating={r.rating} />
                <p className="mt-4 leading-7">{r.text}</p>
                {r.image && (
                  <img src={r.image} alt="Customer photo" className="mt-4 size-24 object-cover" />
                )}
                <p className="mt-5 text-xs uppercase tracking-wider text-muted-foreground">
                  {r.author ?? "KH client"} · {formatDate(r.date)}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No reviews yet.{" "}
            <Link to={`/reviews?product=${encodeURIComponent(product.id)}`} className="underline">
              Be the first to share your experience.
            </Link>
          </p>
        )}
      </section>
      {related.length > 0 && (
        <section className="section">
          <SectionTitle eyebrow="Complete the story" title="Related pieces" />
          <div className="product-grid">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

export function CartPage() {
  const { cart, removeFromCart, updateQuantity } = useStore();
  const { ready } = useApp();
  const subtotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const vat = Math.round(subtotal * VAT_RATE);
  if (!ready) return <Loading />;
  if (!cart.length)
    return (
      <main>
        <PageIntro eyebrow="Your selection" title="Shopping bag" />
        <EmptyState
          title="Your bag is empty"
          text="Your next signature piece is waiting."
          link="/shop"
          action="Explore collection"
        />
      </main>
    );
  return (
    <main>
      <PageIntro eyebrow="Your selection" title="Shopping bag" />
      <div className="mx-auto grid max-w-[1440px] gap-12 px-5 pb-24 sm:px-8 lg:grid-cols-[1fr_380px]">
        <div>
          {cart.map(({ key, product, quantity, size, color, customization }) => (
            <div
              key={key}
              className="grid grid-cols-[110px_1fr] gap-5 border-b py-6 first:pt-0 sm:grid-cols-[140px_1fr_auto]"
            >
              <img
                src={product.image}
                alt={product.name}
                className="aspect-[3/4] w-full object-cover"
              />
              <div>
                <h2 className="font-display text-2xl">{product.name}</h2>
                <p className="mt-2 text-xs text-muted-foreground">
                  {color} / {size}
                  {customization ? " · Custom" : ""}
                </p>
                {customization && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {customization.instructions}
                  </p>
                )}
                <p className="mt-3 text-sm">{formatPrice(product.price)}</p>
                <Button
                  variant="link"
                  className="mt-4 h-auto p-0 text-xs"
                  onClick={() => removeFromCart(key)}
                >
                  Remove
                </Button>
              </div>
              <div className="col-start-2 sm:col-start-auto">
                <Quantity value={quantity} onChange={(v) => updateQuantity(key, v)} />
              </div>
            </div>
          ))}
        </div>
        <OrderSummary subtotal={subtotal} delivery={null} vat={vat} checkoutLink />
      </div>
    </main>
  );
}
/** `delivery: null` means it is chosen at checkout. */
function OrderSummary({
  subtotal,
  delivery,
  vat,
  checkoutLink = false,
  children,
}: {
  subtotal: number;
  delivery: number | null;
  vat: number;
  checkoutLink?: boolean;
  children?: ReactNode;
}) {
  return (
    <aside className="h-fit border bg-secondary p-6">
      <h2 className="font-display text-3xl">Order summary</h2>
      {children}
      <div className="mt-6 space-y-3 text-sm">
        <SummaryRow label="Subtotal" value={formatPrice(subtotal)} />
        <SummaryRow
          label="Delivery"
          value={
            delivery === null
              ? "Calculated at checkout"
              : delivery
                ? formatPrice(delivery)
                : "Complimentary"
          }
        />
        <SummaryRow label="VAT (7.5%)" value={formatPrice(vat)} />
        <div className="border-t pt-4">
          <SummaryRow
            label={delivery === null ? "Total before delivery" : "Total"}
            value={formatPrice(subtotal + (delivery ?? 0) + vat)}
            strong
          />
        </div>
      </div>
      {checkoutLink && (
        <>
          <Button asChild size="lg" className="mt-7 w-full">
            <Link to="/checkout">
              Proceed to checkout <ArrowRight />
            </Link>
          </Button>
          <Button asChild variant="link" className="mt-2 w-full">
            <Link to="/shop">Continue shopping</Link>
          </Button>
        </>
      )}
    </aside>
  );
}
function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn("flex justify-between", strong && "font-semibold")}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function WishlistPage() {
  const { wishlist } = useStore();
  const { ready } = useApp();
  const products = usePublicProducts();
  const list = products.filter((p) => wishlist.includes(p.id));
  if (!ready) return <Loading />;
  return (
    <main>
      <PageIntro
        eyebrow="Saved for later"
        title="Wishlist"
        text="A private edit of pieces that caught your eye."
      />
      <div className="section pt-0">
        {list.length ? (
          <div className="product-grid">
            {list.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nothing saved yet"
            text="Use the heart on any piece to keep it here."
            link="/shop"
            action="Browse collection"
          />
        )}
      </div>
    </main>
  );
}

export function CustomizePage() {
  const { ready } = useApp();
  const { addToCart, requireCustomer } = useStore();
  const navigate = useNavigate();
  const blanks = usePublicProducts().filter((p) => p.customizable);
  const [blankId, setBlankId] = useState("");
  const blank = blanks.find((b) => b.id === blankId) ?? blanks[0];
  const [size, setSize] = useState("M");
  const [color, setColor] = useState("Ivory");
  const [qty, setQty] = useState(1);
  const [file, setFile] = useState<{ name: string; size: number; dataUrl: string } | null>(null);
  const [instructions, setInstructions] = useState("");
  const [adding, setAdding] = useState(false);
  useEffect(() => {
    if (!blank) return;
    setSize((s) => (blank.sizes.includes(s) ? s : (blank.sizes[0] ?? "M")));
    setColor((c) => (blank.colors.includes(c) ? c : (blank.colors[0] ?? "Ivory")));
  }, [blank]);
  if (!ready) return <Loading />;
  if (!blank)
    return (
      <main>
        <PageIntro eyebrow="KH Custom Studio" title="Make the foundation yours" />
        <EmptyState
          title="The custom studio is resting"
          text="No customisable pieces are available right now. Please check back soon."
          link="/shop"
          action="Explore collection"
        />
      </main>
    );
  const soldOut = blank.stock <= 0;
  const add = async () => {
    if (!file && instructions.trim().length < 5) {
      toast.error("Upload your artwork or describe your design.");
      return;
    }
    if (!requireCustomer()) return;
    setAdding(true);
    const ok = await addToCart(blank, size, color, qty, {
      blank: blank.name,
      instructions: instructions.trim(),
      ...(file ? { designName: file.name, designData: file.dataUrl } : {}),
    });
    setAdding(false);
    if (ok) {
      setFile(null);
      setInstructions("");
      navigate("/cart");
    }
  };
  return (
    <main>
      <PageIntro
        eyebrow="KH Custom Studio"
        title="Make the foundation yours"
        text="Begin with our heavyweight tee. Add your artwork and direction; our studio will take it from there."
      />
      <div className="mx-auto grid max-w-[1200px] gap-12 px-5 pb-24 sm:px-8 lg:grid-cols-2">
        <img src={blank.image} alt={blank.name} className="aspect-[4/5] w-full object-cover" />
        <div>
          <h2 className="font-display text-3xl">Build your tee</h2>
          <FormField label="Blank tee">
            <Select value={blank.id} onValueChange={setBlankId}>
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {blanks.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name} · {formatPrice(b.price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Size">
            <div className="grid grid-cols-5 gap-2">
              {blank.sizes.map((s) => (
                <Button
                  key={s}
                  variant={size === s ? "default" : "outline"}
                  onClick={() => setSize(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </FormField>
          <FormField label={`Color — ${color}`}>
            <div className="flex flex-wrap gap-2">
              {blank.colors.map((c) => (
                <Button
                  key={c}
                  variant={color === c ? "default" : "outline"}
                  onClick={() => setColor(c)}
                >
                  {c}
                </Button>
              ))}
            </div>
          </FormField>
          <FormField label="Quantity">
            <Quantity value={qty} onChange={(v) => setQty(Math.min(Math.max(1, v), 99))} />
          </FormField>
          <FormField label="Your artwork">
            {file ? (
              <div className="flex items-center justify-between border border-luxury bg-secondary p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {Math.ceil(file.size / 1024)} KB · Ready to send
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setFile(null)}>
                  <X />
                </Button>
              </div>
            ) : (
              <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center border border-dashed border-luxury bg-secondary/50 text-center">
                <Upload className="size-5 text-luxury" />
                <span className="mt-3 text-sm">Drop your artwork here or browse</span>
                <span className="mt-1 text-xs text-muted-foreground">
                  PNG, JPG or PDF · Up to 8 MB
                </span>
                <input
                  type="file"
                  className="sr-only"
                  accept="image/*,.pdf"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (!f) return;
                    const dataUrl = await readUpload(f, "image-or-pdf");
                    if (dataUrl) setFile({ name: f.name, size: f.size, dataUrl });
                  }}
                />
              </label>
            )}
          </FormField>
          <FormField label="Design instructions">
            <Textarea
              className="min-h-28"
              maxLength={2000}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Placement, scale, preferred finish, or anything our studio should know..."
            />
          </FormField>
          <div className="mt-8 border-y py-5">
            <SummaryRow
              label={`${qty} × Custom ${blank.name}`}
              value={formatPrice(blank.price * qty)}
              strong
            />
          </div>
          <Button size="lg" className="mt-6 w-full" disabled={adding || soldOut} onClick={add}>
            {adding && <Loader2 className="animate-spin" />}
            {soldOut ? "Currently sold out" : "Add custom tee to bag"}
          </Button>
        </div>
      </div>
    </main>
  );
}

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export function CheckoutPage() {
  return (
    <RequireAuth role="customer">
      <Checkout />
    </RequireAuth>
  );
}
function Checkout() {
  const { user, cart, locations, settings, placeOrder, submitReceipt } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [contact, setContact] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
  });
  const [delivery, setDelivery] = useState({
    address: "",
    city: "",
    state: "Lagos",
    locationId: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [order, setOrder] = useState<Order | null>(null);
  const [receipt, setReceipt] = useState<{ name: string; type: string; dataUrl: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const active = locations.filter((l) => l.active);
  const loc = active.find((l) => l.id === delivery.locationId);
  const subtotal = order?.subtotal ?? cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const vat = order?.vat ?? Math.round(subtotal * VAT_RATE);
  const fee = order ? order.deliveryFee : loc ? loc.fee : null;
  const labels = ["Customer", "Delivery", "Review", "Payment", "Receipt"];

  if (!order && !cart.length)
    return (
      <main>
        <PageIntro eyebrow="Checkout" title="Your bag is empty" />
        <EmptyState
          title="Nothing to check out yet"
          text="Add a piece to your bag to begin."
          link="/shop"
          action="Explore collection"
        />
      </main>
    );

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (step === 1) {
      if (contact.name.trim().length < 2) e["name"] = "Enter your full name";
      if (!emailOk(contact.email)) e["email"] = "Enter a valid email";
      if (contact.phone.trim().length < 5) e["phone"] = "Enter a phone number";
    }
    if (step === 2) {
      if (delivery.address.trim().length < 3) e["address"] = "Enter a delivery address";
      if (!delivery.city.trim()) e["city"] = "Enter a city";
      if (!delivery.state.trim()) e["state"] = "Enter a state";
      if (!loc) e["locationId"] = "Choose a delivery option";
    }
    setErrors(e);
    return !Object.keys(e).length;
  };

  const next = async () => {
    if (!validate()) return;
    if (step === 3) {
      setBusy(true);
      const placed = await placeOrder({
        contact: {
          name: contact.name.trim(),
          email: contact.email.trim(),
          phone: contact.phone.trim(),
        },
        delivery: {
          address: delivery.address.trim(),
          city: delivery.city.trim(),
          state: delivery.state.trim(),
          locationId: delivery.locationId,
        },
      });
      setBusy(false);
      if (!placed) return;
      setOrder(placed);
      toast.success(`Order ${placed.id} placed`);
    }
    if (step === 5) {
      if (!order) return;
      if (!receipt) {
        setErrors({ receipt: "Upload your transfer receipt" });
        return;
      }
      setBusy(true);
      const ok = await submitReceipt(order.id, receipt);
      setBusy(false);
      if (ok) navigate(`/order-confirmation?order=${encodeURIComponent(order.id)}`);
      return;
    }
    setStep((s) => s + 1);
  };

  const lines = order
    ? order.items.map((i, n) => ({
        key: `${i.productId}-${n}`,
        name: i.name,
        image: i.image,
        detail: `${i.color} / ${i.size} · Qty ${i.quantity}${i.customization ? " · Custom" : ""}`,
        amount: i.price * i.quantity,
      }))
    : cart.map((i) => ({
        key: i.key,
        name: i.product.name,
        image: i.product.image,
        detail: `${i.color} / ${i.size} · Qty ${i.quantity}${i.customization ? " · Custom" : ""}`,
        amount: i.product.price * i.quantity,
      }));

  return (
    <main className="bg-secondary/40">
      <div className="mx-auto max-w-[1100px] px-5 py-10 sm:px-8 sm:py-16">
        <Link to="/" aria-label="KH Luxury home">
          <Logo />
        </Link>
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px]">
          <div className="bg-background p-6 sm:p-10">
            <div className="mb-10 grid grid-cols-5 gap-1">
              {labels.map((l, i) => (
                <div key={l} className="min-w-0">
                  <div className={cn("h-0.5", step >= i + 1 ? "bg-luxury" : "bg-border")} />
                  <p className="mt-2 truncate text-[9px] uppercase tracking-wider">{l}</p>
                </div>
              ))}
            </div>
            <h1 className="font-display text-4xl">{labels[step - 1]}</h1>
            <div className="mt-7">
              {step === 1 && (
                <div className="grid gap-1">
                  <FormField label="Full name" err={errors["name"]}>
                    <Input
                      value={contact.name}
                      autoComplete="name"
                      onChange={(e) => setContact({ ...contact, name: e.target.value })}
                    />
                  </FormField>
                  <FormField label="Email" err={errors["email"]}>
                    <Input
                      type="email"
                      value={contact.email}
                      autoComplete="email"
                      onChange={(e) => setContact({ ...contact, email: e.target.value })}
                    />
                  </FormField>
                  <FormField label="Phone" err={errors["phone"]}>
                    <Input
                      value={contact.phone}
                      autoComplete="tel"
                      onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                    />
                  </FormField>
                </div>
              )}
              {step === 2 && (
                <div className="grid gap-1">
                  <FormField label="Address" err={errors["address"]}>
                    <Input
                      value={delivery.address}
                      autoComplete="street-address"
                      placeholder="14 Bourdillon Road"
                      onChange={(e) => setDelivery({ ...delivery, address: e.target.value })}
                    />
                  </FormField>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <FormField label="City" err={errors["city"]}>
                      <Input
                        value={delivery.city}
                        placeholder="Ikoyi"
                        onChange={(e) => setDelivery({ ...delivery, city: e.target.value })}
                      />
                    </FormField>
                    <FormField label="State" err={errors["state"]}>
                      <Input
                        value={delivery.state}
                        onChange={(e) => setDelivery({ ...delivery, state: e.target.value })}
                      />
                    </FormField>
                  </div>
                  <FormField label="Delivery option" err={errors["locationId"]}>
                    <div className="grid gap-2">
                      {active.map((l) => (
                        <label
                          key={l.id}
                          className={cn(
                            "flex cursor-pointer items-center gap-3 border p-4",
                            delivery.locationId === l.id && "border-luxury bg-secondary/60",
                          )}
                        >
                          <input
                            type="radio"
                            name="location"
                            checked={delivery.locationId === l.id}
                            onChange={() => setDelivery({ ...delivery, locationId: l.id })}
                          />
                          <MapPin className="size-4 shrink-0" />
                          <span className="min-w-0 flex-1 text-sm">
                            {l.name}
                            <span className="block text-xs text-muted-foreground">
                              {l.description || l.address} · {l.eta}
                            </span>
                          </span>
                          <span className="text-sm">{l.fee ? formatPrice(l.fee) : "Free"}</span>
                        </label>
                      ))}
                      {!active.length && (
                        <p className="text-sm text-muted-foreground">
                          No delivery options are available right now. Please contact us.
                        </p>
                      )}
                    </div>
                  </FormField>
                </div>
              )}
              {step === 3 && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Review your pieces and delivery details. Placing the order reserves your pieces
                    while you pay by bank transfer.
                  </p>
                  <div className="mt-6 space-y-4">
                    {lines.map((i) => (
                      <div key={i.key} className="flex items-center gap-4 border-b pb-4">
                        <img src={i.image} alt="" className="size-16 object-cover" />
                        <div className="flex-1">
                          <p className="font-display text-lg">{i.name}</p>
                          <p className="text-xs text-muted-foreground">{i.detail}</p>
                        </div>
                        <span className="text-sm">{formatPrice(i.amount)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 grid gap-1 text-sm text-muted-foreground">
                    <p>
                      {contact.name} · {contact.phone}
                    </p>
                    <p>
                      {delivery.address}, {delivery.city}, {delivery.state} · {loc?.name}
                    </p>
                  </div>
                </div>
              )}
              {step === 4 && order && (
                <BankDetails
                  amount={order.total}
                  reference={order.id}
                  instructions={settings.payment.paymentInstructions}
                />
              )}
              {step === 5 && (
                <ReceiptPicker
                  value={receipt}
                  onChange={(r) => {
                    setReceipt(r);
                    setErrors({});
                  }}
                  err={errors["receipt"]}
                />
              )}
            </div>
            <div className="mt-10 flex justify-between gap-3">
              <Button
                variant="ghost"
                disabled={step === 1 || step === 4 || busy}
                onClick={() => setStep((s) => s - 1)}
              >
                Back
              </Button>
              {step === 4 && order && (
                <Button asChild variant="link" className="ml-auto">
                  <Link to={`/account/orders/${encodeURIComponent(order.id)}`}>Pay later</Link>
                </Button>
              )}
              <Button onClick={next} disabled={busy}>
                {busy && <Loader2 className="animate-spin" />}
                {step === 3
                  ? "Place order"
                  : step === 4
                    ? "I have paid"
                    : step === 5
                      ? "Submit receipt"
                      : "Continue"}
                <ArrowRight />
              </Button>
            </div>
          </div>
          <OrderSummary subtotal={subtotal} delivery={fee} vat={vat}>
            {order && <p className="mt-2 text-xs text-muted-foreground">Order {order.id}</p>}
          </OrderSummary>
        </div>
      </div>
    </main>
  );
}

function BankDetails({
  amount,
  reference,
  instructions,
}: {
  amount: number;
  reference: string;
  instructions: string;
}) {
  const { settings } = useApp();
  const p = settings.payment;
  const missing = !p.bankName || !p.accountNumber;
  return (
    <div className="border bg-secondary p-6">
      <p className="eyebrow">Manual bank transfer</p>
      {missing ? (
        <p className="mt-5 text-sm">
          Our bank details are being updated. Please{" "}
          <a
            className="underline"
            href={whatsappLink(
              settings.whatsapp.whatsappNumber,
              `Hello, I need payment details for order ${reference}.`,
            )}
            target="_blank"
            rel="noreferrer"
          >
            message us on WhatsApp
          </a>{" "}
          for payment details.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          <SummaryRow label="Account name" value={p.accountName} />
          <SummaryRow label="Bank" value={p.bankName} />
          <SummaryRow label="Account number" value={p.accountNumber} />
          <SummaryRow label="Amount" value={formatPrice(amount)} strong />
          <SummaryRow label="Reference" value={reference} />
        </div>
      )}
      <p className="mt-6 border-t pt-5 text-sm leading-6">{instructions}</p>
    </div>
  );
}

function ReceiptPicker({
  value,
  onChange,
  err,
}: {
  value: { name: string; type: string; dataUrl: string } | null;
  onChange: (r: { name: string; type: string; dataUrl: string } | null) => void;
  err?: string | undefined;
}) {
  return (
    <FormField label="Payment receipt" err={err}>
      {value ? (
        <div className="flex items-center justify-between gap-3 border border-luxury bg-secondary p-4">
          {value.type.startsWith("image/") && (
            <img src={value.dataUrl} alt="" className="size-14 object-cover" />
          )}
          <span className="min-w-0 flex-1 truncate text-sm">{value.name}</span>
          <Button variant="ghost" size="icon" onClick={() => onChange(null)} aria-label="Remove">
            <X />
          </Button>
        </div>
      ) : (
        <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center border border-dashed border-luxury bg-secondary/50">
          <Upload />
          <span className="mt-3 text-sm">Upload transfer receipt</span>
          <span className="text-xs text-muted-foreground">JPG, PNG or PDF · Up to 8 MB</span>
          <input
            type="file"
            className="sr-only"
            accept="image/*,.pdf"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              const dataUrl = await readUpload(f, "image-or-pdf");
              if (dataUrl) onChange({ name: f.name, type: f.type, dataUrl });
            }}
          />
        </label>
      )}
    </FormField>
  );
}

/** Finds the order named in ?order=, or the customer's latest order still waiting for a receipt. */
function useOrderFromQuery(): { order?: Order; payment?: Payment } {
  const [params] = useSearchParams();
  const { orders, payments } = useApp();
  const id = params.get("order");
  const needsReceipt = (o: Order) =>
    ["awaiting_receipt", "resubmit", "rejected"].includes(
      payments.find((p) => p.id === o.paymentId)?.status ?? "",
    );
  const order = id ? orders.find((o) => o.id === id) : orders.find(needsReceipt);
  const payment = order ? payments.find((p) => p.id === order.paymentId) : undefined;
  return { ...(order ? { order } : {}), ...(payment ? { payment } : {}) };
}

export function OrderConfirmationPage() {
  return (
    <RequireAuth role="customer">
      <OrderConfirmation />
    </RequireAuth>
  );
}
function OrderConfirmation() {
  const { order, payment } = useOrderFromQuery();
  if (!order)
    return (
      <main>
        <PageIntro eyebrow="Orders" title="Order not found" />
        <EmptyState
          title="We could not find that order"
          text="You can see all your orders in your account."
          link="/account/orders"
          action="My orders"
        />
      </main>
    );
  const expected = new Date(order.expectedDelivery);
  return (
    <main className="min-h-screen bg-secondary/50 px-5 py-20">
      <div className="mx-auto max-w-3xl bg-background p-8 text-center sm:p-14">
        <div className="mx-auto grid size-16 place-items-center rounded-full border border-luxury text-luxury">
          <Check className="size-7" />
        </div>
        <p className="eyebrow mt-7">Order {order.id}</p>
        <h1 className="mt-3 font-display text-5xl">Order successful</h1>
        <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-muted-foreground">
          {payment?.status === "paid"
            ? "Your payment has been confirmed. We will keep you updated as your order progresses."
            : payment?.receipt
              ? "Your payment receipt has been submitted and is awaiting verification."
              : "Your order is reserved. Complete your bank transfer and upload the receipt."}
        </p>
        {payment && (
          <span className="mt-6 inline-block border border-luxury bg-secondary px-4 py-2 text-xs uppercase tracking-wider">
            {PAYMENT_LABELS[payment.status]}
          </span>
        )}
        <div className="mt-10 grid gap-px bg-border text-left sm:grid-cols-3">
          <div className="bg-background p-5">
            <p className="eyebrow">Total</p>
            <p className="mt-2 font-display text-2xl">{formatPrice(order.total)}</p>
          </div>
          <div className="bg-background p-5">
            <p className="eyebrow">Delivery</p>
            <p className="mt-2 text-sm">
              {order.delivery.locationName}, {order.delivery.state}
            </p>
          </div>
          <div className="bg-background p-5">
            <p className="eyebrow">Expected</p>
            <p className="mt-2 text-sm">{formatDate(expected.toISOString())}</p>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link to={`/account/orders/${encodeURIComponent(order.id)}`}>Track order</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/shop">Continue shopping</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

export function AccountPage({ view = "overview" }: { view?: string }) {
  return (
    <RequireAuth role="customer">
      <Account view={view} />
    </RequireAuth>
  );
}
function Account({ view }: { view: string }) {
  const { user, orders, wishlist, reviews } = useApp();
  const products = usePublicProducts();
  const mine = reviews.filter((r) => r.customerId === user?.id);
  const saved = products.filter((p) => wishlist.includes(p.id));
  return (
    <main>
      <PageIntro
        eyebrow={`Welcome back, ${user?.name.split(" ")[0] ?? ""}`}
        title={titleCase(view)}
      />
      <div className="mx-auto grid max-w-[1300px] gap-10 px-5 pb-24 sm:px-8 lg:grid-cols-[230px_1fr]">
        <AccountNav />
        <div>
          {view === "overview" && (
            <>
              <div className="grid gap-px bg-border sm:grid-cols-3">
                {(
                  [
                    ["Total orders", orders.length, "/account/orders"],
                    ["Wishlist", wishlist.length, "/account/wishlist"],
                    ["Reviews", mine.length, "/account/reviews"],
                  ] as const
                ).map(([l, v, to]) => (
                  <Link className="bg-background p-6 hover:bg-card" key={l} to={to}>
                    <p className="eyebrow">{l}</p>
                    <p className="mt-2 font-display text-4xl">{String(v).padStart(2, "0")}</p>
                  </Link>
                ))}
              </div>
              <h2 className="mt-12 font-display text-3xl">Recent orders</h2>
              <OrderList limit={5} />
            </>
          )}
          {view === "orders" && <OrderList />}
          {view === "wishlist" &&
            (saved.length ? (
              <div className="product-grid">
                {saved.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="Nothing saved yet"
                text="Use the heart on any piece to keep it here."
                link="/shop"
                action="Browse collection"
              />
            ))}
          {view === "profile" && <ProfileForm />}
          {view === "reviews" && (
            <>
              <ReviewForm />
              {mine.length > 0 && (
                <>
                  <h2 className="mt-14 font-display text-3xl">Your reviews</h2>
                  <div className="mt-5 border-t">
                    {mine.map((r) => (
                      <div key={r.id} className="border-b py-5">
                        <div className="flex items-center justify-between gap-4">
                          <Link to={`/product/${r.productId}`} className="text-sm font-medium">
                            {products.find((p) => p.id === r.productId)?.name ?? r.productId}
                          </Link>
                          <span className="status">
                            {r.status === "approved"
                              ? "Published"
                              : r.status === "pending"
                                ? "Awaiting approval"
                                : "Not published"}
                          </span>
                        </div>
                        <div className="mt-2">
                          <Stars rating={r.rating} />
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{r.text}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
          {view === "settings" && <PasswordForm />}
        </div>
      </div>
    </main>
  );
}
function AccountNav() {
  return (
    <nav className="flex gap-2 overflow-auto border-b pb-4 lg:grid lg:h-fit lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8">
      {(
        [
          ["Overview", "/account"],
          ["Orders", "/account/orders"],
          ["Wishlist", "/account/wishlist"],
          ["Profile", "/account/profile"],
          ["Reviews", "/account/reviews"],
          ["Settings", "/account/settings"],
        ] as const
      ).map(([l, to]) => (
        <Link key={to} to={to} className="whitespace-nowrap px-3 py-2 text-sm hover:bg-secondary">
          {l}
        </Link>
      ))}
    </nav>
  );
}
function OrderList({ limit }: { limit?: number }) {
  const { orders, payments } = useApp();
  const list = limit ? orders.slice(0, limit) : orders;
  if (!list.length)
    return (
      <EmptyState
        title="No orders yet"
        text="When you place an order it will appear here."
        link="/shop"
        action="Start shopping"
      />
    );
  return (
    <div className="mt-5 border-t">
      {list.map((o) => {
        const count = o.items.reduce((n, i) => n + i.quantity, 0);
        const pay = payments.find((p) => p.id === o.paymentId);
        return (
          <Link
            key={o.id}
            to={`/account/orders/${encodeURIComponent(o.id)}`}
            className="grid grid-cols-[1fr_auto] gap-4 border-b py-5 sm:grid-cols-[1fr_1fr_1fr_auto]"
          >
            <div>
              <p className="text-sm font-medium">{o.id}</p>
              <p className="text-xs text-muted-foreground">{formatDate(o.date)}</p>
            </div>
            <span className="hidden text-sm sm:block">
              {count} item{count > 1 ? "s" : ""}
              {pay && (
                <span className="block text-xs text-muted-foreground">
                  {PAYMENT_LABELS[pay.status]}
                </span>
              )}
            </span>
            <span className="hidden text-sm sm:block">{formatPrice(o.total)}</span>
            <span className="status">{ORDER_STEP_LABELS[o.status]}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function OrderDetailsPage({ orderId }: { orderId: string }) {
  return (
    <RequireAuth role="customer">
      <OrderDetails orderId={orderId} />
    </RequireAuth>
  );
}
function OrderDetails({ orderId }: { orderId: string }) {
  const { orders, payments } = useApp();
  const order = orders.find((o) => o.id === orderId);
  if (!order)
    return (
      <main>
        <PageIntro eyebrow="Orders" title="Order not found" />
        <EmptyState
          title="We could not find that order"
          text="It may belong to a different account."
          link="/account/orders"
          action="My orders"
        />
      </main>
    );
  const payment = payments.find((p) => p.id === order.paymentId);
  const current = ORDER_STEPS.indexOf(order.status);
  const needsReceipt =
    payment && ["awaiting_receipt", "resubmit", "rejected"].includes(payment.status);
  return (
    <main>
      <PageIntro
        eyebrow={formatDate(order.date)}
        title={`Order ${order.id}`}
        text="Follow your order from confirmation to delivery."
      />
      <div className="mx-auto grid max-w-[1200px] gap-10 px-5 pb-24 sm:px-8 lg:grid-cols-[1fr_350px]">
        <div>
          {needsReceipt && (
            <div className="mb-10 border border-luxury bg-secondary p-5">
              <p className="text-sm font-medium">
                {payment.status === "awaiting_receipt"
                  ? "We are waiting for your payment receipt."
                  : "Your payment needs attention. Please upload a new receipt."}
              </p>
              {payment.notes.length > 0 && payment.status !== "awaiting_receipt" && (
                <p className="mt-1 text-xs text-muted-foreground">{payment.notes.at(-1)?.text}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild size="sm">
                  <Link to={`/payment-receipt?order=${encodeURIComponent(order.id)}`}>
                    Upload receipt
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link to={`/payment-instructions?order=${encodeURIComponent(order.id)}`}>
                    Payment details
                  </Link>
                </Button>
              </div>
            </div>
          )}
          <h2 className="font-display text-3xl">Order progress</h2>
          <div className="mt-7">
            {ORDER_STEPS.map((s, i) => (
              <div key={s} className="grid grid-cols-[28px_1fr] gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "grid size-6 place-items-center rounded-full border",
                      i <= current ? "border-luxury bg-luxury text-primary" : "border-border",
                    )}
                  >
                    {i <= current && <Check className="size-3" />}
                  </span>
                  {i < ORDER_STEPS.length - 1 && <span className="h-10 w-px bg-border" />}
                </div>
                <p className={cn("pt-1 text-sm", i === current && "font-semibold")}>
                  {ORDER_STEP_LABELS[s]}
                </p>
              </div>
            ))}
          </div>
          <h2 className="mt-12 font-display text-3xl">Items</h2>
          <div className="mt-4 border-t">
            {order.items.map((i, n) => (
              <div key={`${i.productId}-${n}`} className="flex gap-4 border-b py-5">
                <img src={i.image} alt="" className="size-24 object-cover" />
                <div className="min-w-0">
                  <Link to={`/product/${i.productId}`} className="font-display text-xl">
                    {i.name}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {i.color} / {i.size} · Qty {i.quantity}
                  </p>
                  {i.customization && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Custom: {i.customization.instructions || i.customization.designName}
                    </p>
                  )}
                  <p className="mt-3 text-sm">{formatPrice(i.price * i.quantity)}</p>
                </div>
              </div>
            ))}
          </div>
          {payment && payment.notes.length > 0 && (
            <>
              <h2 className="mt-12 font-display text-3xl">Payment updates</h2>
              <div className="mt-4 border-t">
                {[...payment.notes].reverse().map((note, i) => (
                  <div key={i} className="border-b py-3 text-sm">
                    <p>{note.text}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(note.at)}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <aside className="h-fit border p-6">
          <h2 className="font-display text-2xl">Delivery details</h2>
          <p className="mt-5 text-sm leading-6 text-muted-foreground">
            {order.contact.name}
            <br />
            {order.delivery.address}
            <br />
            {order.delivery.city}, {order.delivery.state}
            <br />
            {order.delivery.locationName}
            <br />
            {order.contact.phone}
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            Expected by {formatDate(order.expectedDelivery)}
          </p>
          <div className="mt-6 space-y-3 border-t pt-5">
            <SummaryRow label="Subtotal" value={formatPrice(order.subtotal)} />
            <SummaryRow label="VAT (7.5%)" value={formatPrice(order.vat)} />
            <SummaryRow
              label="Delivery"
              value={order.deliveryFee ? formatPrice(order.deliveryFee) : "Complimentary"}
            />
            <div className="border-t pt-4">
              <SummaryRow label="Total" value={formatPrice(order.total)} strong />
            </div>
          </div>
          {payment && (
            <span className="mt-6 inline-block status">{PAYMENT_LABELS[payment.status]}</span>
          )}
        </aside>
      </div>
    </main>
  );
}

export function ReviewForm() {
  const { user, orders, addReview } = useApp();
  const { requireCustomer } = useStore();
  const products = usePublicProducts();
  const [params] = useSearchParams();
  // Pieces the customer has ordered come first in the list.
  const bought = new Set(orders.flatMap((o) => o.items.map((i) => i.productId)));
  const options = [
    ...products.filter((p) => bought.has(p.id)),
    ...products.filter((p) => !bought.has(p.id)),
  ];
  const [productId, setProductId] = useState(params.get("product") ?? "");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const selected = productId || options[0]?.id || "";
  return (
    <form
      className="max-w-2xl"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!requireCustomer()) return;
        if (!selected) { toast.error("Choose a product to review."); return; }
        if (text.trim().length < 3) { toast.error("Write a few words about the product."); return; }
        setBusy(true);
        const ok = await addReview({
          productId: selected,
          rating,
          text: text.trim(),
          ...(image ? { image } : {}),
        });
        setBusy(false);
        if (ok) {
          toast.success("Thank you. Your review will appear once our team approves it.");
          setText("");
          setImage(null);
          setRating(5);
        }
      }}
    >
      <h2 className="font-display text-3xl">Share your experience</h2>
      {!user && (
        <p className="mt-3 text-sm text-muted-foreground">You will be asked to sign in first.</p>
      )}
      <FormField label="Product">
        <Select value={selected} onValueChange={setProductId}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Choose a product" />
          </SelectTrigger>
          <SelectContent>
            {options.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
                {bought.has(p.id) ? " · Purchased" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField label="Rating">
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button type="button" key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
              <Star className={cn("size-6", n <= rating && "fill-current text-luxury")} />
            </button>
          ))}
        </div>
      </FormField>
      <FormField label="Your review">
        <Textarea
          className="min-h-36"
          maxLength={2000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Tell us about the fit, feel, and experience..."
        />
      </FormField>
      <FormField label="Optional image">
        {image ? (
          <div className="flex items-center gap-3">
            <img src={image} alt="" className="size-20 object-cover" />
            <Button type="button" variant="ghost" size="sm" onClick={() => setImage(null)}>
              Remove
            </Button>
          </div>
        ) : (
          <Input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) setImage(await readUpload(f, "image"));
            }}
          />
        )}
      </FormField>
      <Button type="submit" disabled={busy}>
        {busy && <Loader2 className="animate-spin" />}
        Submit review
      </Button>
    </form>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-1 text-luxury" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, j) => (
        <Star key={j} className={cn("size-3", j < rating ? "fill-current" : "opacity-30")} />
      ))}
    </span>
  );
}

function ProfileForm() {
  const { user, updateProfile } = useApp();
  const [f, setF] = useState({ name: user?.name ?? "", email: user?.email ?? "", phone: user?.phone ?? "" });
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="max-w-2xl"
      onSubmit={async (e) => {
        e.preventDefault();
        if (f.name.trim().length < 2) { toast.error("Enter your full name"); return; }
        if (!emailOk(f.email)) { toast.error("Enter a valid email"); return; }
        setBusy(true);
        const ok = await updateProfile({
          name: f.name.trim(),
          email: f.email.trim(),
          phone: f.phone.trim(),
        });
        setBusy(false);
        if (ok) toast.success("Profile updated");
      }}
    >
      <h2 className="font-display text-3xl">Profile details</h2>
      <FormField label="Full name">
        <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      </FormField>
      <FormField label="Email">
        <Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      </FormField>
      <FormField label="Phone">
        <Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
      </FormField>
      <Button className="mt-6" type="submit" disabled={busy}>
        {busy && <Loader2 className="animate-spin" />}
        Save changes
      </Button>
    </form>
  );
}

export function PasswordForm({ title = "Change password" }: { title?: string }) {
  const { changePassword } = useApp();
  const [f, setF] = useState({ current: "", next: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="max-w-2xl"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!f.current) { toast.error("Enter your current password"); return; }
        if (f.next.length < 8) { toast.error("New password must be at least 8 characters"); return; }
        if (f.next !== f.confirm) { toast.error("New passwords do not match"); return; }
        setBusy(true);
        const ok = await changePassword(f.current, f.next);
        setBusy(false);
        if (ok) {
          toast.success("Password changed");
          setF({ current: "", next: "", confirm: "" });
        }
      }}
    >
      <h2 className="font-display text-3xl">{title}</h2>
      <FormField label="Current password">
        <Input
          type="password"
          autoComplete="current-password"
          value={f.current}
          onChange={(e) => setF({ ...f, current: e.target.value })}
        />
      </FormField>
      <FormField label="New password">
        <Input
          type="password"
          autoComplete="new-password"
          value={f.next}
          onChange={(e) => setF({ ...f, next: e.target.value })}
        />
      </FormField>
      <FormField label="Confirm new password">
        <Input
          type="password"
          autoComplete="new-password"
          value={f.confirm}
          onChange={(e) => setF({ ...f, confirm: e.target.value })}
        />
      </FormField>
      <Button className="mt-6" type="submit" disabled={busy}>
        {busy && <Loader2 className="animate-spin" />}
        Update password
      </Button>
    </form>
  );
}

export function EditorialPage({ type }: { type: "about" | "contact" | "terms" | "privacy" }) {
  if (type === "about")
    return (
      <main>
        <section className="relative h-[72vh]">
          <img src={hero} alt="KH Luxury story" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-image-overlay" />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1440px] px-6 pb-14 text-primary-foreground">
            <p className="eyebrow text-luxury">Born in Lagos</p>
            <h1 className="mt-3 max-w-3xl font-display text-6xl sm:text-8xl">
              Clothing for a life of intention.
            </h1>
          </div>
        </section>
        <section className="section grid gap-12 lg:grid-cols-2">
          <h2 className="font-display text-5xl">Our story is one of quiet confidence.</h2>
          <div className="space-y-6 leading-8 text-muted-foreground">
            <p>
              KH Luxury was founded with a belief that African fashion can speak globally without
              losing the character of home. We create modern wardrobe pieces rooted in clarity,
              craft, and confidence.
            </p>
            <p>
              Every silhouette is considered. Every fabric is chosen for how it feels, falls, and
              lives. The result is clothing that does not compete for attention—it holds it.
            </p>
          </div>
        </section>
        <section className="grid md:grid-cols-3">
          {[editorial1, editorial2, editorial3].map((img, i) => (
            <img
              key={img}
              src={img}
              alt={`KH Luxury philosophy ${i + 1}`}
              className="aspect-[3/4] w-full object-cover"
            />
          ))}
        </section>
        <section className="section text-center">
          <p className="eyebrow">Our vision</p>
          <h2 className="mx-auto mt-4 max-w-4xl font-display text-5xl sm:text-7xl">
            To shape a modern language of African luxury—assured, enduring, and entirely its own.
          </h2>
          <p className="mt-8 text-sm">@khluxury · Instagram · TikTok</p>
        </section>
      </main>
    );
  if (type === "contact") return <ContactPage />;
  const isTerms = type === "terms";
  return <PolicyPage isTerms={isTerms} />;
}

function ContactPage() {
  const { settings } = useApp();
  const { brand, whatsapp } = settings;
  return (
      <main>
        <PageIntro
          eyebrow="Private concierge"
          title="We are here to help"
          text="For sizing, orders, customization, or private requests, speak with our team."
        />
        <div className="mx-auto grid max-w-[1100px] gap-12 px-5 pb-24 sm:px-8 lg:grid-cols-2">
          <div className="space-y-8">
            <ContactLine
              title="WhatsApp"
              value={whatsapp.whatsappNumber}
              href={whatsappLink(whatsapp.whatsappNumber, whatsapp.defaultGreeting)}
            />
            {brand.contactEmail && (
              <ContactLine
                title="Email"
                value={brand.contactEmail}
                href={`mailto:${brand.contactEmail}`}
              />
            )}
            {brand.instagramHandle && (
              <ContactLine
                title="Social"
                value={brand.instagramHandle}
                href={`https://www.instagram.com/${brand.instagramHandle.replace(/^@/, "")}`}
              />
            )}
            <p className="max-w-sm text-sm leading-7 text-muted-foreground">
              Concierge hours: {whatsapp.businessHours}. We typically respond within one working
              day.
            </p>
          </div>
          <ContactForm />
        </div>
      </main>
    );
}

function PolicyPage({ isTerms }: { isTerms: boolean }) {
  return (
    <main>
      <PageIntro
        eyebrow="KH Luxury policies"
        title={isTerms ? "Terms & Conditions" : "Privacy Policy"}
        text={`Effective 25 September 2026 · This preview contains representative ${isTerms ? "terms" : "privacy information"} for the frontend experience.`}
      />
      <article className="prose-luxury mx-auto max-w-3xl px-5 pb-24 sm:px-8">
        <h2>{isTerms ? "Orders and acceptance" : "Information we collect"}</h2>
        <p>
          {isTerms
            ? "Orders are subject to availability and confirmation. Prices, delivery estimates, and product details are presented clearly before checkout."
            : "We may collect contact, delivery, order, and communication details necessary to serve you and fulfil purchases."}
        </p>
        <h2>{isTerms ? "Delivery and returns" : "How information is used"}</h2>
        <p>
          {isTerms
            ? "Delivery timelines vary by destination. Eligible unworn items may be returned in original condition within the stated return period."
            : "Information is used to fulfil orders, provide customer care, improve our service, and share updates when you choose to receive them."}
        </p>
        <h2>{isTerms ? "Custom pieces" : "Your choices"}</h2>
        <p>
          {isTerms
            ? "Customized pieces are made to your instruction and may not be eligible for return unless faulty."
            : "You can request access, correction, or deletion of eligible personal information by contacting our concierge."}
        </p>
      </article>
    </main>
  );
}

export function AuthPage({ mode }: { mode: "login" | "register" | "forgot" }) {
  const navigate = useNavigate();
  const title =
    mode === "login"
      ? "Welcome back"
      : mode === "register"
        ? "Create your account"
        : "Reset your password";
  return (
    <main className="grid min-h-[75vh] lg:grid-cols-2">
      <img
        src={editorial2}
        alt="KH Luxury"
        className="hidden h-full w-full object-cover lg:block"
      />
      <div className="flex items-center justify-center px-6 py-16">
        <form
          className="w-full max-w-md"
          onSubmit={(e) => {
            e.preventDefault();
            toast.success("Preview account ready");
            navigate("/account");
          }}
        >
          <p className="eyebrow">KH LUXURY</p>
          <h1 className="mt-3 font-display text-5xl">{title}</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Frontend preview—no real account will be created or accessed.
          </p>
          {mode === "register" && (
            <FormField label="Full name">
              <Input required />
            </FormField>
          )}
          <FormField label="Email">
            <Input type="email" required />
          </FormField>
          {mode !== "forgot" && (
            <FormField label="Password">
              <Input type="password" required />
            </FormField>
          )}
          <Button type="submit" size="lg" className="mt-6 w-full">
            {mode === "login"
              ? "Sign in"
              : mode === "register"
                ? "Create account"
                : "Send reset link"}
          </Button>
          <div className="mt-5 text-center text-sm">
            {mode === "login" ? (
              <>
                <Link to="/forgot-password" className="underline">
                  Forgot password?
                </Link>
                <p className="mt-3">
                  New to KH?{" "}
                  <Link to="/register" className="underline">
                    Create account
                  </Link>
                </p>
              </>
            ) : (
              <Link to="/login" className="underline">
                Return to sign in
              </Link>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}

export function PaymentPage({ receipt = false }: { receipt?: boolean }) {
  return (
    <RequireAuth role="customer">
      <Payment_ receipt={receipt} />
    </RequireAuth>
  );
}
function Payment_({ receipt }: { receipt: boolean }) {
  const { settings, submitReceipt } = useApp();
  const navigate = useNavigate();
  const { order, payment } = useOrderFromQuery();
  const [file, setFile] = useState<{ name: string; type: string; dataUrl: string } | null>(null);
  const [busy, setBusy] = useState(false);
  if (!order || !payment)
    return (
      <main>
        <PageIntro eyebrow="Payments" title="No payment due" />
        <EmptyState
          title="Nothing is waiting for payment"
          text="All your orders are paid or awaiting verification."
          link="/account/orders"
          action="My orders"
        />
      </main>
    );
  const done = payment.status === "paid" || payment.status === "pending_verification";
  return (
    <main>
      <PageIntro
        eyebrow={`Order ${order.id} · ${formatPrice(order.total)}`}
        title={receipt ? "Upload your receipt" : "Complete your transfer"}
        text={
          receipt
            ? "Your receipt helps our team verify your payment promptly."
            : "Use the account details below, then upload proof of transfer."
        }
      />
      <div className="mx-auto max-w-2xl px-5 pb-24 sm:px-8">
        {done ? (
          <div className="border bg-secondary p-8 text-sm">
            <p>
              This payment is <strong>{PAYMENT_LABELS[payment.status].toLowerCase()}</strong>.
            </p>
            <Button asChild className="mt-5">
              <Link to={`/account/orders/${encodeURIComponent(order.id)}`}>View order</Link>
            </Button>
          </div>
        ) : receipt ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!file) { toast.error("Choose your payment receipt first."); return; }
              setBusy(true);
              const ok = await submitReceipt(order.id, file);
              setBusy(false);
              if (ok) {
                toast.success("Receipt submitted for verification");
                navigate(`/order-confirmation?order=${encodeURIComponent(order.id)}`);
              }
            }}
          >
            <ReceiptPicker value={file} onChange={setFile} />
            <Button type="submit" className="mt-6 w-full" disabled={busy}>
              {busy && <Loader2 className="animate-spin" />}
              Submit receipt
            </Button>
          </form>
        ) : (
          <>
            <BankDetails
              amount={order.total}
              reference={order.id}
              instructions={settings.payment.paymentInstructions}
            />
            <Button asChild className="mt-5 w-full">
              <Link to={`/payment-receipt?order=${encodeURIComponent(order.id)}`}>
                Upload receipt
              </Link>
            </Button>
          </>
        )}
      </div>
    </main>
  );
}

function FormField({
  label,
  err,
  children,
}: {
  label: string;
  err?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5">
      <Label className="mb-2 block text-xs uppercase tracking-wider">{label}</Label>
      {children}
      {err && <p className="mt-1 text-xs text-destructive">{err}</p>}
    </div>
  );
}
/** Enquiries go straight to the concierge on WhatsApp with the details pre-filled. */
function ContactForm() {
  const { settings, user } = useApp();
  const [f, setF] = useState({ name: user?.name ?? "", email: user?.email ?? "", phone: user?.phone ?? "", message: "" });
  return (
    <form
      className="max-w-2xl"
      onSubmit={(e) => {
        e.preventDefault();
        if (f.name.trim().length < 2) { toast.error("Enter your name"); return; }
        if (f.message.trim().length < 5) { toast.error("Tell us how we can help"); return; }
        const text = `Hello KH Luxury, I'm ${f.name.trim()}.\n\n${f.message.trim()}\n\n${[f.email, f.phone].filter(Boolean).join(" · ")}`;
        window.open(whatsappLink(settings.whatsapp.whatsappNumber, text), "_blank", "noopener");
      }}
    >
      <h2 className="font-display text-3xl">Send an enquiry</h2>
      <FormField label="Full name">
        <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      </FormField>
      <FormField label="Email">
        <Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      </FormField>
      <FormField label="Phone">
        <Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
      </FormField>
      <FormField label="How can we help?">
        <Textarea
          className="min-h-32"
          maxLength={1500}
          value={f.message}
          onChange={(e) => setF({ ...f, message: e.target.value })}
        />
      </FormField>
      <Button className="mt-6" type="submit">
        Send on WhatsApp <ArrowRight />
      </Button>
    </form>
  );
}
function ContactLine({ title, value, href }: { title: string; value: string; href?: string }) {
  return (
    <div className="border-b pb-6">
      <p className="eyebrow">{title}</p>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="mt-2 block font-display text-3xl hover:text-luxury"
        >
          {value}
        </a>
      ) : (
        <p className="mt-2 font-display text-3xl">{value}</p>
      )}
    </div>
  );
}
function titleCase(s: string) {
  return s.replaceAll("-", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

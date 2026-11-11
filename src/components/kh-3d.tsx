import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Product } from "@/lib/mock-data";
import { formatPrice } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const canHover = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Tilts its content in 3D toward the cursor, with a soft light glare. Inert on touch devices. */
export function Tilt({
  children,
  className,
  max = 8,
  glare = true,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  glare?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const move = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse" || !canHover()) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.style.setProperty("--rx", `${(0.5 - y) * max * 2}deg`);
      el.style.setProperty("--ry", `${(x - 0.5) * max * 2}deg`);
      el.style.setProperty("--gx", `${x * 100}%`);
      el.style.setProperty("--gy", `${y * 100}%`);
      el.style.setProperty("--go", "1");
    });
  };
  const leave = () => {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(frame.current);
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--go", "0");
  };
  return (
    <div className="[perspective:1000px]">
      <div
        ref={ref}
        onPointerMove={move}
        onPointerLeave={leave}
        className={cn(
          "relative transition-[transform,box-shadow] duration-500 ease-out will-change-transform [transform-style:preserve-3d] [transform:rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))]",
          className,
        )}
      >
        {children}
        {glare && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10 opacity-[var(--go,0)] mix-blend-soft-light transition-opacity duration-500"
            style={{
              background:
                "radial-gradient(circle at var(--gx,50%) var(--gy,50%), rgba(255,255,255,.55), transparent 55%)",
            }}
          />
        )}
      </div>
    </div>
  );
}

/** Mouse parallax: children with data-depth="n" drift by n px opposite the cursor. */
export function useParallax<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root || !canHover()) return;
    let raf = 0;
    const layers = Array.from(root.querySelectorAll<HTMLElement>("[data-depth]"));
    const on = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        for (const l of layers) {
          const d = Number(l.dataset["depth"]);
          l.style.transform = `translate3d(${-x * d}px, ${-y * d}px, 0) rotateX(${y * d * 0.08}deg) rotateY(${-x * d * 0.08}deg)`;
        }
      });
    };
    const reset = () => layers.forEach((l) => (l.style.transform = ""));
    root.addEventListener("pointermove", on);
    root.addEventListener("pointerleave", reset);
    return () => {
      cancelAnimationFrame(raf);
      root.removeEventListener("pointermove", on);
      root.removeEventListener("pointerleave", reset);
    };
  }, []);
  return ref;
}

/** A 3D ring of products that slowly rotates; drag or swipe to spin it. */
export function Carousel3D({ products }: { products: Product[] }) {
  const stage = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const n = products.length;
  const step = 360 / n;

  useEffect(() => {
    const st = stage.current;
    const el = ring.current;
    if (!st || !el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let angle = 0;
    let velocity = 0;
    let dragging = false;
    let hovering = false;
    let lastX = 0;
    let moved = 0;
    let raf = 0;

    const layout = () => {
      const w = st.clientWidth < 640 ? 170 : 240;
      const radius = Math.round(w / 2 / Math.tan(Math.PI / n)) + (st.clientWidth < 640 ? 30 : 70);
      st.style.setProperty("--card-w", `${w}px`);
      st.style.setProperty("--radius", `${radius}px`);
    };
    layout();
    window.addEventListener("resize", layout);

    const tick = () => {
      if (!dragging) {
        velocity *= 0.94;
        angle += velocity + (hovering || reduce ? 0 : 0.08);
      }
      el.style.transform = `translateZ(calc(var(--radius) * -1)) rotateY(${angle}deg)`;
      // Fade cards facing away so the front reads clearly.
      el.querySelectorAll<HTMLElement>("[data-i]").forEach((c) => {
        const a = (((Number(c.dataset["i"]) * step + angle) % 360) + 360) % 360;
        const facing = Math.cos((a * Math.PI) / 180);
        c.style.opacity = String(0.25 + Math.max(0, facing) * 0.75);
        c.style.filter = facing < 0.2 ? "grayscale(.7) blur(1px)" : "";
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const down = (e: PointerEvent) => {
      dragging = true;
      moved = 0;
      lastX = e.clientX;
      velocity = 0;
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      moved += Math.abs(dx);
      angle += dx * 0.25;
      velocity = dx * 0.25;
    };
    const up = () => (dragging = false);
    // Swallow the click that ends a drag so it doesn't open a product.
    const click = (e: MouseEvent) => {
      if (moved > 6) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const enter = () => (hovering = true);
    const leave = () => {
      hovering = false;
      dragging = false;
    };
    st.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    st.addEventListener("click", click, true);
    st.addEventListener("pointerenter", enter);
    st.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", layout);
      st.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      st.removeEventListener("click", click, true);
      st.removeEventListener("pointerenter", enter);
      st.removeEventListener("pointerleave", leave);
    };
  }, [n, step]);

  return (
    <div
      ref={stage}
      className="relative mx-auto h-[420px] w-full cursor-grab touch-pan-y select-none [perspective:1400px] active:cursor-grabbing sm:h-[520px]"
    >
      <div
        ref={ring}
        className="absolute left-1/2 top-1/2 [transform-style:preserve-3d]"
        style={{ width: 0, height: 0 }}
      >
        {products.map((p, i) => (
          <Link
            key={p.id}
            to={`/product/${p.id}`}
            data-i={i}
            draggable={false}
            className="group absolute block [backface-visibility:hidden]"
            style={
              {
                width: "var(--card-w)",
                left: "calc(var(--card-w) / -2)",
                top: "calc(var(--card-w) * -0.75)",
                transform: `rotateY(${i * step}deg) translateZ(var(--radius))`,
                transition: "opacity .3s, filter .3s",
              } as CSSProperties
            }
          >
            <div className="relative overflow-hidden bg-secondary shadow-[0_30px_60px_-25px_rgba(0,0,0,.55)] ring-1 ring-luxury/20">
              <img
                src={p.image}
                alt={p.name}
                draggable={false}
                loading="lazy"
                className="aspect-[3/4] w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary/85 to-transparent p-4 pt-12 text-primary-foreground">
                <p className="truncate font-display text-lg sm:text-xl">{p.name}</p>
                <p className="mt-0.5 text-[11px] tracking-wider text-luxury">
                  {formatPrice(p.price)}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {/* Reflective floor */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[10%] bottom-2 h-16 rounded-[50%] bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--luxury)_35%,transparent),transparent_70%)] blur-xl"
      />
    </div>
  );
}

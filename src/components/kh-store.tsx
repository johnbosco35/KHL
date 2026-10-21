import { Link, useLocation, useNavigate } from "react-router-dom";
import { type ReactNode } from "react";
import { Heart, Menu, Search, ShoppingBag, UserRound, MessageCircle, ArrowRight, Minus, Plus, LogOut } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/1.jpeg";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Customization, Product } from "@/lib/mock-data";
import { formatPrice } from "@/lib/mock-data";
import { AppProvider, savePending, useApp, type PendingAction } from "@/lib/app-store";
import { cn } from "@/lib/utils";

export const StoreProvider = AppProvider;

/** Customer actions that require a signed-in customer. Guests are sent to sign in and the action resumes afterwards. */
export function useStore() {
  const app = useApp(); const navigate = useNavigate(); const { pathname, search, hash } = useLocation(); const path = `${pathname}${search}${hash}`;
  const gate = (action: PendingAction): boolean => {
    if (!app.user) { savePending(action); toast("Please create an account or sign in to continue."); navigate(`/login?redirect=${encodeURIComponent(action.returnTo)}`); return false; }
    if (app.user.role !== "customer") { toast.error("Admin accounts cannot shop. Sign in with a customer account."); return false; }
    return true;
  };
  return {
    cart: app.cart, wishlist: app.wishlist, user: app.user,
    addToCart: (product: Product, size?: string, color?: string, quantity = 1, customization?: Customization) => {
      if (product.stock <= 0) { toast.error("This piece is currently sold out."); return; }
      if (gate({ type: "cart", productId: product.id, size: size ?? product.sizes.at(0) ?? "M", color: color ?? product.colors.at(0) ?? "Obsidian", quantity, returnTo: path })) app.addToCart(product, size, color, quantity, customization);
    },
    toggleWishlist: (id: string) => { if (gate({ type: "wishlist", productId: id, returnTo: path })) app.toggleWishlist(id); },
    requireCustomer: (returnTo = path) => gate({ type: "navigate", returnTo }),
    removeFromCart: app.removeFromCart, updateQuantity: app.updateQuantity,
  };
}

const nav = [["Home", "/"], ["Shop", "/shop"], ["Collections", "/collections"], ["Customize", "/customize"], ["About", "/about"]] as const;
export function Logo({ inverse = false, compact = false }: { inverse?: boolean; compact?: boolean }) {
  return (
    <span
      className={cn(
        "relative block overflow-hidden",
        compact ? "h-10 w-16" : "h-12 w-24",
      )}
    >
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
  const { user, signOut } = useApp(); const navigate = useNavigate();
  if (!user) return <Link to="/login" aria-label="Sign in" className="icon-link"><UserRound /></Link>;
  return <DropdownMenu><DropdownMenuTrigger asChild><button aria-label="Account menu" className="icon-link"><UserRound className="text-luxury" /></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-56"><DropdownMenuLabel className="font-normal"><p className="text-sm">{user.name}</p><p className="text-xs text-muted-foreground">{user.email}</p></DropdownMenuLabel><DropdownMenuSeparator />{user.role === "admin" ? <DropdownMenuItem onClick={() => navigate("/admin/dashboard")}>Admin dashboard</DropdownMenuItem> : <><DropdownMenuItem onClick={() => navigate("/account")}>My account</DropdownMenuItem><DropdownMenuItem onClick={() => navigate("/account/orders")}>My orders</DropdownMenuItem></>}<DropdownMenuSeparator /><DropdownMenuItem onClick={() => { signOut(); toast("You have been signed out"); navigate("/", { replace: true }); }}><LogOut /> Sign out</DropdownMenuItem></DropdownMenuContent></DropdownMenu>;
}

export function SiteHeader() {
  const { pathname: path } = useLocation();
  const { cart, wishlist, user } = useApp();
  return <>
    <div className="bg-primary px-4 py-2 text-center text-[10px] uppercase tracking-[0.22em] text-primary-foreground">Complimentary delivery in Lagos on orders over ₦150,000</div>
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur">
      <div className="mx-auto grid h-20 max-w-[1440px] grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:px-8">
        <Sheet><SheetTrigger asChild><Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu"><Menu /></Button></SheetTrigger><SheetContent side="left" className="w-full max-w-sm"><SheetHeader><SheetTitle><Logo /></SheetTitle></SheetHeader><nav className="mt-12 grid gap-1">{nav.map(([label, to]) => <Link key={to} to={to} className="border-b py-4 font-display text-2xl">{label}</Link>)}<Link to={user ? "/account" : "/login"} className="border-b py-4 font-display text-2xl">{user ? "My account" : "Sign in"}</Link></nav><Link to="/contact" className="mt-10 flex items-center gap-2 text-sm"><MessageCircle className="size-4 text-luxury" /> WhatsApp concierge</Link></SheetContent></Sheet>
        <Link to="/" className="justify-self-center lg:justify-self-start"><Logo /></Link>
        <nav className="hidden items-center justify-center gap-8 lg:flex">{nav.map(([label,to]) => <Link key={to} to={to} className={cn("text-xs uppercase tracking-[0.14em] transition-colors hover:text-luxury", path === to && "text-luxury")}>{label}</Link>)}</nav>
        <div className="flex items-center justify-end gap-1">
          <Link to="/shop" aria-label="Search" className="icon-link"><Search /></Link>
          <Link to="/wishlist" aria-label="Wishlist" className="icon-link relative"><Heart /><Count value={wishlist.length} /></Link>
          <CartDrawer><span className="icon-link relative"><ShoppingBag /><Count value={cart.reduce((n,i)=>n+i.quantity,0)} /></span></CartDrawer>
          <AccountMenu />
        </div>
      </div>
    </header>
  </>;
}
function Count({ value }: { value: number }) { return value ? <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-luxury text-[9px] font-bold text-primary">{value}</span> : null; }

export function CartDrawer({ children }: { children: ReactNode }) {
 const { cart, removeFromCart, updateQuantity } = useApp(); const subtotal = cart.reduce((s,i)=>s+i.product.price*i.quantity,0);
 return <Sheet><SheetTrigger asChild><button aria-label="Open shopping bag">{children}</button></SheetTrigger><SheetContent className="flex w-full max-w-md flex-col sm:max-w-md"><SheetHeader><SheetTitle className="font-display text-3xl font-normal">Your Bag</SheetTitle></SheetHeader><div className="mt-6 flex-1 space-y-6 overflow-auto">{cart.length === 0 ? <EmptyState title="Your bag is empty" text="Explore the latest KH Luxury pieces." link="/shop" action="Shop collection" /> : cart.map(({key,product,quantity,size,color,customization})=><div key={key} className="grid grid-cols-[88px_1fr] gap-4 border-b pb-6"><img src={product.image} alt={product.name} className="aspect-[3/4] w-full object-cover"/><div className="min-w-0"><p className="font-display text-lg">{product.name}</p><p className="mt-1 text-xs text-muted-foreground">{color} / {size}{customization?" · Custom":""}</p><div className="mt-4 flex items-center justify-between"><Quantity value={quantity} onChange={(v)=>updateQuantity(key,v)}/><span className="text-sm">{formatPrice(product.price*quantity)}</span></div><Button variant="link" className="mt-2 h-auto p-0 text-xs text-muted-foreground" onClick={()=>removeFromCart(key)}>Remove</Button></div></div>)}</div>{cart.length>0&&<div className="border-t pt-5"><div className="mb-5 flex justify-between"><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div><Button asChild size="lg" className="w-full"><Link to="/checkout">Proceed to checkout <ArrowRight /></Link></Button><Button asChild variant="outline" size="lg" className="mt-2 w-full"><Link to="/cart">View bag</Link></Button></div>}</SheetContent></Sheet>;
}

export function ProductCard({ product }: { product: Product }) { const { addToCart, toggleWishlist, wishlist } = useStore(); const liked=wishlist.includes(product.id); const soldOut=product.stock<=0; return <article className="group min-w-0"><div className="relative overflow-hidden bg-secondary"><Link to={`/product/${product.id}`}><img src={product.image} alt={product.name} loading="lazy" className="aspect-[3/4] w-full object-cover transition-transform duration-700 group-hover:scale-[1.025]" /></Link><Button variant="secondary" size="icon" className="absolute right-3 top-3 rounded-full" aria-label={liked?"Remove from wishlist":"Add to wishlist"} onClick={()=>toggleWishlist(product.id)}><Heart className={liked?"fill-current text-luxury":""}/></Button><div className="absolute inset-x-3 bottom-3 grid translate-y-3 grid-cols-2 gap-2 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100"><Button asChild variant="secondary"><Link to={`/product/${product.id}`}>View details</Link></Button><Button disabled={soldOut} onClick={()=>addToCart(product)}>{soldOut?"Sold out":"Add to bag"}</Button></div>{product.newArrival&&<span className="absolute left-3 top-3 bg-background px-2 py-1 text-[9px] uppercase tracking-[.15em]">New</span>}</div><div className="pt-4"><p className="text-[10px] uppercase tracking-[.16em] text-muted-foreground">{product.category}</p><div className="mt-1 grid grid-cols-[minmax(0,1fr)_auto] gap-2"><Link to={`/product/${product.id}`} className="min-w-0 truncate font-display text-lg">{product.name}</Link><span className="shrink-0 text-sm">{formatPrice(product.price)}</span></div><div className="mt-2 flex gap-1.5">{product.colors.map(c=><span key={c} title={c} className={cn("size-3 rounded-full border border-border", c==="Obsidian"&&"bg-primary", c==="Ivory"&&"bg-background", c==="Espresso"&&"bg-deep", c==="Sand"&&"bg-secondary")}/>)}</div></div></article>; }

export function Quantity({ value, onChange }: {value:number;onChange:(value:number)=>void}) { return <div className="grid h-9 grid-cols-3 items-center border"><Button variant="ghost" size="icon" className="size-8" onClick={()=>onChange(value-1)} aria-label="Decrease"><Minus/></Button><span className="text-center text-sm">{value}</span><Button variant="ghost" size="icon" className="size-8" onClick={()=>onChange(value+1)} aria-label="Increase"><Plus/></Button></div>; }

export function EmptyState({title,text,link,action}:{title:string;text:string;link?:string;action?:string}) { return <div className="mx-auto max-w-md py-20 text-center"><ShoppingBag className="mx-auto size-8 text-luxury"/><h2 className="mt-5 font-display text-3xl">{title}</h2><p className="mt-2 text-sm text-muted-foreground">{text}</p>{link&&action&&<Button asChild className="mt-6"><Link to={link}>{action}</Link></Button>}</div>; }

export function SiteFooter(){ return <footer className="bg-primary text-primary-foreground"><div className="mx-auto grid max-w-[1440px] gap-12 px-6 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-10"><div><Logo inverse/><p className="mt-5 max-w-xs text-sm leading-6 text-primary-foreground/60">Modern African luxury, shaped with confidence and made for a considered life.</p></div><FooterList title="Explore" items={[["Shop","/shop"],["Collections","/collections"],["Customize","/customize"]]}/><FooterList title="Company" items={[["About","/about"],["Contact","/contact"],["Admin","/admin/login"]]}/><div><p className="text-xs uppercase tracking-[.18em] text-luxury">Concierge</p><p className="mt-4 text-sm text-primary-foreground/60">WhatsApp<br/>+234 800 KH LUXURY</p><div className="mt-5 flex gap-4 text-xs uppercase tracking-wider"><span>Instagram</span><span>TikTok</span></div></div></div><div className="border-t border-primary-foreground/10 px-6 py-5 text-center text-[10px] uppercase tracking-wider text-primary-foreground/45">© 2026 KH Luxury · <Link to="/terms">Terms</Link> · <Link to="/privacy">Privacy</Link></div></footer> }
function FooterList({title,items}:{title:string;items:readonly (readonly [string,string])[]}) { return <div><p className="text-xs uppercase tracking-[.18em] text-luxury">{title}</p><div className="mt-4 grid gap-3">{items.map(([label,to])=><Link key={to} to={to} className="text-sm text-primary-foreground/60 hover:text-primary-foreground">{label}</Link>)}</div></div> }

export function WhatsAppButton(){ return <a href="https://wa.me/2348000000000" target="_blank" rel="noreferrer" aria-label="Contact KH Luxury on WhatsApp" className="fixed bottom-5 right-5 z-40 grid size-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:-translate-y-1"><MessageCircle/></a> }

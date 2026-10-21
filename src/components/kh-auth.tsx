import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import editorial2 from "@/assets/kh-editorial-2.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/kh-store";
import { takePending, useApp, type AppStore } from "@/lib/app-store";
import type { Role } from "@/lib/mock-data";

type Mode = "login" | "register" | "forgot" | "reset";
const pw = z.string().min(8, "Password must be at least 8 characters").max(72);
const email = z.string().trim().email("Enter a valid email").max(255);
const schemas = {
  login: z.object({ email, password: z.string().min(1, "Enter your password") }),
  register: z.object({ name: z.string().trim().min(2, "Enter your full name").max(100), email, phone: z.string().trim().regex(/^[+\d][\d\s-]{6,19}$/, "Enter a valid phone number"), password: pw, confirm: z.string() }).refine((d) => d.password === d.confirm, { message: "Passwords do not match", path: ["confirm"] }),
  forgot: z.object({ email }),
  reset: z.object({ password: pw, confirm: z.string() }).refine((d) => d.password === d.confirm, { message: "Passwords do not match", path: ["confirm"] }),
};

/** Runs the action a guest attempted before signing in, then returns them to where they were. */
function resumePending(app: AppStore, fallback: string): string {
  const a = takePending(); if (!a) return fallback;
  const product = "productId" in a ? app.products.find((p) => p.id === a.productId) : undefined;
  if (a.type === "cart" && product) app.addToCart(product, a.size, a.color, a.quantity);
  if (a.type === "wishlist" && product) app.toggleWishlist(a.productId, { onlyAdd: true });
  return a.returnTo || fallback;
}

export function AuthPage({ mode, admin = false, redirect, token }: { mode: Mode; admin?: boolean; redirect?: string; token?: string }) {
  const app = useApp(); const navigate = useNavigate();
  const [errors, setErrors] = useState<Record<string, string>>({}); const [busy, setBusy] = useState(false); const [resetLink, setResetLink] = useState<string | null>(null);
  const role: Role = admin ? "admin" : "customer";
  const home = admin ? "/admin/dashboard" : "/account";
  const title = { login: admin ? "Admin sign in" : "Welcome back", register: "Create your account", forgot: "Forgot password", reset: "Set a new password" }[mode];
  const showMessage = !admin && mode === "login" && !!redirect;

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const raw = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string | undefined>;
    const data = {
      name: raw["name"] ?? "",
      email: raw["email"] ?? "",
      phone: raw["phone"] ?? "",
      password: raw["password"] ?? "",
      confirm: raw["confirm"] ?? "",
    };

    const parsed = schemas[mode].safeParse(data);
    if (!parsed.success) { setErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message]))); return; }
    setErrors({}); setBusy(true); await new Promise((r) => setTimeout(r, 350));
    try {
      if (mode === "login") { const u = app.signIn(data.email, data.password, role); toast.success(`Welcome, ${u.name.split(" ")[0]}`); navigate(admin ? home : resumePending(app, redirect || home)); }
      if (mode === "register") { app.signUp({ name: data.name, email: data.email, phone: data.phone, password: data.password }); toast.success("Your account has been created"); navigate(resumePending(app, redirect || home)); }
      if (mode === "forgot") { const t = app.requestReset(data.email, role); toast.success("If an account exists, a reset link has been sent."); if (t) setResetLink(t); }
      if (mode === "reset") { const u = app.resetPassword(token ?? "", data.password); toast.success("Password updated. Please sign in."); navigate(u.role === "admin" ? "/admin/login" : "/login"); }
    } catch (err) { toast.error(err instanceof Error ? err.message : "Something went wrong"); } finally { setBusy(false); }
  };

  return <main className={admin ? "grid min-h-screen place-items-center bg-admin-bg px-5 py-16" : "grid min-h-[75vh] lg:grid-cols-2"}>
    {!admin && <img src={editorial2} alt="KH Luxury" className="hidden h-full w-full object-cover lg:block" />}
    <div className={admin ? "w-full max-w-md border bg-background p-8 sm:p-10" : "flex items-center justify-center px-6 py-16"}>
      <form noValidate className="w-full max-w-md" onSubmit={submit}>
        {admin ? <div className="mb-6 flex items-center justify-between"><Logo /><span className="flex items-center gap-1 text-[10px] uppercase tracking-[.18em] text-muted-foreground"><ShieldCheck className="size-3 text-luxury" /> Staff only</span></div> : <Logo />}
        <h1 className="mt-3 font-display text-5xl">{title}</h1>
        {showMessage && <p className="mt-4 border-l-2 border-luxury bg-secondary px-4 py-3 text-sm">Please create an account or sign in to continue.</p>}
        {mode === "forgot" && <p className="mt-3 text-sm text-muted-foreground">Enter your email and we will send a link to reset your password.</p>}
        {mode === "reset" && !token && <p className="mt-3 text-sm text-destructive">This reset link is missing its token. Request a new one.</p>}
        {mode === "register" && <><F label="Full name" name="name" err={errors["name"]} autoComplete="name" /><F label="Phone" name="phone" err={errors["phone"]} autoComplete="tel" /></>}
        {mode !== "reset" && <F label="Email" name="email" type="email" err={errors["email"]} autoComplete="email" />}
        {mode !== "forgot" && <F label={mode === "reset" ? "New password" : "Password"} name="password" type="password" err={errors["password"]} autoComplete={mode === "login" ? "current-password" : "new-password"} />}
        {(mode === "register" || mode === "reset") && <F label="Confirm password" name="confirm" type="password" err={errors["confirm"]} autoComplete="new-password" />}
        {resetLink ? <div className="mt-6 border border-luxury bg-secondary p-4 text-sm"><p>Reset email (preview): your secure link is ready.</p><Button asChild className="mt-3 w-full"><Link to={`/reset-password?token=${encodeURIComponent(resetLink)}`} >Open reset link</Link></Button></div>
          : <Button type="submit" size="lg" className="mt-6 w-full" disabled={busy || (mode === "reset" && !token)}>{busy && <Loader2 className="animate-spin" />}{{ login: "Sign in", register: "Create account", forgot: "Send reset link", reset: "Update password" }[mode]}</Button>}
        <div className="mt-5 text-center text-sm">
          {mode === "login" && <><Link to={admin ? "/admin/forgot-password" : "/forgot-password"} className="underline">Forgot password?</Link>{!admin && <p className="mt-3">New to KH? <Link to={redirect ? `/register?redirect=${encodeURIComponent(redirect)}` : "/register"} className="underline">Create account</Link></p>}</>}
          {mode === "register" && <p>Already have an account? <Link to={redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login"} className="underline">Sign in</Link></p>}
          {(mode === "forgot" || mode === "reset") && <Link to={admin ? "/admin/login" : "/login"} className="underline">Return to sign in</Link>}
        </div>
        {mode === "login" && <p className="mt-8 border-t pt-4 text-center text-[11px] text-muted-foreground">Preview accounts — {admin ? "admin@khluxury.com / Admin123!" : "amara@example.com / password123"}</p>}
      </form>
    </div>
  </main>;
}
function F({ label, err, ...props }: { label: string; err?: string | undefined; name: string; type?: string; autoComplete?: string }) {
  return <div className="mt-5"><Label htmlFor={props.name} className="mb-2 block text-xs uppercase tracking-wider">{label}</Label><Input id={props.name} aria-invalid={!!err} {...props} className="h-11" />{err && <p className="mt-1 text-xs text-destructive">{err}</p>}</div>;
}

/** Client-side route gate for the mock session. Replace with server-validated auth later. */
export function RequireAuth({ role, children }: { role: Role; children: ReactNode }) {
  const { ready, user } = useApp(); const navigate = useNavigate();
  const allowed = !!user && user.role === role;
  useEffect(() => {
    if (!ready || allowed) return;
    const href = window.location.pathname + window.location.search;
    if (!user) navigate(role === "admin" ? "/admin/login" : `/login?redirect=${encodeURIComponent(href)}`, { replace: true });
  }, [ready, allowed, user, role, navigate]);
  if (!ready || (!user && !allowed)) return <div className="grid min-h-[50vh] place-items-center"><Loader2 className="size-5 animate-spin text-luxury" /></div>;
  if (!allowed) return <div className="grid min-h-[60vh] place-items-center px-5 text-center"><div><p className="eyebrow">Access denied</p><h1 className="mt-3 font-display text-4xl">{role === "admin" ? "This area is for KH Luxury staff." : "This area is for customer accounts."}</h1><Button asChild className="mt-6"><Link to={user?.role === "admin" ? "/admin/dashboard" : "/"}>{user?.role === "admin" ? "Go to admin" : "Return to the store"}</Link></Button></div></div>;
  return <>{children}</>;
}

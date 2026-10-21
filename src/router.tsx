import { useEffect } from "react";
import {
  createBrowserRouter,
  Link,
  Navigate,
  Outlet,
  RouterProvider,
  ScrollRestoration,
  useLocation,
  useNavigate,
  useParams,
  useRouteError,
  useSearchParams,
} from "react-router-dom";
import {
  AdminShell,
  AdminCategories,
  AdminCustomerDetail,
  AdminCustomers,
  AdminDashboard,
  AdminDelivery,
  AdminGeneric,
  AdminOrderDetail,
  AdminOrders,
  AdminPaymentDetail,
  AdminPayments,
  AdminProducts,
  AdminReviews,
  ProductForm,
} from "@/components/kh-admin";
import { AuthPage } from "@/components/kh-auth";
import {
  AccountPage,
  CartPage,
  CheckoutPage,
  CollectionsPage,
  CustomizePage,
  EditorialPage,
  HomePage,
  OrderConfirmationPage,
  OrderDetailsPage,
  PaymentPage,
  ProductPage,
  ReviewForm,
  ShopPage,
  WishlistPage,
} from "@/components/kh-pages";
import { SiteFooter, SiteHeader, StoreProvider, WhatsAppButton } from "@/components/kh-store";
import { Toaster } from "@/components/ui/sonner";
import { reportLovableError } from "@/lib/lovable-error-reporting";
import { products } from "@/lib/mock-data";

function RootLayout() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    document.title = getPageTitle(pathname);
  }, [pathname]);

  return (
    <StoreProvider>
      {!isAdmin && <SiteHeader />}
      <Outlet />
      {!isAdmin && (
        <>
          <SiteFooter />
          <WhatsAppButton />
        </>
      )}
      <Toaster position="top-right" />
      <ScrollRestoration />
    </StoreProvider>
  );
}

function getPageTitle(pathname: string): string {
  const titles: Record<string, string> = {
    "/": "KH Luxury — Modern African Luxury",
    "/about": "About KH Luxury — Modern African Fashion",
    "/account": "My Account — KH Luxury",
    "/account/orders": "My Orders — KH Luxury",
    "/account/profile": "My Profile — KH Luxury",
    "/account/reviews": "My Reviews — KH Luxury",
    "/account/settings": "Account Settings — KH Luxury",
    "/account/wishlist": "My Wishlist — KH Luxury",
    "/admin/categories": "Categories — KH Luxury",
    "/admin/customers": "Customers — KH Luxury",
    "/admin/dashboard": "Admin Dashboard — KH Luxury",
    "/admin/delivery": "Delivery — KH Luxury",
    "/admin/forgot-password": "Admin Forgot Password — KH Luxury",
    "/admin/login": "Admin Sign In — KH Luxury",
    "/admin/orders": "Orders — KH Luxury",
    "/admin/payments": "Payments — KH Luxury",
    "/admin/products": "Products — KH Luxury",
    "/admin/products/new": "New Product — KH Luxury",
    "/admin/receipts": "Receipts — KH Luxury",
    "/admin/reviews": "Reviews — KH Luxury",
    "/admin/settings/brand": "Brand Settings — KH Luxury",
    "/admin/settings/payment": "Payment Settings — KH Luxury",
    "/admin/settings/profile": "Admin Profile — KH Luxury",
    "/admin/settings/security": "Security Settings — KH Luxury",
    "/admin/settings/whatsapp": "WhatsApp Settings — KH Luxury",
    "/cart": "Shopping Bag — KH Luxury",
    "/checkout": "Checkout — KH Luxury",
    "/collections": "Collections — KH Luxury",
    "/contact": "Contact KH Luxury",
    "/customize": "Customize Your Piece — KH Luxury",
    "/forgot-password": "Forgot Password — KH Luxury",
    "/login": "Sign In — KH Luxury",
    "/order-confirmation": "Order Confirmation — KH Luxury",
    "/payment-instructions": "Payment Instructions — KH Luxury",
    "/payment-receipt": "Payment Receipt — KH Luxury",
    "/privacy": "Privacy Policy — KH Luxury",
    "/register": "Create Account — KH Luxury",
    "/reset-password": "Reset Password — KH Luxury",
    "/reviews": "Reviews — KH Luxury",
    "/shop": "Shop — KH Luxury",
    "/terms": "Terms and Conditions — KH Luxury",
    "/wishlist": "Wishlist — KH Luxury",
  };

  const productId = pathname.match(/^\/product\/([^/]+)$/)?.[1];
  if (productId) {
    const product = products.find((item) => item.id === decodeURIComponent(productId));
    return product ? `${product.name} — KH Luxury` : "Product — KH Luxury";
  }
  if (pathname.startsWith("/category/")) return "Shop by Category — KH Luxury";
  if (/^\/account\/orders\/[^/]+$/.test(pathname)) return "Order Details — KH Luxury";
  if (/^\/admin\/customers\/[^/]+$/.test(pathname)) return "Customer Details — KH Luxury";
  if (/^\/admin\/orders\/[^/]+$/.test(pathname)) return "Order Details — KH Luxury";
  if (/^\/admin\/payments\/[^/]+$/.test(pathname)) return "Payment Details — KH Luxury";
  if (/^\/admin\/products\/[^/]+\/edit$/.test(pathname)) return "Edit Product — KH Luxury";
  return titles[pathname] ?? "KH Luxury";
}

function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-5 text-center">
      <div>
        <p className="eyebrow">404</p>
        <h1 className="mt-3 font-display text-6xl">This page has moved.</h1>
        <p className="mt-4 text-muted-foreground">Return to the KH Luxury collection.</p>
        <Link
          to="/"
          className="mt-6 inline-block border bg-primary px-5 py-3 text-sm text-primary-foreground"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

function RouteErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(error);
    reportLovableError(error, { boundary: "react_router_root_error_boundary" });
  }, [error]);

  return (
    <div className="grid min-h-screen place-items-center px-5 text-center">
      <div>
        <h1 className="font-display text-5xl">This page did not load.</h1>
        <p className="mt-3 text-muted-foreground">Please try again.</p>
        <button
          className="mt-6 bg-primary px-5 py-3 text-primary-foreground"
          onClick={() => navigate(0)}
        >
          Try again
        </button>
      </div>
    </div>
  );
}

function ProductRoute() {
  const { productId } = useParams();
  const product = products.find((item) => item.id === productId);
  return product ? <ProductPage product={product} /> : <NotFoundPage />;
}

function CategoryRoute() {
  const { category } = useParams();
  return category ? <ShopPage initialCategory={category} /> : <NotFoundPage />;
}

function AccountOrderRoute() {
  const { orderId } = useParams();
  return orderId ? <OrderDetailsPage orderId={orderId} /> : <NotFoundPage />;
}

function AdminCustomerRoute() {
  const { customerId } = useParams();
  return customerId ? (
    <AdminShell>
      <AdminCustomerDetail customerId={customerId} />
    </AdminShell>
  ) : (
    <NotFoundPage />
  );
}

function AdminOrderRoute() {
  const { orderId } = useParams();
  return orderId ? (
    <AdminShell>
      <AdminOrderDetail orderId={orderId} />
    </AdminShell>
  ) : (
    <NotFoundPage />
  );
}

function AdminPaymentRoute() {
  const { paymentId } = useParams();
  return paymentId ? (
    <AdminShell>
      <AdminPaymentDetail paymentId={paymentId} />
    </AdminShell>
  ) : (
    <NotFoundPage />
  );
}

function EditProductRoute() {
  const { productId } = useParams();
  return productId ? (
    <AdminShell>
      <ProductForm productId={productId} />
    </AdminShell>
  ) : (
    <NotFoundPage />
  );
}

function LoginRoute() {
  const [searchParams] = useSearchParams();
  const value = searchParams.get("redirect");
  const redirect = value?.startsWith("/") ? value : undefined;
  return <AuthPage mode="login" {...(redirect ? { redirect } : {})} />;
}

function RegisterRoute() {
  const [searchParams] = useSearchParams();
  const value = searchParams.get("redirect");
  const redirect = value?.startsWith("/") ? value : undefined;
  return <AuthPage mode="register" {...(redirect ? { redirect } : {})} />;
}

function ResetPasswordRoute() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? undefined;
  return <AuthPage mode="reset" {...(token ? { token } : {})} />;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "about", element: <EditorialPage type="about" /> },
      { path: "account", element: <AccountPage /> },
      { path: "account/orders", element: <AccountPage view="orders" /> },
      { path: "account/orders/:orderId", element: <AccountOrderRoute /> },
      { path: "account/profile", element: <AccountPage view="profile" /> },
      { path: "account/reviews", element: <AccountPage view="reviews" /> },
      { path: "account/settings", element: <AccountPage view="settings" /> },
      { path: "account/wishlist", element: <AccountPage view="wishlist" /> },
      { path: "admin", element: <Navigate to="/admin/dashboard" replace /> },
      {
        path: "admin/categories",
        element: (
          <AdminShell>
            <AdminCategories />
          </AdminShell>
        ),
      },
      {
        path: "admin/customers",
        element: (
          <AdminShell>
            <AdminCustomers />
          </AdminShell>
        ),
      },
      { path: "admin/customers/:customerId", element: <AdminCustomerRoute /> },
      {
        path: "admin/dashboard",
        element: (
          <AdminShell>
            <AdminDashboard />
          </AdminShell>
        ),
      },
      {
        path: "admin/delivery",
        element: (
          <AdminShell>
            <AdminDelivery />
          </AdminShell>
        ),
      },
      { path: "admin/forgot-password", element: <AuthPage mode="forgot" admin /> },
      { path: "admin/login", element: <AuthPage mode="login" admin /> },
      {
        path: "admin/orders",
        element: (
          <AdminShell>
            <AdminOrders />
          </AdminShell>
        ),
      },
      { path: "admin/orders/:orderId", element: <AdminOrderRoute /> },
      {
        path: "admin/payments",
        element: (
          <AdminShell>
            <AdminPayments view="payments" />
          </AdminShell>
        ),
      },
      { path: "admin/payments/:paymentId", element: <AdminPaymentRoute /> },
      {
        path: "admin/products",
        element: (
          <AdminShell>
            <AdminProducts />
          </AdminShell>
        ),
      },
      {
        path: "admin/products/new",
        element: (
          <AdminShell>
            <ProductForm />
          </AdminShell>
        ),
      },
      { path: "admin/products/:productId/edit", element: <EditProductRoute /> },
      {
        path: "admin/receipts",
        element: (
          <AdminShell>
            <AdminPayments view="receipts" />
          </AdminShell>
        ),
      },
      {
        path: "admin/reviews",
        element: (
          <AdminShell>
            <AdminReviews />
          </AdminShell>
        ),
      },
      {
        path: "admin/settings/brand",
        element: (
          <AdminShell>
            <AdminGeneric view="brand-settings" />
          </AdminShell>
        ),
      },
      {
        path: "admin/settings/payment",
        element: (
          <AdminShell>
            <AdminGeneric view="payment-settings" />
          </AdminShell>
        ),
      },
      {
        path: "admin/settings/profile",
        element: (
          <AdminShell>
            <AdminGeneric view="admin-profile" />
          </AdminShell>
        ),
      },
      {
        path: "admin/settings/security",
        element: (
          <AdminShell>
            <AdminGeneric view="security-settings" />
          </AdminShell>
        ),
      },
      {
        path: "admin/settings/whatsapp",
        element: (
          <AdminShell>
            <AdminGeneric view="whatsapp-settings" />
          </AdminShell>
        ),
      },
      { path: "cart", element: <CartPage /> },
      { path: "category/:category", element: <CategoryRoute /> },
      { path: "checkout", element: <CheckoutPage /> },
      { path: "collections", element: <CollectionsPage /> },
      { path: "contact", element: <EditorialPage type="contact" /> },
      { path: "customize", element: <CustomizePage /> },
      { path: "forgot-password", element: <AuthPage mode="forgot" /> },
      { path: "login", element: <LoginRoute /> },
      { path: "order-confirmation", element: <OrderConfirmationPage /> },
      { path: "payment-instructions", element: <PaymentPage /> },
      { path: "payment-receipt", element: <PaymentPage receipt /> },
      { path: "privacy", element: <EditorialPage type="privacy" /> },
      { path: "product/:productId", element: <ProductRoute /> },
      { path: "register", element: <RegisterRoute /> },
      { path: "reset-password", element: <ResetPasswordRoute /> },
      {
        path: "reviews",
        element: (
          <main className="mx-auto max-w-[1200px] px-5 py-20">
            <ReviewForm />
          </main>
        ),
      },
      { path: "shop", element: <ShopPage /> },
      { path: "terms", element: <EditorialPage type="terms" /> },
      { path: "wishlist", element: <WishlistPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}

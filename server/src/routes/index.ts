import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { CartController, WishlistController } from "../controllers/cart.controller.js";
import { CategoryController, LocationController, ProductController } from "../controllers/catalog.controller.js";
import { OrderController, PaymentController } from "../controllers/order.controller.js";
import { ReviewController } from "../controllers/review.controller.js";
import {
  CustomerController,
  NewsletterController,
  SettingsController,
  StatsController,
  UploadController,
} from "../controllers/admin.controller.js";
import { optionalAuth, requireAdmin, requireAuth, requireCustomer } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rate-limit.js";

const authLimit = rateLimit({ windowMs: 15 * 60_000, max: 20 });
const admin = [requireAuth, requireAdmin];
const customer = [requireAuth, requireCustomer];

export const router = Router();

router.get("/health", (_req, res) => res.json({ ok: true, service: "kh-luxury-api" }));

// ---- Auth & profile ----
router.post("/auth/register", authLimit, AuthController.register);
router.post("/auth/login", authLimit, AuthController.login);
router.post("/auth/forgot-password", authLimit, AuthController.forgotPassword);
router.post("/auth/reset-password", authLimit, AuthController.resetPassword);
router.get("/auth/me", requireAuth, AuthController.me);
router.patch("/auth/me", requireAuth, AuthController.updateMe);
router.post("/auth/me/password", requireAuth, authLimit, AuthController.changePassword);

// ---- Catalogue (public reads; admins see drafts/inactive too) ----
router.get("/products", optionalAuth, ProductController.list);
router.get("/products/:id", optionalAuth, ProductController.get);
router.post("/products", ...admin, ProductController.create);
router.put("/products/:id", ...admin, ProductController.update);
router.delete("/products/:id", ...admin, ProductController.remove);

router.get("/categories", optionalAuth, CategoryController.list);
router.post("/categories", ...admin, CategoryController.create);
router.put("/categories/:id", ...admin, CategoryController.update);
router.delete("/categories/:id", ...admin, CategoryController.remove);

router.get("/delivery-locations", optionalAuth, LocationController.list);
router.post("/delivery-locations", ...admin, LocationController.create);
router.put("/delivery-locations/:id", ...admin, LocationController.update);
router.delete("/delivery-locations/:id", ...admin, LocationController.remove);

// ---- Reviews ----
router.get("/reviews", optionalAuth, ReviewController.list);
router.get("/reviews/mine", ...customer, ReviewController.mine);
router.post("/reviews", ...customer, ReviewController.create);
router.patch("/reviews/:id/status", ...admin, ReviewController.setStatus);
router.delete("/reviews/:id", ...admin, ReviewController.remove);

// ---- Bag & wishlist (customers) ----
router.get("/cart", ...customer, CartController.get);
router.post("/cart", ...customer, CartController.add);
router.patch("/cart/:key", ...customer, CartController.setQuantity);
router.delete("/cart/:key", ...customer, CartController.remove);
router.delete("/cart", ...customer, CartController.clear);

router.get("/wishlist", ...customer, WishlistController.get);
router.put("/wishlist/:productId", ...customer, WishlistController.add);
router.delete("/wishlist/:productId", ...customer, WishlistController.remove);

// ---- Orders & payments ----
router.get("/orders", requireAuth, OrderController.list);
router.post("/orders", ...customer, OrderController.place);
router.get("/orders/:id", requireAuth, OrderController.get);
router.post("/orders/:id/receipt", ...customer, OrderController.submitReceipt);
router.patch("/orders/:id/status", ...admin, OrderController.setStatus);

router.get("/payments", requireAuth, PaymentController.list);
router.get("/payments/:id", requireAuth, PaymentController.get);
router.post("/payments/:id/actions", ...admin, PaymentController.action);

// ---- Store settings ----
router.get("/settings", SettingsController.all);
router.get("/settings/:key", SettingsController.get);
router.put("/settings/:key", ...admin, SettingsController.update);

// ---- Newsletter ----
router.post("/newsletter", rateLimit({ windowMs: 60 * 60_000, max: 10 }), NewsletterController.subscribe);
router.get("/newsletter", ...admin, NewsletterController.list);
router.delete("/newsletter/:email", ...admin, NewsletterController.remove);

// ---- Uploads ----
router.post("/uploads", requireAuth, rateLimit({ windowMs: 60 * 60_000, max: 100 }), UploadController.create);

// ---- Admin ----
router.get("/admin/stats", ...admin, StatsController.dashboard);
router.get("/admin/customers", ...admin, CustomerController.list);
router.get("/admin/customers/:id", ...admin, CustomerController.get);
router.patch("/admin/customers/:id/status", ...admin, CustomerController.setStatus);

import { z } from "zod";
import { ORDER_STATUSES } from "../models/types.js";

/** Request-body schemas, mirroring the frontend form rules. */
const email = z.string().trim().toLowerCase().email("Enter a valid email address").max(200);
const password = z.string().min(8, "Password must be at least 8 characters").max(72);
const role = z.enum(["customer", "admin"]).default("customer");
const text = (max: number) => z.string().trim().max(max);
const naira = z.coerce.number().int().min(0);
/** A hosted URL, a site-relative path, or a data URL that the API will upload. */
const imageRef = z
  .string()
  .trim()
  .refine((v) => /^(https?:\/\/|\/|data:)/.test(v), "Image must be a URL or an uploaded file")
  .max(12_000_000);

export const authSchemas = {
  register: z.object({
    name: text(100).min(2, "Enter your full name"),
    email,
    phone: text(40).default(""),
    password,
  }),
  login: z.object({ email, password: z.string().min(1, "Enter your password"), role }),
  updateProfile: z
    .object({ name: text(100).min(2), email, phone: text(40) })
    .partial()
    .refine((v) => Object.keys(v).length > 0, "Nothing to update"),
  changePassword: z.object({ currentPassword: z.string().min(1), newPassword: password }),
  forgotPassword: z.object({ email, role }),
  resetPassword: z.object({ token: z.string().min(10).max(200), password }),
};

export const productSchema = z.object({
  id: text(120).optional(),
  sku: text(60).optional(),
  name: text(160).min(2, "Enter a product name"),
  category: text(80).min(1, "Choose a category"),
  price: naira.min(1, "Enter a price"),
  image: imageRef.optional(),
  images: z.array(imageRef).max(6).default([]),
  colors: z.array(text(40).min(1)).min(1, "Add at least one color"),
  sizes: z.array(text(20).min(1)).min(1, "Add at least one size"),
  stock: z.coerce.number().int().min(0).default(0),
  featured: z.boolean().default(false),
  newArrival: z.boolean().default(false),
  customizable: z.boolean().default(false),
  status: z.enum(["active", "draft", "archived"]).default("active"),
  specifications: text(4000).default(""),
  description: text(4000).min(10, "Add a description (at least 10 characters)"),
});

export const categorySchema = z.object({
  id: text(120).optional(),
  name: text(80).min(2, "Enter a category name"),
  description: text(1000).default(""),
  image: imageRef.nullish(),
  active: z.boolean().default(true),
});

export const locationSchema = z.object({
  id: text(120).optional(),
  name: text(120).min(2, "Enter a location name"),
  address: text(300).min(3, "Enter an address"),
  description: text(1000).default(""),
  fee: naira,
  eta: text(120).default(""),
  active: z.boolean().default(true),
});

export const reviewSchema = z.object({
  productId: text(120).min(1),
  rating: z.coerce.number().int().min(1).max(5),
  text: text(2000).min(3, "Write a few words about the product"),
  image: imageRef.optional(),
});
export const reviewStatusSchema = z.object({ status: z.enum(["pending", "approved", "hidden", "rejected"]) });

const customization = z.object({
  blank: text(120),
  instructions: text(2000),
  designName: text(200).optional(),
  designData: imageRef.optional(),
});
export const cartAddSchema = z.object({
  productId: text(120).min(1),
  size: text(20).optional(),
  color: text(40).optional(),
  quantity: z.coerce.number().int().min(1).max(99).default(1),
  customization: customization.optional(),
});
export const cartQuantitySchema = z.object({ quantity: z.coerce.number().int().min(1).max(99) });

export const placeOrderSchema = z.object({
  contact: z.object({ name: text(100).min(2), email, phone: text(40).min(5, "Enter a phone number") }),
  delivery: z.object({
    address: text(300).min(3, "Enter a delivery address"),
    city: text(100).min(1, "Enter a city"),
    state: text(100).min(1, "Enter a state"),
    locationId: text(120).min(1, "Choose a delivery location"),
  }),
});
export const orderStatusSchema = z.object({ status: z.enum(ORDER_STATUSES) });

export const receiptSchema = z.object({
  name: text(200).min(1),
  type: text(100).default(""),
  dataUrl: z.string().min(1).max(12_000_000),
});
export const paymentActionSchema = z.object({
  action: z.enum(["confirm", "reject", "resubmit"]),
  note: text(1000).optional(),
});

export const customerStatusSchema = z.object({ status: z.enum(["active", "suspended"]) });
export const newsletterSchema = z.object({ email });
export const uploadSchema = z.object({
  dataUrl: z.string().min(1).max(12_000_000),
  folder: z.enum(["products", "categories", "reviews", "receipts", "designs", "misc"]).default("misc"),
});

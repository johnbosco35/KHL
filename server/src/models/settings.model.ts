import type { Document } from "mongodb";
import { collection } from "../config/db.js";
import { z } from "zod";

/** Store-wide settings edited from /admin/settings/*. Each key holds one JSON document. */
export const settingsSchemas = {
  brand: z.object({
    brandName: z.string().trim().max(120).default("KH Luxury"),
    contactEmail: z.string().trim().max(200).default(""),
    brandStatement: z.string().trim().max(2000).default(""),
    instagramHandle: z.string().trim().max(120).default(""),
  }),
  payment: z.object({
    accountName: z.string().trim().max(200).default(""),
    bankName: z.string().trim().max(200).default(""),
    accountNumber: z.string().trim().max(40).default(""),
    paymentInstructions: z.string().trim().max(2000).default(""),
  }),
  whatsapp: z.object({
    whatsappNumber: z.string().trim().max(40).default(""),
    defaultGreeting: z.string().trim().max(500).default(""),
    businessHours: z.string().trim().max(200).default(""),
  }),
} as const;

export type SettingsKey = keyof typeof settingsSchemas;
export const SETTINGS_KEYS = Object.keys(settingsSchemas) as SettingsKey[];
export type Settings = { [K in SettingsKey]: z.output<(typeof settingsSchemas)[K]> };
type SettingDoc = Document & { key: SettingsKey; value: Record<string, unknown>; updatedAt: Date };

export const defaultSettings: Settings = {
  brand: {
    brandName: "KH Luxury",
    contactEmail: "concierge@khluxury.com",
    brandStatement: "Modern African luxury, shaped with confidence and made for a considered life.",
    instagramHandle: "@khluxury",
  },
  payment: {
    accountName: "KH Luxury",
    bankName: "Example Bank",
    accountNumber: "0000000000",
    paymentInstructions:
      "Transfer the exact order total, then upload your receipt. Your order is confirmed once our team verifies the payment.",
  },
  whatsapp: {
    whatsappNumber: "+234 800 000 0000",
    defaultGreeting: "Hello KH Luxury, I'd like help with an order.",
    businessHours: "Mon–Sat, 9am–6pm WAT",
  },
};

export const SettingsModel = {
  async getAll(): Promise<Settings> {
    const docs = await collection<SettingDoc>("settings").find().toArray();
    const out = structuredClone(defaultSettings) as Record<SettingsKey, unknown>;
    for (const doc of docs) {
      if (doc.key in settingsSchemas) {
        const key = doc.key;
        const parsed = settingsSchemas[key].safeParse({ ...(out[key] as object), ...doc.value });
        if (parsed.success) out[key] = parsed.data;
      }
    }
    return out as Settings;
  },
  async get<K extends SettingsKey>(key: K): Promise<Settings[K]> {
    return (await this.getAll())[key];
  },
  async set<K extends SettingsKey>(key: K, value: Settings[K]): Promise<Settings[K]> {
    await collection<SettingDoc>("settings").updateOne(
      { key }, { $set: { value, updatedAt: new Date() } }, { upsert: true },
    );
    return value;
  },
};

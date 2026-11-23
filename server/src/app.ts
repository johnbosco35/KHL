import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env, isAllowedOrigin, isProd } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { router } from "./routes/index.js";
import { UPLOAD_DIR } from "./services/storage.service.js";

export function createApp() {
  const app = express();
  if (isProd) app.set("trust proxy", 1); // behind Render/Railway/Vercel proxies, so req.ip is the client

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(
    cors({
      origin: (origin, cb) => cb(null, !origin || isAllowedOrigin(origin)),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: env.JSON_LIMIT }));

  app.use("/uploads", express.static(UPLOAD_DIR, { maxAge: "30d", immutable: true }));
  app.get("/", (_req, res) => res.json({ name: "KH Luxury API", health: "/api/health" }));
  app.use("/api", router);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

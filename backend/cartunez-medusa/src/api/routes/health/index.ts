import { Router } from "express";
import type { MedusaRequest, MedusaResponse } from "@medusajs/medusa";

type DatabaseManager = { query: (sql: string) => Promise<unknown> };
type RedisClient = { ping: () => Promise<string> };

export default () => {
  const router = Router();

  router.get("/health", (_req: MedusaRequest, res: MedusaResponse) => {
    res.status(200).json({ status: "ok", service: "cartunez-medusa" });
  });

  router.get("/ready", async (req: MedusaRequest, res: MedusaResponse) => {
    const checks = { database: "unavailable", redis: "unavailable" };

    try {
      const manager = req.scope.resolve<DatabaseManager>("manager");
      await manager.query("SELECT 1");
      checks.database = "ok";

      const redis = req.scope.resolve<RedisClient>("redisClient");
      checks.redis = (await redis.ping()) === "PONG" ? "ok" : "unavailable";
    } catch (error) {
      req.scope.resolve("logger").warn("Readiness dependency check failed");
    }

    const ready = checks.database === "ok" && checks.redis === "ok";
    res.status(ready ? 200 : 503).json({
      status: ready ? "ready" : "not_ready",
      checks,
    });
  });

  return router;
};

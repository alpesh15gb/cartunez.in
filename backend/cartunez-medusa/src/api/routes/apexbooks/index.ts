import { Router } from "express";
import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";

export default () => {
  const router = Router();

  router.get("/apexbooks/health", async (req: MedusaRequest, res: MedusaResponse) => {
    const service = req.scope.resolve("apexbooksIntegrationService");
    res.json({
      status: "ok",
      config: service.getConfig(),
    });
  });

  router.post("/apexbooks/webhooks", async (req: MedusaRequest, res: MedusaResponse) => {
    try {
      const service = req.scope.resolve("apexbooksIntegrationService");
      const result = await service.handleInboundWebhook(req.body as Record<string, any>, req.headers);
      res.status(result.status === "skipped" ? 200 : 202).json(result);
    } catch (error: any) {
      req.scope.resolve("logger").error("[ApexBooks] inbound webhook failed", error);
      res.status(400).json({
        status: "failed",
        message: error.message || "ApexBooks webhook failed",
      });
    }
  });

  router.post("/apexbooks/webhooks/products", async (req: MedusaRequest, res: MedusaResponse) => {
    try {
      const service = req.scope.resolve("apexbooksIntegrationService");
      const eventId = String(req.headers["x-apexbooks-event-id"] || (req.body as any).event_id || Date.now());
      service.verifyWebhook(req.body as Record<string, any>, req.headers);
      const result = await service.syncProduct((req.body as any).data || req.body, eventId);
      res.status(result.status === "skipped" ? 200 : 202).json(result);
    } catch (error: any) {
      req.scope.resolve("logger").error("[ApexBooks] product webhook failed", error);
      res.status(400).json({ status: "failed", message: error.message });
    }
  });

  router.post("/apexbooks/webhooks/prices", async (req: MedusaRequest, res: MedusaResponse) => {
    try {
      const service = req.scope.resolve("apexbooksIntegrationService");
      const eventId = String(req.headers["x-apexbooks-event-id"] || (req.body as any).event_id || Date.now());
      service.verifyWebhook(req.body as Record<string, any>, req.headers);
      const result = await service.syncPrice((req.body as any).data || req.body, eventId);
      res.status(result.status === "skipped" ? 200 : 202).json(result);
    } catch (error: any) {
      req.scope.resolve("logger").error("[ApexBooks] price webhook failed", error);
      res.status(400).json({ status: "failed", message: error.message });
    }
  });

  router.post("/apexbooks/webhooks/inventory", async (req: MedusaRequest, res: MedusaResponse) => {
    try {
      const service = req.scope.resolve("apexbooksIntegrationService");
      const eventId = String(req.headers["x-apexbooks-event-id"] || (req.body as any).event_id || Date.now());
      service.verifyWebhook(req.body as Record<string, any>, req.headers);
      const result = await service.syncInventory((req.body as any).data || req.body, eventId);
      res.status(result.status === "skipped" ? 200 : 202).json(result);
    } catch (error: any) {
      req.scope.resolve("logger").error("[ApexBooks] inventory webhook failed", error);
      res.status(400).json({ status: "failed", message: error.message });
    }
  });

  router.post("/apexbooks/webhooks/customers", async (req: MedusaRequest, res: MedusaResponse) => {
    try {
      const service = req.scope.resolve("apexbooksIntegrationService");
      const eventId = String(req.headers["x-apexbooks-event-id"] || (req.body as any).event_id || Date.now());
      service.verifyWebhook(req.body as Record<string, any>, req.headers);
      const result = await service.syncCustomer((req.body as any).data || req.body, eventId);
      res.status(result.status === "skipped" ? 200 : 202).json(result);
    } catch (error: any) {
      req.scope.resolve("logger").error("[ApexBooks] customer webhook failed", error);
      res.status(400).json({ status: "failed", message: error.message });
    }
  });

  return router;
};

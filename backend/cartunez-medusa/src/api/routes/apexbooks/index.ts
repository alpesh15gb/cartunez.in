import { Router } from "express";
import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";

export default () => {
  const router = Router();

  const healthHandler = async (req: MedusaRequest, res: MedusaResponse) => {
    const service = req.scope.resolve("apexbooksIntegrationService");
    res.json({
      status: "ok",
      config: service.getConfig(),
    });
  };

  const genericWebhookHandler = async (req: MedusaRequest, res: MedusaResponse) => {
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
  };

  const productWebhookHandler = async (req: MedusaRequest, res: MedusaResponse) => {
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
  };

  const priceWebhookHandler = async (req: MedusaRequest, res: MedusaResponse) => {
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
  };

  const inventoryWebhookHandler = async (req: MedusaRequest, res: MedusaResponse) => {
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
  };

  const customerWebhookHandler = async (req: MedusaRequest, res: MedusaResponse) => {
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
  };

  router.get("/apexbooks/health", healthHandler);
  router.post("/apexbooks/webhooks", genericWebhookHandler);
  router.post("/apexbooks/webhooks/products", productWebhookHandler);
  router.post("/apexbooks/webhooks/prices", priceWebhookHandler);
  router.post("/apexbooks/webhooks/inventory", inventoryWebhookHandler);
  router.post("/apexbooks/webhooks/customers", customerWebhookHandler);

  router.get("/apexbooks/v1/health", healthHandler);
  router.post("/apexbooks/v1/webhooks", genericWebhookHandler);
  router.post("/apexbooks/v1/webhooks/products", productWebhookHandler);
  router.post("/apexbooks/v1/webhooks/prices", priceWebhookHandler);
  router.post("/apexbooks/v1/webhooks/inventory", inventoryWebhookHandler);
  router.post("/apexbooks/v1/webhooks/customers", customerWebhookHandler);

  return router;
};

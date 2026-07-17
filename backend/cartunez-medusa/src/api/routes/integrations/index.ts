import { Router } from "express";
import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import authenticate from "@medusajs/medusa/dist/api/middlewares/authenticate";
import IntegrationService from "../../../services/integration-service";

export default () => {
  const router = Router();

  // All integration admin routes require authentication
  router.use(authenticate());

  // ─── App Definitions ────────────────────────────────────────────────────

  router.get("/admin/integrations/apps", async (req: MedusaRequest, res: MedusaResponse) => {
    try {
      const service = req.scope.resolve("integrationService") as IntegrationService;
      const apps = await service.listApps();
      res.json({ apps });
    } catch (error: any) {
      req.scope.resolve("logger").error("[Integrations] list apps failed", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Connections ───────────────────────────────────────────────────────

  router.get("/admin/integrations", async (req: MedusaRequest, res: MedusaResponse) => {
    try {
      const service = req.scope.resolve("integrationService") as IntegrationService;
      const tenantId = req.query.tenant_id as string | undefined;
      const connections = await service.listConnections(tenantId);
      res.json({ connections });
    } catch (error: any) {
      req.scope.resolve("logger").error("[Integrations] list connections failed", error);
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/admin/integrations", async (req: MedusaRequest, res: MedusaResponse) => {
    try {
      const service = req.scope.resolve("integrationService") as IntegrationService;
      const connection = await service.createConnection(req.body);
      res.status(201).json({ connection });
    } catch (error: any) {
      req.scope.resolve("logger").error("[Integrations] create connection failed", error);
      res.status(400).json({ error: error.message });
    }
  });

  router.get("/admin/integrations/:id", async (req: MedusaRequest, res: MedusaResponse) => {
    try {
      const service = req.scope.resolve("integrationService") as IntegrationService;
      const connection = await service.getConnection(req.params.id);
      if (!connection) return res.status(404).json({ error: "Connection not found" });
      return res.json({ connection });
    } catch (error: any) {
      req.scope.resolve("logger").error("[Integrations] get connection failed", error);
      return res.status(500).json({ error: error.message });
    }
  });

  router.put("/admin/integrations/:id", async (req: MedusaRequest, res: MedusaResponse) => {
    try {
      const service = req.scope.resolve("integrationService") as IntegrationService;
      const connection = await service.updateConnection(req.params.id, req.body);
      res.json({ connection });
    } catch (error: any) {
      req.scope.resolve("logger").error("[Integrations] update connection failed", error);
      res.status(400).json({ error: error.message });
    }
  });

  router.delete("/admin/integrations/:id", async (req: MedusaRequest, res: MedusaResponse) => {
    try {
      const service = req.scope.resolve("integrationService") as IntegrationService;
      await service.deleteConnection(req.params.id);
      res.json({ status: "ok" });
    } catch (error: any) {
      req.scope.resolve("logger").error("[Integrations] delete connection failed", error);
      res.status(400).json({ error: error.message });
    }
  });

  router.post("/admin/integrations/:id/test", async (req: MedusaRequest, res: MedusaResponse) => {
    try {
      const service = req.scope.resolve("integrationService") as IntegrationService;
      const result = await service.testConnection(req.params.id);
      res.json(result);
    } catch (error: any) {
      req.scope.resolve("logger").error("[Integrations] test connection failed", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Event Logs ────────────────────────────────────────────────────────

  router.get("/admin/integrations/:id/logs", async (req: MedusaRequest, res: MedusaResponse) => {
    try {
      const service = req.scope.resolve("integrationService") as IntegrationService;
      const limit = Number(req.query.limit) || 50;
      const logs = await service.getLogs(req.params.id, limit);
      res.json({ logs });
    } catch (error: any) {
      req.scope.resolve("logger").error("[Integrations] get logs failed", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Non-secret Config ─────────────────────────────────────────────────

  router.get("/admin/integrations/:id/config", async (req: MedusaRequest, res: MedusaResponse) => {
    try {
      const service = req.scope.resolve("integrationService") as IntegrationService;
      const config = await service.getConnectionConfig(req.params.id);
      if (!config.app) return res.status(404).json({ error: "Connection not found" });
      // Only return non-secret configuration
      return res.json({
        app: { id: config.app.id, name: config.app.name, type: config.app.type },
        configuration: config.configuration,
      });
    } catch (error: any) {
      req.scope.resolve("logger").error("[Integrations] get config failed", error);
      return res.status(500).json({ error: error.message });
    }
  });

  return router;
};

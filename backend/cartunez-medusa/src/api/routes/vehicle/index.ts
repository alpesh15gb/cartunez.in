import { Router } from "express";
import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";

export default (rootDirectory: string) => {
  const router = Router();

  // Vehicle listing routes removed — FastAPI is the single source of truth.
  // Frontend fetches vehicle data from /api/v1/vehicles/* (FastAPI).

  router.get("/vehicle/compatibility/:productId", async (req: MedusaRequest, res: MedusaResponse) => {
    try {
      const vehicleCompatibilityService = req.scope.resolve("vehicleCompatibilityService");
      const { productId } = req.params;
      const compatibility = await vehicleCompatibilityService.getProductCompatibility(productId);
      res.json({ compatibility });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product compatibility" });
    }
  });

  router.post("/vehicle/compatibility/:productId", async (req: MedusaRequest, res: MedusaResponse) => {
    try {
      const vehicleCompatibilityService = req.scope.resolve("vehicleCompatibilityService");
      const { productId } = req.params;
      const { variant_ids, fitment_type, notes } = req.body as any;
      const result = await vehicleCompatibilityService.setProductCompatibility(productId, {
        variant_ids,
        fitment_type,
        notes,
      });
      res.json({ compatibility: result });
    } catch (error) {
      res.status(500).json({ error: "Failed to update product compatibility" });
    }
  });

  router.get("/vehicle/products-by-year/:yearId", async (req: MedusaRequest, res: MedusaResponse) => {
    try {
      const vehicleCompatibilityService = req.scope.resolve("vehicleCompatibilityService");
      const { yearId } = req.params;
      const products = await vehicleCompatibilityService.getProductsForYear(yearId);
      res.json({ products });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products for year" });
    }
  });

  router.get("/vehicle/products/:variantId", async (req: MedusaRequest, res: MedusaResponse) => {
    try {
      const vehicleCompatibilityService = req.scope.resolve("vehicleCompatibilityService");
      const { variantId } = req.params;
      const products = await vehicleCompatibilityService.getProductsForVariant(variantId);
      res.json({ products });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products for variant" });
    }
  });

  return router;
};

import { Router } from "express";
import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";

export default (rootDirectory: string) => {
  const router = Router();

  router.get("/vehicle/makes", async (req: MedusaRequest, res: MedusaResponse) => {
    try {
      const vehicleMakeService = req.scope.resolve("vehicleMakeService");
      const makes = await vehicleMakeService.list();
      res.json({ makes });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vehicle makes" });
    }
  });

  router.get("/vehicle/makes/:id/models", async (req: MedusaRequest, res: MedusaResponse) => {
    try {
      const vehicleMakeService = req.scope.resolve("vehicleMakeService");
      const { id } = req.params;
      const models = await vehicleMakeService.listModels(id);
      res.json({ models });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vehicle models" });
    }
  });

  router.get("/vehicle/models/:id/years", async (req: MedusaRequest, res: MedusaResponse) => {
    try {
      const vehicleModelService = req.scope.resolve("vehicleModelService");
      const { id } = req.params;
      const years = await vehicleModelService.listYears(id);
      res.json({ years });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vehicle years" });
    }
  });

  router.get("/vehicle/years/:id/variants", async (req: MedusaRequest, res: MedusaResponse) => {
    try {
      const vehicleYearService = req.scope.resolve("vehicleYearService");
      const { id } = req.params;
      const variants = await vehicleYearService.listVariants(id);
      res.json({ variants });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vehicle variants" });
    }
  });

  router.get("/vehicle/search", async (req: MedusaRequest, res: MedusaResponse) => {
    try {
      const vehicleService = req.scope.resolve("vehicleService");
      const { make, model, year, fuel_type, transmission } = req.query;
      const results = await vehicleService.search({
        make: make as string,
        model: model as string,
        year: year ? parseInt(year as string) : undefined,
        fuel_type: fuel_type as string,
        transmission: transmission as string,
      });
      res.json({ results });
    } catch (error) {
      res.status(500).json({ error: "Failed to search vehicles" });
    }
  });

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

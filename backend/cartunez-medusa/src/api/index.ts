import { Router } from "express";
import healthRoutes from "./routes/health";
import vehicleRoutes from "./routes/vehicle";
import apexbooksRoutes from "./routes/apexbooks";
import integrationsRoutes from "./routes/integrations";

/**
 * Custom API entry point (Medusa v1 style).
 *
 * Medusa v1.20 loads project endpoints in two ways:
 *  1. File-based routing over `dist/api` — only files named `route.*`
 *     that export HTTP-method handlers (`GET`, `POST`, ...) are picked up.
 *  2. Backwards-compatible legacy entry — `dist/api/index.js` default
 *     export, invoked as `(rootDirectory, options) => ExpressRouter`.
 *
 * The route modules under `src/api/routes/*` use the legacy
 * express-router style, so they are mounted here. Without this file the
 * custom routes (`/health`, `/ready`, `/vehicle/*`, `/apexbooks/*`,
 * `/admin/integrations/*`) are compiled but never registered, which also
 * breaks the docker healthcheck (GET /health).
 */
export default (rootDirectory: string) => {
  const router = Router();

  router.use(healthRoutes());
  router.use(vehicleRoutes(rootDirectory));
  router.use(apexbooksRoutes());
  router.use(integrationsRoutes());

  return router;
};

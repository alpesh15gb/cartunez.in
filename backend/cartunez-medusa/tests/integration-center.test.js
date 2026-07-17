/**
 * Integration Center — Static Analysis Validation
 *
 * Validates entity structures, migration SQL, service methods,
 * API routes, and backward compatibility.
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const modelApp = fs.readFileSync(path.join(root, "src/models/integration-app.ts"), "utf8");
const modelConn = fs.readFileSync(path.join(root, "src/models/integration-connection.ts"), "utf8");
const modelLog = fs.readFileSync(path.join(root, "src/models/integration-event-log.ts"), "utf8");
const migration = fs.readFileSync(path.join(root, "src/migrations/1722000000000-CreateIntegrationTables.ts"), "utf8");
const service = fs.readFileSync(path.join(root, "src/services/integration-service.ts"), "utf8");
const routes = fs.readFileSync(path.join(root, "src/api/routes/integrations/index.ts"), "utf8");
const uiFile = fs.readFileSync(path.join(root, "src/api/routes/integrations/ui.ts"), "utf8");
const datasource = fs.readFileSync(path.join(root, "src/utils/datasource.ts"), "utf8");
const envExample = fs.readFileSync(path.join(root, ".env.example"), "utf8");
const apexbooksService = fs.readFileSync(path.join(root, "src/services/apexbooks-integration.ts"), "utf8");

const results = { passed: [], failed: [] };

function test(name, fn) {
  try {
    fn();
    results.passed.push(name);
    console.log(`  ✓ ${name}`);
  } catch (error) {
    results.failed.push({ name, message: error.message });
    console.log(`  ✗ ${name}: ${error.message}`);
  }
}

console.log("\n═══ Integration Center Validation ═══\n");

// ─── Section 1: Entity Structures ─────────────────────────────────────────────

console.log("Section 1: Entity Structures\n");

test("IntegrationApp entity has @Entity_ decorator", () => {
  assert(modelApp.includes('@Entity_("integration_apps"'));
});

test("IntegrationApp has PrimaryGeneratedColumn uuid", () => {
  assert(modelApp.includes("PrimaryGeneratedColumn"));
  assert(modelApp.includes("uuid"));
});

test("IntegrationApp has config_schema jsonb column", () => {
  assert(modelApp.includes('"jsonb"'));
  assert(modelApp.includes("config_schema"));
});

test("IntegrationApp has created_at and updated_at columns", () => {
  assert(modelApp.includes("CreateDateColumn"));
  assert(modelApp.includes("UpdateDateColumn"));
});

test("IntegrationConnection entity has @Entity_ decorator", () => {
  assert(modelConn.includes('@Entity_("integration_connections"'));
});

test("IntegrationConnection has composite index on tenant_id and app_id", () => {
  assert(modelConn.includes('@Index(["tenant_id", "app_id"])'));
});

test("IntegrationConnection has index on tenant_id", () => {
  assert(modelConn.includes('@Index(["tenant_id"])'));
});

test("IntegrationConnection has encrypted_credentials text column", () => {
  assert(modelConn.includes("encrypted_credentials"));
  assert(modelConn.includes('"text"'));
});

test("IntegrationConnection has configuration jsonb with default", () => {
  assert(modelConn.includes("configuration"));
  assert(modelConn.includes("jsonb"));
});

test("IntegrationEventLog entity has @Entity_ decorator", () => {
  assert(modelLog.includes('@Entity_("integration_event_logs"'));
});

test("IntegrationEventLog has composite index on connection_id and created_at", () => {
  assert(modelLog.includes('@Index(["connection_id", "created_at"])'));
});

test("IntegrationEventLog has request_payload jsonb column", () => {
  assert(modelLog.includes("request_payload"));
  assert(modelLog.includes("jsonb"));
});

test("IntegrationEventLog has error_message nullable column", () => {
  assert(modelLog.includes("error_message"));
  assert(modelLog.includes("nullable: true"));
});

// ─── Section 2: Migration ─────────────────────────────────────────────────────

console.log("\nSection 2: Migration SQL\n");

test("Migration creates integration_apps table", () => {
  assert(migration.includes('CREATE TABLE "integration_apps"'));
});

test("Migration creates integration_connections table", () => {
  assert(migration.includes('CREATE TABLE "integration_connections"'));
});

test("Migration creates integration_event_logs table", () => {
  assert(migration.includes('CREATE TABLE "integration_event_logs"'));
});

test("Migration creates index on tenant_id and app_id", () => {
  assert(migration.includes("IDX_integration_connections_tenant_app"));
});

test("Migration creates index on connection_id and created_at", () => {
  assert(migration.includes("IDX_integration_event_logs_connection"));
});

test("Migration seeds ApexBooks app definition", () => {
  assert(migration.includes("INSERT INTO") && migration.includes("integration_apps"));
  assert(migration.includes("ApexBooks ERP"));
  assert(migration.includes("apexbooks"));
  assert(migration.includes("secret_fields"));
});

test("Migration down() drops all three tables", () => {
  assert(migration.includes('DROP TABLE "integration_event_logs"'));
  assert(migration.includes('DROP TABLE "integration_connections"'));
  assert(migration.includes('DROP TABLE "integration_apps"'));
});

// ─── Section 3: Service Methods ───────────────────────────────────────────────

console.log("\nSection 3: Service Methods\n");

test("Service extends TransactionBaseService", () => {
  assert(service.includes("extends TransactionBaseService"));
});

test("Service has listApps method", () => {
  assert(service.includes("async listApps"));
});

test("Service has listConnections method", () => {
  assert(service.includes("async listConnections"));
});

test("Service has createConnection method", () => {
  assert(service.includes("async createConnection"));
});

test("Service has updateConnection method", () => {
  assert(service.includes("async updateConnection"));
});

test("Service has deleteConnection method", () => {
  assert(service.includes("async deleteConnection"));
});

test("Service has testConnection method", () => {
  assert(service.includes("async testConnection"));
});

test("Service has getLogs method", () => {
  assert(service.includes("async getLogs"));
});

test("Service has getConfigForType method", () => {
  assert(service.includes("async getConfigForType"));
});

test("Service uses AES-256-GCM encryption", () => {
  assert(service.includes("aes-256-gcm"));
  assert(service.includes("createCipheriv"));
  assert(service.includes("createDecipheriv"));
});

test("Service uses PBKDF2 for key derivation", () => {
  assert(service.includes("pbkdf2Sync"));
});

test("Service encrypt method stores iv, tag, and ciphertext", () => {
  assert(service.includes("iv"));
  assert(service.includes("tag"));
  assert(service.includes("ciphertext"));
});

test("Service getEncryptionKey falls back to JWT_SECRET", () => {
  assert(service.includes("INTEGRATIONS_ENCRYPTION_KEY"));
  assert(service.includes("JWT_SECRET"));
});

test("Service getConfigForType returns null when no app found", () => {
  assert(service.includes("if (!app) return null"));
});

test("Service testConnection uses HMAC-SHA256", () => {
  assert(service.includes("createHmac"));
  assert(service.includes("sha256"));
});

// ─── Section 4: API Routes ────────────────────────────────────────────────────

console.log("\nSection 4: API Routes\n");

test("Routes use authenticate middleware", () => {
  assert(routes.includes("authenticate"));
  assert(routes.includes('import authenticate from "@medusajs/medusa/dist/api/middlewares/authenticate"'));
});

test("GET /admin/integrations/apps exists", () => {
  assert(routes.includes('"/admin/integrations/apps"'));
});

test("GET /admin/integrations exists", () => {
  assert(routes.includes('"/admin/integrations"'));
});

test("POST /admin/integrations exists", () => {
  assert(routes.includes('router.post("/admin/integrations"'));
});

test("GET /admin/integrations/:id exists", () => {
  assert(routes.includes('"/admin/integrations/:id"'));
});

test("PUT /admin/integrations/:id exists", () => {
  assert(routes.includes('router.put("/admin/integrations/:id"'));
});

test("DELETE /admin/integrations/:id exists", () => {
  assert(routes.includes('router.delete("/admin/integrations/:id"'));
});

test("POST /admin/integrations/:id/test exists", () => {
  assert(routes.includes('"/admin/integrations/:id/test"'));
});

test("GET /admin/integrations/:id/logs exists", () => {
  assert(routes.includes('"/admin/integrations/:id/logs"'));
});

test("GET /admin/integrations/:id/config exists", () => {
  assert(routes.includes('"/admin/integrations/:id/config"'));
});

test("IntegrationService resolved from container", () => {
  assert(routes.includes('req.scope.resolve("integrationService")'));
});

// ─── Section 5: Admin UI ──────────────────────────────────────────────────────

console.log("\nSection 5: Admin UI\n");

test("UI route serves HTML page", () => {
  assert(uiFile.includes('"/admin/integrations/ui"'));
  assert(uiFile.includes('"text/html"'));
});

test("UI route serves app.js", () => {
  assert(uiFile.includes('"/admin/integrations/ui/app.js"'));
  assert(uiFile.includes('"application/javascript"'));
});

test("UI route uses authenticate middleware", () => {
  assert(uiFile.includes("authenticate"));
});

test("UI has add integration button", () => {
  assert(uiFile.includes("Add Integration") || uiFile.includes("addBtn"));
});

test("UI has test connection functionality", () => {
  assert(uiFile.includes("testConnection") || uiFile.includes("Test Connection"));
});

test("UI has event log table", () => {
  assert(uiFile.includes("log-table") || uiFile.includes("Event Log"));
});

test("UI has detail view for connections", () => {
  assert(uiFile.includes("openDetail") || uiFile.includes("detailModal"));
});

test("Routes file (index.ts) also serves UI HTML page", () => {
  assert(routes.includes('"/admin/integrations/ui"'));
  assert(routes.includes("text/html"));
});

test("Routes file (index.ts) also serves UI app.js", () => {
  assert(routes.includes('"/admin/integrations/ui/app.js"'));
  assert(routes.includes("application/javascript"));
});

// ─── Section 6: Datasource Registration ───────────────────────────────────────

console.log("\nSection 6: Datasource Registration\n");

test("Datasource registers IntegrationApp", () => {
  assert(datasource.includes("IntegrationApp"));
});

test("Datasource registers IntegrationConnection", () => {
  assert(datasource.includes("IntegrationConnection"));
});

test("Datasource registers IntegrationEventLog", () => {
  assert(datasource.includes("IntegrationEventLog"));
});

// ─── Section 7: Environment Configuration ─────────────────────────────────────

console.log("\nSection 7: Environment Configuration\n");

test(".env.example has INTEGRATIONS_ENCRYPTION_KEY", () => {
  assert(envExample.includes("INTEGRATIONS_ENCRYPTION_KEY"));
});

test(".env.example mentions JWT_SECRET fallback", () => {
  assert(envExample.includes("JWT_SECRET"));
});

// ─── Section 8: Backward Compatibility ────────────────────────────────────────

console.log("\nSection 8: Backward Compatibility\n");

test("ApexBooks service has loadConfigFromDb method", () => {
  assert(apexbooksService.includes("loadConfigFromDb"));
});

test("ApexBooks service has loadBaseConfig method", () => {
  assert(apexbooksService.includes("loadBaseConfig"));
});

test("ApexBooks service resolves integrationService from container", () => {
  assert(apexbooksService.includes("container.integrationService"));
});

test("ApexBooks service merges DB config with env fallback", () => {
  assert(apexbooksService.includes("dbConfig.baseUrl"));
  assert(apexbooksService.includes("dbConfig.apiKey"));
  assert(apexbooksService.includes("dbConfig.webhookSecret"));
});

test("ApexBooks env-only config still works (backward compatible)", () => {
  assert(apexbooksService.includes("process.env.APEXBOOKS_BASE_URL"));
  assert(apexbooksService.includes("process.env.APEXBOOKS_API_KEY"));
});

test("ApexBooks enabled flag is driven by env var only", () => {
  assert(apexbooksService.includes("process.env.APEXBOOKS_ENABLED"));
});

// ─── Summary ───────────────────────────────────────────────────────────────────

console.log("\n═══════════════════════════════════════════════════");
console.log(`Results: ${results.passed.length} passed, ${results.failed.length} failed`);

if (results.failed.length > 0) {
  console.log("\nFailures:");
  for (const f of results.failed) {
    console.log(`  - ${f.name}: ${f.message}`);
  }
  process.exit(1);
}
console.log("\nIntegration Center: ALL CHECKS PASSED");

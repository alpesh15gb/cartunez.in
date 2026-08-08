const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const health = fs.readFileSync(path.join(root, "src/api/routes/health/index.ts"), "utf8");
const datasource = fs.readFileSync(path.join(root, "src/utils/datasource.ts"), "utf8");
const config = fs.readFileSync(path.join(root, "medusa-config.js"), "utf8");
const seed = fs.readFileSync(path.join(root, "seed-data.js"), "utf8");
const apexbooks = fs.readFileSync(path.join(root, "src/services/apexbooks-integration.ts"), "utf8");
const vehicle = fs.readFileSync(path.join(root, "src/models/vehicle.ts"), "utf8");
const packageJson = require(path.join(root, "package.json"));

// Commerce verification workflow — optional, may not exist in all branches
const workflowPath = path.join(root, "..", "..", ".github/workflows/commerce-verification.yml");
const localVerificationPath = path.join(root, "..", "..", "scripts/verify-commerce-runtime.sh");

const workflow = fs.existsSync(workflowPath) ? fs.readFileSync(workflowPath, "utf8") : "";
const localVerification = fs.existsSync(localVerificationPath) ? fs.readFileSync(localVerificationPath, "utf8") : "";

const { assertSafeDatabase } = require(path.join(root, "scripts/assert-safe-database"));

assert(health.includes('router.get("/health"'));
assert(health.includes('router.get("/ready"'));
assert(health.includes('manager.query("SELECT 1")'));
assert(health.includes('redis.ping()'));
assert(datasource.includes("synchronize: false"));
assert(config.includes('process.env.NODE_ENV === "production"'));
assert(seed.includes("assertSafeDatabase"));
assert(!seed.includes('console.error("Seed failed:", err)'));
assert(apexbooks.includes("ApexBooks is enabled but"));
assert(apexbooks.includes("if (!this.config_.enabled)"));
assert(apexbooks.includes('apiKey: "***"'));
assert(!config.includes("NODE_TLS_REJECT_UNAUTHORIZED"));
assert(vehicle.includes('@Column({ type: "text" })'));
assert.strictEqual(packageJson.dependencies["@medusajs/admin"], "7.1.18");

// Commerce verification workflow checks — only if file exists
if (workflow) {
  assert(workflow.includes("node scripts/verify-ci-environment.js"));
  assert(workflow.includes("medusa.sanitized.log"));
  assert(!workflow.includes("path: ${{ runner.temp }}/medusa.log"));
}

// Local verification script checks — only if file exists
if (localVerification) {
  assert(localVerification.includes("scripts/redact-log.js"));
  assert(!localVerification.includes("> medusa.runtime.log"));
}

const originalEnv = { ...process.env };
try {
  process.env.NODE_ENV = "production";
  process.env.DATABASE_URL = "postgresql://postgres:test@localhost/cartunez_test";
  process.env.CONFIRM_DISPOSABLE_DATABASE = "yes";
  assert.throws(() => assertSafeDatabase("test"), /NODE_ENV=production/);

  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = "postgresql://postgres:test@db.example.com/cartunez";
  assert.throws(() => assertSafeDatabase("test"), /refused/);

  process.env.DATABASE_URL = "postgresql://postgres:test@localhost/cartunez_test";
  delete process.env.CONFIRM_DISPOSABLE_DATABASE;
  assert.throws(() => assertSafeDatabase("test"), /CONFIRM_DISPOSABLE_DATABASE/);

  process.env.CONFIRM_DISPOSABLE_DATABASE = "yes";
  assert.doesNotThrow(() => assertSafeDatabase("test"));
} finally {
  process.env = originalEnv;
}

console.log("Medusa runtime safety checks passed");

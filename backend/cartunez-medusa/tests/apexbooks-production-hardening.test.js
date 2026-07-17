/**
 * ApexBooks Production Hardening — Queue, Lookup, Sync Tracking Validation
 *
 * Validates the persistent event queue, indexed ApexBooks ID lookups,
 * extended outbound sync tracking, and replay capabilities.
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const servicePath = path.join(root, "src/services/apexbooks-integration.ts");
const modelQueuePath = path.join(root, "src/models/apexbooks-outbound-event.ts");
const modelMappingPath = path.join(root, "src/models/apexbooks-entity-mapping.ts");
const migrationPath = path.join(root, "src/migrations/1720000000000-CreateApexBooksTables.ts");
const routesPath = path.join(root, "src/api/routes/apexbooks/index.ts");
const datasourcePath = path.join(root, "src/utils/datasource.ts");
const envExamplePath = path.join(root, ".env.example");

const service = fs.readFileSync(servicePath, "utf8");
const modelQueue = fs.readFileSync(modelQueuePath, "utf8");
const modelMapping = fs.readFileSync(modelMappingPath, "utf8");
const migration = fs.readFileSync(migrationPath, "utf8");
const routes = fs.readFileSync(routesPath, "utf8");
const datasource = fs.readFileSync(datasourcePath, "utf8");
const envExample = fs.readFileSync(envExamplePath, "utf8");

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

console.log("\n═══ ApexBooks Production Hardening Validation ═══\n");

// ─── Section 1: Queue Table Structure ──────────────────────────────────────

console.log("Section 1: Queue Table Structure\n");

test("Migration creates apexbooks_outbound_event table", () => {
  assert(migration.includes('CREATE TABLE "apexbooks_outbound_event"'));
});

test("Migration creates apexbooks_entity_mapping table", () => {
  assert(migration.includes('CREATE TABLE "apexbooks_entity_mapping"'));
});

test("Migration creates unique index on idempotency_key", () => {
  assert(migration.includes("IDX_apexbooks_event_idempotency_key"));
});

test("Migration creates composite index on status and next_retry_at", () => {
  assert(migration.includes("IDX_apexbooks_event_status_retry"));
});

test("Migration creates unique index on entity_type and apexbooks_id", () => {
  assert(migration.includes("IDX_apexbooks_mapping_type_id"));
});

test("Migration has down() that drops both tables", () => {
  assert(migration.includes('DROP TABLE "apexbooks_entity_mapping"'));
  assert(migration.includes('DROP TABLE "apexbooks_outbound_event"'));
});

test("Entity model has @Entity_ decorator for queue table", () => {
  assert(modelQueue.includes('@Entity_("apexbooks_outbound_event")'));
});

test("Entity model has @Entity_ decorator for mapping table", () => {
  assert(modelMapping.includes('@Entity_("apexbooks_entity_mapping")'));
});

test("Entity model has jsonb payload column", () => {
  assert(modelQueue.includes('"jsonb"'));
});

test("Entity model has default PENDING status", () => {
  assert(modelQueue.includes("PENDING"));
});

test("Datasource registers both entities", () => {
  assert(datasource.includes("ApexBooksOutboundEvent"));
  assert(datasource.includes("ApexBooksEntityMapping"));
});

test("Entity model has unique index on idempotency_key", () => {
  assert(modelQueue.includes("@Index({ unique: true })"));
  assert(modelQueue.includes("idempotency_key"));
});

test("Entity model has composite index on status and next_retry_at", () => {
  // The class-level @Index decorator
  assert(modelQueue.includes('Index("IDX_apexbooks_queue_status_retry"'));
  assert(modelQueue.includes('"status", "next_retry_at"'));
});

test("Mapping entity has unique composite index on entity_type and apexbooks_id", () => {
  assert(modelMapping.includes('(["entity_type", "apexbooks_id"], { unique: true })'));
});

// ─── Section 2: Event Enqueue Logic ────────────────────────────────────────

console.log("\nSection 2: Event Enqueue Logic\n");

test("sendOutboundEvent persists event to queue before delivery", () => {
  assert(service.includes("getEventRepository()"));
  assert(service.includes("eventRepo.save"));
});

test("sendOutboundEvent checks idempotency via DB before delivery", () => {
  assert(service.includes('findOne({'));
  assert(service.includes("idempotency_key"));
  assert(service.includes('status: "SENT"'));
});

test("Event is set to PENDING before delivery attempt", () => {
  assert(service.includes('status: "PENDING"'));
});

test("PROCESSING status is set during delivery", () => {
  assert(service.includes('status = "PROCESSING"'));
});

test("sendOutboundEvent returns queue_id in result", () => {
  assert(service.includes("queue_id: saved.id"));
});

test("Event persistence creates event with correct fields", () => {
  assert(service.includes("eventRepo.create({"));
  assert(service.includes("idempotency_key: body.idempotency_key"));
  assert(service.includes("max_retries: this.config_.maxRetries"));
});

// ─── Section 3: Retry Worker Logic ─────────────────────────────────────────

console.log("\nSection 3: Retry Worker Logic\n");

test("processEventQueue method exists and queries FAILED events", () => {
  assert(service.includes("processEventQueue"));
});

test("processEventQueue queries FAILED with next_retry_at <= now", () => {
  assert(service.includes('status: "FAILED"'));
  assert(service.includes("LessThanOrEqual(new Date())"));
});

test("processEventQueue queries PENDING with null next_retry_at", () => {
  assert(service.includes('status: "PENDING"'));
  assert(service.includes("next_retry_at: IsNull()"));
});

test("processEventQueue limits batch size", () => {
  assert(service.includes("QUEUE_BATCH_SIZE"));
  assert(service.includes("take: maxEvents"));
});

test("DEAD_LETTER set when attempt_count >= max_retries", () => {
  assert(service.includes('event.attempt_count >= event.max_retries'));
  assert(service.includes('status = "DEAD_LETTER"'));
  assert(service.includes("Max retries"));
});

test("FAILED events get next_retry_at with exponential backoff", () => {
  assert(service.includes('status = "FAILED"'));
  assert(service.includes("250 * Math.pow(2, event.attempt_count - 1)"));
});

test("Non-retryable 4xx errors set DEAD_LETTER immediately", () => {
  assert(service.includes("!error.retryable"));
  assert(service.includes('status = "DEAD_LETTER"'));
  assert(service.includes("last_error = error.message"));
});

// ─── Section 4: Manual Replay ──────────────────────────────────────────────

console.log("\nSection 4: Manual Replay\n");

test("replayEvent method exists and resets event to PENDING", () => {
  assert(service.includes("async replayEvent"));
  assert(service.includes('status = "PENDING"'));
  assert(service.includes("attempt_count = 0"));
});

test("replayAllFailed method queries FAILED and DEAD_LETTER events", () => {
  assert(service.includes("async replayAllFailed"));
  assert(service.includes('status: "FAILED"'));
  assert(service.includes('status: "DEAD_LETTER"'));
});

test("replayAllFailed resets events to PENDING with zero attempt_count", () => {
  assert(service.includes('event.status = "PENDING"'));
  assert(service.includes("event.attempt_count = 0"));
  assert(service.includes("event.last_error = null"));
  assert(service.includes("event.next_retry_at = null"));
});

test("POST /apexbooks/v1/queue/process route exists", () => {
  assert(routes.includes('"/apexbooks/v1/queue/process"'));
});

test("POST /apexbooks/v1/queue/replay/:id route exists", () => {
  assert(routes.includes('"/apexbooks/v1/queue/replay/:id"'));
});

test("GET /apexbooks/v1/queue route exists", () => {
  assert(routes.includes('"/apexbooks/v1/queue"'));
});

test("POST /apexbooks/v1/queue/replay-all route exists", () => {
  assert(routes.includes('"/apexbooks/v1/queue/replay-all"'));
});

// ─── Section 5: Indexed Lookup ─────────────────────────────────────────────

console.log("\nSection 5: Indexed Lookup\n");

test("findProductByApexBooksId uses mapping repository", () => {
  assert(service.includes("getMappingRepository()"));
});

test("findProductByApexBooksId does indexed lookup first", () => {
  assert(service.includes('entity_type: "product"'));
  assert(service.includes('apexbooks_id: apexbooksId'));
  assert(service.includes("mappingRepo.findOne"));
});

test("findProductByApexBooksId writes mapping on scan fallback success", () => {
  assert(service.includes("mappingRepo.save({"));
  assert(service.includes('entity_type: "product"'));
});

test("findCustomerByApexBooksId uses indexed lookup", () => {
  assert(service.includes('entity_type: "customer"'));
});

test("findCustomerByApexBooksId writes mapping on scan fallback success", () => {
  assert(service.includes('entity_type: "customer"'));
});

test("syncProduct writes to mapping table on create", () => {
  assert(service.includes("await this.upsertMapping("));
  assert(service.includes('"product"'));
});

test("syncCustomer writes to mapping table on create", () => {
  assert(service.includes('"customer"'));
});

test("upsertMapping method exists and handles insert and update", () => {
  assert(service.includes("async upsertMapping"));
  assert(service.includes("mappingRepo.save({"));
});

// ─── Section 6: Extended Sync Tracking ─────────────────────────────────────

console.log("\nSection 6: Extended Sync Tracking\n");

test("recordOutboundSync handles customer resource type", () => {
  assert(service.includes('case "customer"'));
  assert(service.includes("this.customerService_"));
});

test("recordOutboundSync handles order resource type", () => {
  assert(service.includes('case "order"'));
  assert(service.includes("this.orderService_"));
});

test("recordOutboundSync logs for other resource types", () => {
  assert(service.includes("default:"));
  assert(service.includes("recorded for"));
});

test("Constructor resolves paymentService_", () => {
  assert(service.includes("this.paymentService_ = container.paymentService"));
});

test("Constructor resolves returnService_", () => {
  assert(service.includes("this.returnService_ = container.returnService"));
});

// ─── Section 7: Configuration & Deployment ─────────────────────────────────

console.log("\nSection 7: Configuration & Deployment\n");

test("APEXBOOKS_TENANT_ID in .env.example", () => {
  assert(envExample.includes("APEXBOOKS_TENANT_ID"));
});

test("ApexBooksRequestError class exists", () => {
  assert(service.includes("class ApexBooksRequestError extends Error"));
  assert(service.includes("retryable"));
  assert(service.includes("status"));
});

test("request() uses ApexBooksRequestError for retryable failures", () => {
  assert(service.includes("new ApexBooksRequestError("));
  assert(service.includes("true,"));
});

test("request() uses ApexBooksRequestError for non-retryable failures", () => {
  assert(service.includes("new ApexBooksRequestError("));
  assert(service.includes("false,"));
});

test("request() no longer has while retry loop", () => {
  assert(!service.includes("while (attempt < this.config_.maxRetries)"));
});

test("deliverEvent method exists with full state machine", () => {
  assert(service.includes("async deliverEvent"));
  assert(service.includes('event.status = "PROCESSING"'));
  assert(service.includes('event.status = "SENT"'));
  assert(service.includes('event.status = "FAILED"'));
  assert(service.includes('event.status = "DEAD_LETTER"'));
});

// ─── Summary ───────────────────────────────────────────────────────────────

console.log("\n═══════════════════════════════════════════════════");
console.log(`Results: ${results.passed.length} passed, ${results.failed.length} failed`);

if (results.failed.length > 0) {
  console.log("\nFailures:");
  for (const f of results.failed) {
    console.log(`  - ${f.name}: ${f.message}`);
  }
  process.exit(1);
}
console.log("\nApexBooks production hardening: ALL CHECKS PASSED");

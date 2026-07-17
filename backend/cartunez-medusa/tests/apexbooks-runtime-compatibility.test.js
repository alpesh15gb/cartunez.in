const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const schemaPath = path.join(root, "docs/apexbooks/v1/schemas/apexbooks-events.schema.json");
const examplesDir = path.join(root, "docs/apexbooks/v1/examples");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function typeMatches(schemaType, value) {
  const types = Array.isArray(schemaType) ? schemaType : [schemaType];
  return types.some((type) => {
    if (type === "null") return value === null;
    if (type === "array") return Array.isArray(value);
    if (type === "integer") return Number.isInteger(value);
    if (type === "object") return value !== null && typeof value === "object" && !Array.isArray(value);
    return typeof value === type;
  });
}

function resolveRef(schema, ref) {
  assert(ref.startsWith("#/"), `Only local refs are supported in this test: ${ref}`);
  return ref
    .slice(2)
    .split("/")
    .reduce((current, part) => current[part], schema);
}

function validate(schema, node, rootSchema = schema, location = "$") {
  if (schema.$ref) {
    return validate(resolveRef(rootSchema, schema.$ref), node, rootSchema, location);
  }

  if (schema.oneOf) {
    const matches = schema.oneOf.filter((candidate) => {
      try {
        validate(candidate, node, rootSchema, location);
        return true;
      } catch {
        return false;
      }
    });
    assert.strictEqual(matches.length, 1, `${location} must match exactly one schema; matched ${matches.length}`);
    return;
  }

  if (schema.const !== undefined) {
    assert.deepStrictEqual(node, schema.const, `${location} must equal ${schema.const}`);
  }

  if (schema.enum) {
    assert(schema.enum.includes(node), `${location} must be one of ${schema.enum.join(", ")}`);
  }

  if (schema.type) {
    assert(typeMatches(schema.type, node), `${location} has invalid type`);
  }

  if (schema.pattern && typeof node === "string") {
    assert(new RegExp(schema.pattern).test(node), `${location} does not match ${schema.pattern}`);
  }

  if (schema.minimum !== undefined && typeof node === "number") {
    assert(node >= schema.minimum, `${location} must be >= ${schema.minimum}`);
  }

  if (schema.format === "date-time" && typeof node === "string") {
    assert(!Number.isNaN(Date.parse(node)), `${location} must be a date-time`);
  }

  if (schema.format === "date" && typeof node === "string") {
    assert(/^\d{4}-\d{2}-\d{2}$/.test(node), `${location} must be a date`);
  }

  if (schema.format === "email" && typeof node === "string") {
    assert(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(node), `${location} must be an email`);
  }

  if (schema.type === "object" || schema.properties || schema.required) {
    const value = node || {};
    for (const key of schema.required || []) {
      assert(Object.prototype.hasOwnProperty.call(value, key), `${location}.${key} is required`);
    }

    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        assert(schema.properties && schema.properties[key], `${location}.${key} is not allowed`);
      }
    }

    for (const [key, childSchema] of Object.entries(schema.properties || {})) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        validate(childSchema, value[key], rootSchema, `${location}.${key}`);
      }
    }
  }

  if (schema.type === "array" || schema.items) {
    assert(Array.isArray(node), `${location} must be an array`);
    if (schema.minItems !== undefined) {
      assert(node.length >= schema.minItems, `${location} must have at least ${schema.minItems} items`);
    }
    node.forEach((item, index) => validate(schema.items, item, rootSchema, `${location}[${index}]`));
  }
}

const schema = readJson(schemaPath);
const service = read("src/services/apexbooks-integration.ts");
const builder = read("src/services/apexbooks-event-builder.ts");
const routes = read("src/api/routes/apexbooks/index.ts");
const outboundLayer = `${service}\n${builder}`;
const failures = [];

function check(name, fn) {
  try {
    fn();
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
  }
}

for (const file of fs.readdirSync(examplesDir).filter((name) => name.endsWith(".json"))) {
  validate(schema, readJson(path.join(examplesDir, file)));
}

const requiredV1Routes = [
  "/apexbooks/v1/webhooks",
  "/apexbooks/v1/webhooks/products",
  "/apexbooks/v1/webhooks/prices",
  "/apexbooks/v1/webhooks/inventory",
  "/apexbooks/v1/webhooks/customers",
];

for (const route of requiredV1Routes) {
  assert(routes.includes(`router.post("${route}"`), `Missing POST ${route}`);
}

check("outbound hmac signing", () => assert(service.includes('"X-ApexBooks-Signature"'), "Outbound requests must sign with HMAC-SHA256 signature header"));
check("outbound hmac timestamp", () => assert(service.includes('"X-ApexBooks-Timestamp"'), "Outbound requests must include timestamp header"));
check("no bearer token in outbound", () => assert(!service.includes('"Authorization": `Bearer'), "Outbound requests must NOT use Bearer API key auth"));
check("outbound idempotency header", () => assert(service.includes('"Idempotency-Key"') && service.includes('request.idempotencyKey'), "Outbound requests must send Idempotency-Key"));
check("outbound contract-version header", () => assert(service.includes('"X-ApexBooks-Contract-Version"') || service.includes('"x-apexbooks-contract-version"'), "Outbound requests must send X-ApexBooks-Contract-Version: v1"));

for (const requiredField of ["contract_version", "event_id", "event_type", "occurred_at", "idempotency_key"]) {
  check(`outbound envelope ${requiredField}`, () => assert(outboundLayer.includes(requiredField), `Outbound envelope must include ${requiredField}`));
}

check("outbound event field", () => assert(!outboundLayer.includes("event: eventName"), "Outbound envelope must use event_type, not event"));
check("outbound event-specific body", () => assert(!outboundLayer.includes("data: payload"), "Outbound envelope must use event-specific schema object, not generic data"));

check("inbound contract-version header", () => assert(outboundLayer.includes("x-apexbooks-contract-version"), "Inbound runtime must require X-ApexBooks-Contract-Version"));
check("inbound timestamp header", () => assert(service.includes("x-apexbooks-timestamp"), "Inbound runtime must require X-ApexBooks-Timestamp"));
check("inbound signature header", () => assert(service.includes("x-apexbooks-signature"), "Inbound runtime must require X-ApexBooks-Signature"));
check("inbound event-id header", () => assert(service.includes("x-apexbooks-event-id"), "Inbound runtime must read X-ApexBooks-Event-Id"));
check("inbound event-type header", () => assert(service.includes("x-apexbooks-event-type"), "Inbound runtime must read X-ApexBooks-Event-Type"));

const timestamp = "2026-07-17T00:00:00.000Z";
const body = JSON.stringify(readJson(path.join(examplesDir, "product-updated.json")));
const expectedSignature = crypto
  .createHmac("sha256", "test_secret")
  .update(`${timestamp}.${body}`)
  .digest("hex");
assert.match(`sha256=${expectedSignature}`, /^sha256=[a-f0-9]{64}$/, "Signature fixture must match contract shape");

check("retry loop", () => assert(service.includes("event.attempt_count += 1") && service.includes("event.attempt_count >= event.max_retries"), "Outbound retry must be managed by queue with attempt_count tracking"));
check("retry status policy", () => assert(service.includes("response.status < 500 && response.status !== 429"), "Outbound retry behavior must retry 429/5xx and stop on non-retryable 4xx"));
check("duplicate-event handling", () => assert(service.includes("processed_event_ids") && service.includes("event already processed"), "Inbound duplicate-event handling must skip processed event IDs"));

check("tenant context config", () => assert(service.includes("APEXBOOKS_TENANT_ID"), "Runtime must support APEXBOOKS_TENANT_ID configuration"));
check("tenant header outbound", () => assert(service.includes('"X-ApexBooks-Tenant-Id"'), "Outbound requests must include X-ApexBooks-Tenant-Id header"));
check("tenant resolution rejection", () => assert(service.includes("resolveTenant") || (service.includes("tenant context") && service.includes("reject")), "Runtime must reject events when tenant cannot be resolved"));

check("local replay protection set", () => assert(service.includes("processedOutboundKeys_") || service.includes("processedOutboundKeys"), "Runtime must maintain a local set of processed outbound event keys"));
check("local replay rejection", () => assert(service.includes("replay blocked") || (service.includes("duplicate") && service.includes("replay")), "Runtime must reject duplicate outbound events via local replay protection"));

check("order event validation", () => assert(service.includes("validateOrderEvent") || (service.includes("order event") && service.includes("validation")), "Runtime must validate order events before outbound delivery"));
check("event_id format validation", () => assert(service.includes("evt_") && service.includes("event_id must start"), "Runtime must validate event_id format for order events"));

check("timestamp expiry", () => assert(service.includes("timestamp expired") || (service.includes("verifyTimestamp") && service.includes("HMAC_MAX_AGE")), "Runtime must reject expired timestamps"));
check("timestamp clock skew", () => assert(service.includes("future") || service.includes("clock_skew"), "Runtime must reject future timestamps beyond clock skew tolerance"));

check("secrets out of logs", () => assert(!service.includes("log.*apiKey") && !service.includes("log.*signature"), "Runtime must keep API secrets out of log output"));

check("success/skipped envelope", () => assert(routes.includes('res.status(result.status === "skipped" ? 200 : 202).json(result)'), "Success/skipped envelope must be returned as JSON"));
check("error envelope", () => assert(routes.includes('res.status(400).json({') || routes.includes("res.status(400).json({"), "Error envelope must be returned as JSON"));

if (failures.length) {
  console.error("ApexBooks runtime compatibility deviations:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("ApexBooks runtime compatibility checks passed");

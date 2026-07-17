const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const service = read("src/services/apexbooks-integration.ts");
assert(service.includes("APEXBOOKS_BASE_URL"));
assert(service.includes("APEXBOOKS_WEBHOOK_SECRET"));
assert(service.includes("Idempotency-Key"));
assert(service.includes("processed_event_ids"));

const routes = read("src/api/routes/apexbooks/index.ts");
assert(routes.includes("/apexbooks/webhooks"));
assert(routes.includes("/apexbooks/v1/webhooks"));
assert(routes.includes("/apexbooks/webhooks/products"));
assert(routes.includes("/apexbooks/v1/webhooks/products"));
assert(routes.includes("/apexbooks/webhooks/inventory"));
assert(routes.includes("/apexbooks/webhooks/customers"));
assert(fs.existsSync(path.join(root, "docs/apexbooks/v1/openapi.yaml")));
assert(fs.existsSync(path.join(root, "docs/apexbooks/v1/schemas/apexbooks-events.schema.json")));
assert(fs.existsSync(path.join(root, "docs/apexbooks/v1/event-catalog.md")));
assert(fs.existsSync(path.join(root, "docs/apexbooks/v1/sequence-diagrams.md")));
JSON.parse(read("docs/apexbooks/v1/schemas/apexbooks-events.schema.json"));

const exampleDir = path.join(root, "docs/apexbooks/v1/examples");
const exampleFiles = fs.readdirSync(exampleDir).filter((file) => file.endsWith(".json"));
assert(exampleFiles.length >= 8);
for (const file of exampleFiles) {
  const payload = JSON.parse(read(`docs/apexbooks/v1/examples/${file}`));
  assert.strictEqual(payload.contract_version, "v1");
  assert(payload.event_id);
  assert(payload.event_type);
}

const expectedSubscribers = [
  ["src/subscribers/apexbooks-order-created.ts", "order.created"],
  ["src/subscribers/apexbooks-order-updated.ts", "order.updated"],
  ["src/subscribers/apexbooks-order-cancelled.ts", "order.cancelled"],
  ["src/subscribers/apexbooks-payment-captured.ts", "payment.captured"],
  ["src/subscribers/apexbooks-payment-refunded.ts", "payment.refunded"],
  ["src/subscribers/apexbooks-payment-refunded.ts", "refund.created"],
  ["src/subscribers/apexbooks-return-created.ts", "return.created"],
  ["src/subscribers/apexbooks-customer-created.ts", "customer.created"],
];

for (const [file, eventName] of expectedSubscribers) {
  const source = read(file);
  assert(source.includes("config"));
  assert(source.includes(eventName));
  assert(source.includes("sendOutboundEvent"));
}

console.log("ApexBooks integration static checks passed");

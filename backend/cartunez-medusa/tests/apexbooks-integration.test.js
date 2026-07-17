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
assert(routes.includes("/apexbooks/webhooks/products"));
assert(routes.includes("/apexbooks/webhooks/inventory"));
assert(routes.includes("/apexbooks/webhooks/customers"));

const expectedSubscribers = [
  ["src/subscribers/apexbooks-order-created.ts", "order.created"],
  ["src/subscribers/apexbooks-order-updated.ts", "order.updated"],
  ["src/subscribers/apexbooks-order-cancelled.ts", "order.cancelled"],
  ["src/subscribers/apexbooks-payment-captured.ts", "payment.captured"],
  ["src/subscribers/apexbooks-payment-refunded.ts", "payment.refunded"],
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

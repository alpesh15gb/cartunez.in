/**
 * Creates a flat-rate shipping option for the INR region using the manual
 * fulfillment provider. Idempotent — run once after setup:
 *   docker exec cartunez-medusa node scripts/setup-shipping.js
 */

var express = require("express");
var loaders = require("@medusajs/medusa/dist/loaders").default;

async function main() {
  console.log("=== Shipping Setup ===\n");

  var directory = process.cwd();
  var app = express();
  process.env.LOG_LEVEL = "error";
  var container = (await loaders({ directory: directory, expressApp: app, isTest: false })).container;

  var regionService = container.resolve("regionService");
  var shippingProfileService = container.resolve("shippingProfileService");
  var shippingOptionService = container.resolve("shippingOptionService");

  var regions = await regionService.list();
  var india = regions.find(function (r) { return r.currency_code === "inr"; });
  if (!india) {
    console.error("No INR region found. Create an India region first.");
    process.exit(1);
  }
  console.log("Region:", india.name, india.id);

  var profiles = await shippingProfileService.list();
  var profile = profiles.find(function (p) { return p.type === "default"; });
  if (!profile) {
    profile = await shippingProfileService.create({ name: "Default Shipping", type: "default" });
    console.log("Created default shipping profile:", profile.id);
  } else {
    console.log("Using profile:", profile.id);
  }

  var existing = await shippingOptionService.list({ region_id: india.id });
  if (existing.length > 0) {
    console.log("Shipping options already exist for this region:");
    existing.forEach(function (o) { console.log(" -", o.name, o.id, "amount:", o.amount); });
    process.exit(0);
  }

  var option = await shippingOptionService.create({
    name: "Standard Delivery",
    region_id: india.id,
    provider_id: "manual",
    data: {},
    price_type: "flat",
    amount: 9900, // ₹99.00
    profile_id: profile.id,
  });
  console.log("Created shipping option:", option.id, "Standard Delivery ₹99 flat");
  process.exit(0);
}

main().catch(function (err) {
  console.error("Failed:", err);
  process.exit(1);
});

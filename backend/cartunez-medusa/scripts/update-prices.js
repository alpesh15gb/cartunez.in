/**
 * Update prices for existing SahibaCar products from scraped data.
 * Usage: node scripts/update-prices.js
 */

var express = require("express");
var loaders = require("@medusajs/medusa/dist/loaders").default;
var fs = require("fs");
var path = require("path");

var DATA_FILE = "/tmp/sahibacar-data.json";

async function main() {
  console.log("=== SahibaCar Price Updater ===\n");

  if (!fs.existsSync(DATA_FILE)) {
    console.error("Data file not found. Run scraper first.");
    process.exit(1);
  }

  var data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  var directory = process.cwd();
  var app = express();
  process.env.LOG_LEVEL = "error";

  var container = (await loaders({ directory: directory, expressApp: app, isTest: false })).container;
  var manager = container.resolve("manager");
  var regionService = container.resolve("regionService");

  var regions = await regionService.list();
  var india = regions.find(function(r) { return r.currency_code === "inr"; });
  var regionId = india ? india.id : (regions[0] ? regions[0].id : null);
  if (!regionId) { console.error("No region found"); process.exit(1); }

  // Build a map of scraped product handle -> price
  var priceMap = {};
  data.products.forEach(function(p) {
    var handle = p.handle;
    if (p.price > 0) {
      priceMap[handle] = p.price;
    }
  });

  console.log("Scraped prices for " + Object.keys(priceMap).length + " products\n");

  // Get existing variants without prices
  var variants = await manager.query(`
    SELECT pv.id AS variant_id, p.handle, p.id AS product_id
    FROM product_variant pv
    JOIN product p ON p.id = pv.product_id
    WHERE p.metadata->>'source' = 'sahibacar.in'
  `);

  var updated = 0;
  var skipped = 0;
  var errors = 0;

  for (var i = 0; i < variants.length; i++) {
    var v = variants[i];
    var price = priceMap[v.handle];

    if (!price) { skipped++; continue; }

    // Check if price already exists
    var existing = await manager.query(
      "SELECT id FROM product_variant_money_amount WHERE variant_id = $1",
      [v.variant_id]
    );

    if (existing.length > 0) { skipped++; continue; }

    try {
      var priceResult = await manager.query(
        "INSERT INTO money_amount (id, currency_code, amount, min_quantity, max_quantity, created_at, updated_at) VALUES (gen_random_uuid(), 'inr', $1, NULL, NULL, NOW(), NOW()) RETURNING id",
        [price]
      );
      await manager.query(
        "INSERT INTO product_variant_money_amount (id, money_amount_id, variant_id, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())",
        [priceResult[0].id, v.variant_id]
      );
      updated++;
    } catch (err) {
      errors++;
    }

    if (updated % 50 === 0 && updated > 0) {
      console.log("  Updated " + updated + " prices...");
    }
  }

  console.log("\n=== Done ===");
  console.log("Updated: " + updated);
  console.log("Skipped: " + skipped);
  console.log("Errors: " + errors);

  process.exit(0);
}

main().catch(function(err) {
  console.error("Failed:", err);
  process.exit(1);
});

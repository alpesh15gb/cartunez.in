/**
 * NUCLEAR OPTION: Delete ALL products and categories from Medusa.
 * Usage: docker compose exec medusa node scripts/reset-all-products.js
 */

var express = require("express");
var loaders = require("@medusajs/medusa/dist/loaders").default;

async function main() {
  console.log("=== FULL PRODUCT RESET ===\n");

  var directory = process.cwd();
  var app = express();
  process.env.LOG_LEVEL = "error";

  var container = (await loaders({ directory: directory, expressApp: app, isTest: false })).container;
  var manager = container.resolve("manager");

  var count = await manager.query("SELECT COUNT(*) as cnt FROM product");
  console.log("Products before: " + count[0].cnt);

  await manager.query("SET CONSTRAINTS ALL DEFERRED");

  var products = await manager.query("SELECT id FROM product");
  var ids = products.map(function(p) { return p.id; });

  if (ids.length === 0) {
    console.log("No products to delete.");
    process.exit(0);
  }

  var chunkSize = 100;
  for (var i = 0; i < ids.length; i += chunkSize) {
    var chunk = ids.slice(i, i + chunkSize);
    var ph = chunk.map(function(_, idx) { return "$" + (idx + 1); }).join(",");

    // Try each table, skip if it doesn't exist
    var tables = [
      "product_option_value_product_option",
      "product_option",
      "product_variant",
      "product"
    ];

    for (var t = 0; t < tables.length; t++) {
      var table = tables[t];
      var col = table === "product" ? "id" : "product_id";
      if (table === "product_option_value_product_option") {
        col = "product_option_id";
        var subQ = "SELECT id FROM product_option WHERE product_id IN (" + ph + ")";
        try {
          await manager.query("DELETE FROM " + table + " WHERE " + col + " IN (" + subQ + ")", chunk);
        } catch (e) {
          if (!e.message.includes("does not exist")) console.error("  " + table + ": " + e.message);
        }
      } else {
        try {
          await manager.query("DELETE FROM " + table + " WHERE " + col + " IN (" + ph + ")", chunk);
        } catch (e) {
          if (!e.message.includes("does not exist")) console.error("  " + table + ": " + e.message);
        }
      }
    }

    process.stdout.write("  Deleted " + Math.min(i + chunkSize, ids.length) + "/" + ids.length + "\r");
  }

  console.log("\n");

  // Clean up category links
  try { await manager.query("DELETE FROM product_category_product"); } catch (e) {}
  try { await manager.query("DELETE FROM product_category"); } catch (e) {}

  var after = await manager.query("SELECT COUNT(*) as cnt FROM product");
  console.log("Products after: " + after[0].cnt);

  var cats = await manager.query("SELECT COUNT(*) as cnt FROM product_category");
  console.log("Categories after: " + cats[0].cnt);

  console.log("Done!");
  process.exit(0);
}

main().catch(function(err) {
  console.error("Failed:", err);
  process.exit(1);
});

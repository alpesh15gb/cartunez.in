/**
 * Delete all Neodrift products from Medusa database.
 * Usage: docker compose exec medusa node scripts/delete-neodrift.js
 */

var express = require("express");
var loaders = require("@medusajs/medusa/dist/loaders").default;

async function main() {
  console.log("=== Neodrift Product Deleter ===\n");

  var directory = process.cwd();
  var app = express();
  process.env.LOG_LEVEL = "error";

  var container = (await loaders({ directory: directory, expressApp: app, isTest: false })).container;
  var manager = container.resolve("manager");

  var products = await manager.query("SELECT id FROM product WHERE handle LIKE 'neodrift-%'");
  console.log("Found " + products.length + " products");

  if (products.length === 0) {
    console.log("Nothing to delete.");
    process.exit(0);
  }

  var ids = products.map(function(p) { return p.id; });
  var ph = ids.map(function(_, i) { return "$" + (i + 1); }).join(",");

  async function safeQuery(sql, params) {
    try {
      await manager.query(sql, params);
    } catch (e) {
      if (!e.message.includes("does not exist")) {
        console.error("  SQL error: " + e.message);
      }
    }
  }

  var variants = await manager.query("SELECT id FROM product_variant WHERE product_id IN (" + ph + ")", ids);
  var variantIds = variants.map(function(v) { return v.id; });

  if (variantIds.length > 0) {
    var vph = variantIds.map(function(_, i) { return "$" + (i + 1); }).join(",");
    await safeQuery("DELETE FROM product_variant_money_amount WHERE variant_id IN (" + vph + ")", variantIds);
    await safeQuery("DELETE FROM money_amount WHERE id IN (SELECT money_amount_id FROM product_variant_money_amount WHERE variant_id IN (" + vph + "))", variantIds);
  }

  await safeQuery("DELETE FROM product_category_product WHERE product_id IN (" + ph + ")", ids);
  await safeQuery("DELETE FROM product_option_value_product_option WHERE product_option_id IN (SELECT id FROM product_option WHERE product_id IN (" + ph + "))", ids);
  await safeQuery("DELETE FROM product_option WHERE product_id IN (" + ph + ")", ids);
  await safeQuery("DELETE FROM product_variant WHERE product_id IN (" + ph + ")", ids);
  await safeQuery("DELETE FROM product WHERE id IN (" + ph + ")", ids);

  var remaining = await manager.query("SELECT COUNT(*) as cnt FROM product WHERE handle LIKE 'neodrift-%'");
  console.log("Remaining: " + remaining[0].cnt + " products");
  console.log("Done!");

  process.exit(0);
}

main().catch(function(err) {
  console.error("Failed:", err);
  process.exit(1);
});

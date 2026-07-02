/**
 * Delete all SahibaCar products using direct SQL.
 * Usage: docker compose exec medusa node scripts/delete-sahibacar.js
 */

var express = require("express");
var loaders = require("@medusajs/medusa/dist/loaders").default;

async function main() {
  console.log("=== SahibaCar Product Deleter ===\n");

  var directory = process.cwd();
  var app = express();
  process.env.LOG_LEVEL = "error";

  var container = (await loaders({ directory: directory, expressApp: app, isTest: false })).container;
  var manager = container.resolve("manager");

  // Find sahibacar product IDs
  var products = await manager.query("SELECT id FROM product WHERE handle LIKE 'sahibacar-%'");
  console.log("Found " + products.length + " products");

  if (products.length === 0) {
    console.log("Nothing to delete.");
    process.exit(0);
  }

  var ids = products.map(function(p) { return p.id; });

  // Delete in correct order using raw SQL
  try {
    // Get variant IDs first
    var variants = await manager.query(
      "SELECT id FROM product_variant WHERE product_id IN (" + ids.map(function(_, i) { return "$" + (i + 1); }).join(",") + ")",
      ids
    );
    var variantIds = variants.map(function(v) { return v.id; });

    if (variantIds.length > 0) {
      // Delete price links
      await manager.query(
        "DELETE FROM product_variant_money_amount WHERE variant_id IN (" + variantIds.map(function(_, i) { return "$" + (i + 1); }).join(",") + ")",
        variantIds
      );

      // Delete money amounts
      await manager.query(
        "DELETE FROM money_amount WHERE id IN (SELECT money_amount_id FROM product_variant_money_amount WHERE variant_id IN (" + variantIds.map(function(_, i) { return "$" + (i + 1); }).join(",") + "))",
        variantIds
      );
    }

    // Delete category links
    await manager.query(
      "DELETE FROM product_category_product WHERE product_id IN (" + ids.map(function(_, i) { return "$" + (i + 1); }).join(",") + ")",
      ids
    );

    // Delete variants
    await manager.query(
      "DELETE FROM product_variant WHERE product_id IN (" + ids.map(function(_, i) { return "$" + (i + 1); }).join(",") + ")",
      ids
    );

    // Delete images
    await manager.query(
      "DELETE FROM product_image WHERE product_id IN (" + ids.map(function(_, i) { return "$" + (i + 1); }).join(",") + ")",
      ids
    );

    // Delete options
    await manager.query(
      "DELETE FROM product_option WHERE product_id IN (" + ids.map(function(_, i) { return "$" + (i + 1); }).join(",") + ")",
      ids
    );

    // Delete products
    await manager.query(
      "DELETE FROM product WHERE id IN (" + ids.map(function(_, i) { return "$" + (i + 1); }).join(",") + ")",
      ids
    );

    console.log("Deleted " + ids.length + " products");
  } catch (err) {
    console.error("Error: " + err.message);
  }

  process.exit(0);
}

main().catch(function(err) {
  console.error("Failed:", err);
  process.exit(1);
});

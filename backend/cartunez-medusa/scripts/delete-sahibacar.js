/**
 * Delete all SahibaCar products from Medusa database.
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

  // Find all sahibacar products
  var products = await manager.query(
    "SELECT id, handle FROM product WHERE handle LIKE 'sahibacar-%'"
  );
  console.log("Found " + products.length + " SahibaCar products to delete\n");

  if (products.length === 0) {
    console.log("Nothing to delete.");
    process.exit(0);
  }

  var deleted = 0;
  var errors = 0;

  for (var i = 0; i < products.length; i++) {
    var product = products[i];
    try {
      // Delete category links
      await manager.query(
        "DELETE FROM product_category_product WHERE product_id = $1",
        [product.id]
      );

      // Delete variant money amounts
      await manager.query(
        "DELETE FROM product_variant_money_amount WHERE variant_id IN (SELECT id FROM product_variant WHERE product_id = $1)",
        [product.id]
      );

      // Delete money amounts
      await manager.query(
        "DELETE FROM money_amount WHERE id IN (SELECT money_amount_id FROM product_variant_money_amount WHERE variant_id IN (SELECT id FROM product_variant WHERE product_id = $1))",
        [product.id]
      );

      // Delete variants
      await manager.query(
        "DELETE FROM product_variant WHERE product_id = $1",
        [product.id]
      );

      // Delete product options
      await manager.query(
        "DELETE FROM product_option WHERE product_id = $1",
        [product.id]
      );

      // Delete product images
      await manager.query(
        "DELETE FROM product_image WHERE product_id = $1",
        [product.id]
      );

      // Delete product
      await manager.query(
        "DELETE FROM product WHERE id = $1",
        [product.id]
      );

      deleted++;
      if (deleted % 50 === 0) {
        console.log("  Deleted " + deleted + " products...");
      }
    } catch (err) {
      console.error("  Error deleting '" + product.handle + "': " + err.message);
      errors++;
    }
  }

  console.log("\n=== Done ===");
  console.log("Deleted: " + deleted);
  console.log("Errors: " + errors);

  process.exit(0);
}

main().catch(function(err) {
  console.error("Failed:", err);
  process.exit(1);
});

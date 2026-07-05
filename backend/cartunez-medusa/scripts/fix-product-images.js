/**
 * Migration: Backfill product_image table from product.thumbnail
 *
 * The original import scripts only set product.thumbnail but never inserted
 * rows into the product_image table. This script fixes existing products.
 *
 * Usage: node scripts/fix-product-images.js
 * Run from the Medusa backend directory (cartunez-medusa/)
 */

var express = require("express");
var loaders = require("@medusajs/medusa/dist/loaders").default;

async function main() {
  console.log("=== Fix Product Images Migration ===\n");

  var directory = process.cwd();
  var app = express();
  process.env.LOG_LEVEL = "error";

  var container = (await loaders({ directory: directory, expressApp: app, isTest: false })).container;
  var manager = container.resolve("manager");

  // 1. Find all products with thumbnails but no images
  var products = await manager.query(`
    SELECT p.id, p.handle, p.thumbnail
    FROM product p
    WHERE p.thumbnail IS NOT NULL
      AND p.thumbnail != ''
      AND NOT EXISTS (
        SELECT 1 FROM product_image pi WHERE pi.product_id = p.id
      )
    ORDER BY p.created_at
  `);

  console.log("Found " + products.length + " products with thumbnails but no images\n");

  if (products.length === 0) {
    console.log("Nothing to fix!");
    process.exit(0);
  }

  // 2. Insert product_image for each product
  var fixed = 0;
  var errors = 0;

  for (var i = 0; i < products.length; i++) {
    var product = products[i];
    try {
      await manager.query(
        "INSERT INTO product_image (id, product_id, url, rank, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, 0, NOW(), NOW())",
        [product.id, product.thumbnail]
      );
      fixed++;
      if (fixed % 50 === 0) {
        console.log("  Fixed " + fixed + "/" + products.length + " products...");
      }
    } catch (err) {
      console.error("  Error fixing product '" + product.handle + "': " + err.message);
      errors++;
    }
  }

  console.log("\n=== Done ===");
  console.log("Fixed: " + fixed);
  console.log("Errors: " + errors);
  console.log("Skipped (already had images): " + (await countProductsWithImages(manager) - fixed));

  process.exit(0);
}

async function countProductsWithImages(manager) {
  var result = await manager.query("SELECT COUNT(DISTINCT product_id) as count FROM product_image");
  return parseInt(result[0].count) || 0;
}

main().catch(function(err) {
  console.error("Failed:", err);
  process.exit(1);
});

/**
 * Migration verification script.
 *
 * Runs the SQL queries required for production verification:
 *   1. COUNT of product_image rows
 *   2. COUNT of products with thumbnails
 *   3. Products with no product_image (orphan check)
 *
 * Usage: node scripts/verify-migration.js
 * Run from the Medusa backend directory (cartunez-medusa/)
 */

var express = require("express");
var loaders = require("@medusajs/medusa/dist/loaders").default;

async function main() {
  console.log("=== Migration Verification ===\n");

  var directory = process.cwd();
  var app = express();
  process.env.LOG_LEVEL = "error";

  var container = (await loaders({ directory: directory, expressApp: app, isTest: false })).container;
  var manager = container.resolve("manager");

  // Query 1: Total product_image rows
  var imageCount = (await manager.query("SELECT COUNT(*) as count FROM product_image"))[0].count;
  console.log("SELECT COUNT(*) FROM product_image;");
  console.log("  Result: " + imageCount);
  console.log("");

  // Query 2: Products with thumbnails
  var thumbCount = (await manager.query(
    "SELECT COUNT(*) as count FROM product WHERE thumbnail IS NOT NULL"
  ))[0].count;
  console.log("SELECT COUNT(*) FROM product WHERE thumbnail IS NOT NULL;");
  console.log("  Result: " + thumbCount);
  console.log("");

  // Query 3: Products with no product_image
  var orphanProducts = await manager.query(`
    SELECT id, title
    FROM product
    WHERE id NOT IN (
      SELECT DISTINCT product_id
      FROM product_image
    )
  `);
  console.log("SELECT id, title FROM product WHERE id NOT IN (SELECT DISTINCT product_id FROM product_image);");
  console.log("  Result: " + orphanProducts.length + " products");
  for (var i = 0; i < orphanProducts.length; i++) {
    var p = orphanProducts[i];
    console.log("    - " + p.id + " | " + p.title);
  }
  console.log("");

  // Additional: products with thumbnail but no images (the critical bug)
  var thumbNoImage = await manager.query(`
    SELECT p.id, p.handle, p.title
    FROM product p
    WHERE p.thumbnail IS NOT NULL
      AND p.thumbnail != ''
      AND NOT EXISTS (
        SELECT 1 FROM product_image pi WHERE pi.product_id = p.id
      )
  `);
  console.log("Products with thumbnail but NO product_image rows: " + thumbNoImage.length);
  for (var j = 0; j < thumbNoImage.length; j++) {
    console.log("  - " + thumbNoImage[j].handle + " | " + thumbNoImage[j].title);
  }
  console.log("");

  // Additional: products with images but no thumbnail
  var imageNoThumb = await manager.query(`
    SELECT p.id, p.handle, p.title, COUNT(pi.id) as img_count
    FROM product p
    JOIN product_image pi ON pi.product_id = p.id
    WHERE p.thumbnail IS NULL OR p.thumbnail = ''
    GROUP BY p.id, p.handle, p.title
  `);
  console.log("Products with images but no thumbnail: " + imageNoThumb.length);
  for (var k = 0; k < imageNoThumb.length; k++) {
    console.log("  - " + imageNoThumb[k].handle + " (" + imageNoThumb[k].img_count + " images)");
  }
  console.log("");

  // Verdict
  var totalProducts = (await manager.query("SELECT COUNT(*) as count FROM product"))[0].count;
  var productsWithImages = (await manager.query(
    "SELECT COUNT(DISTINCT product_id) as count FROM product_image"
  ))[0].count;

  console.log("=== Verdict ===");
  console.log("Total products: " + totalProducts);
  console.log("Products with images: " + productsWithImages);
  console.log("Orphan products (no images): " + orphanProducts.length);
  console.log("Thumbnail-phantom products: " + thumbNoImage.length);

  if (thumbNoImage.length > 0) {
    console.log("\nACTION REQUIRED: " + thumbNoImage.length + " products have thumbnails but no product_image rows.");
    console.log("Run: node scripts/fix-product-images.js");
  } else if (orphanProducts.length > 0) {
    console.log("\nNOTE: " + orphanProducts.length + " products have no images at all.");
    console.log("These may be seed products or imports without image sources.");
  } else {
    console.log("\nAll products have corresponding product_image rows.");
  }

  process.exit(0);
}

main().catch(function(err) {
  console.error("Verification failed:", err);
  process.exit(1);
});

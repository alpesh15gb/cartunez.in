/**
 * Validate product image integrity.
 *
 * Checks for data integrity violations:
 *   1. thumbnail exists BUT product_image is empty (import bug)
 *   2. product_image exists BUT thumbnail is NULL (inconsistent)
 *   3. product_image URLs are broken or empty
 *
 * Exit code 1 = violations found (treat as CI/import failure)
 * Exit code 0 = all clean
 *
 * Usage: node scripts/validate-product-images.js
 * Run from the Medusa backend directory (cartunez-medusa/)
 */

var express = require("express");
var loaders = require("@medusajs/medusa/dist/loaders").default;

async function main() {
  console.log("=== Product Image Integrity Validation ===\n");

  var directory = process.cwd();
  var app = express();
  process.env.LOG_LEVEL = "error";

  var container = (await loaders({ directory: directory, expressApp: app, isTest: false })).container;
  var manager = container.resolve("manager");

  var violations = [];

  // Check 1: thumbnail exists but product_image is empty
  var thumbOnly = await manager.query(`
    SELECT p.id, p.handle, p.title, p.thumbnail
    FROM product p
    WHERE p.thumbnail IS NOT NULL
      AND p.thumbnail != ''
      AND NOT EXISTS (
        SELECT 1 FROM product_image pi WHERE pi.product_id = p.id
      )
    ORDER BY p.handle
  `);

  if (thumbOnly.length > 0) {
    console.log("VIOLATION: " + thumbOnly.length + " products have thumbnail but NO product_image rows:");
    for (var i = 0; i < thumbOnly.length; i++) {
      var p = thumbOnly[i];
      console.log("  - " + p.handle + " (" + p.id + ")");
      violations.push({ type: "THUMB_NO_IMAGE", handle: p.handle, id: p.id });
    }
    console.log("");
  }

  // Check 2: product_image exists but thumbnail is NULL
  var imageNoThumb = await manager.query(`
    SELECT p.id, p.handle, p.title,
           COUNT(pi.id) AS image_count
    FROM product p
    JOIN product_image pi ON pi.product_id = p.id
    WHERE p.thumbnail IS NULL OR p.thumbnail = ''
    GROUP BY p.id, p.handle, p.title
    ORDER BY p.handle
  `);

  if (imageNoThumb.length > 0) {
    console.log("WARNING: " + imageNoThumb.length + " products have images but no thumbnail:");
    for (var j = 0; j < imageNoThumb.length; j++) {
      var p2 = imageNoThumb[j];
      console.log("  - " + p2.handle + " (" + p2.image_count + " images, no thumbnail)");
      violations.push({ type: "IMAGE_NO_THUMB", handle: p2.handle, id: p2.id, imageCount: p2.image_count });
    }
    console.log("");
  }

  // Check 3: product_image with empty or null URL
  var brokenUrls = await manager.query(`
    SELECT pi.id, pi.product_id, pi.url, p.handle
    FROM product_image pi
    JOIN product p ON p.id = pi.product_id
    WHERE pi.url IS NULL OR pi.url = ''
    ORDER BY p.handle
  `);

  if (brokenUrls.length > 0) {
    console.log("VIOLATION: " + brokenUrls.length + " product_image rows with empty/null URL:");
    for (var k = 0; k < brokenUrls.length; k++) {
      var img = brokenUrls[k];
      console.log("  - " + img.handle + " image_id=" + img.id);
      violations.push({ type: "BROKEN_URL", handle: img.handle, id: img.product_id, imageId: img.id });
    }
    console.log("");
  }

  // Check 4: Products with no images and no thumbnail (empty products)
  var noImages = await manager.query(`
    SELECT p.id, p.handle, p.title
    FROM product p
    WHERE (p.thumbnail IS NULL OR p.thumbnail = '')
      AND NOT EXISTS (
        SELECT 1 FROM product_image pi WHERE pi.product_id = p.id
      )
    ORDER BY p.handle
  `);

  if (noImages.length > 0) {
    console.log("INFO: " + noImages.length + " products have no images and no thumbnail:");
    for (var m = 0; m < Math.min(noImages.length, 20); m++) {
      console.log("  - " + noImages[m].handle);
    }
    if (noImages.length > 20) {
      console.log("  ... and " + (noImages.length - 20) + " more");
    }
    console.log("");
  }

  // Summary
  var productCount = (await manager.query("SELECT COUNT(*) as count FROM product"))[0].count;
  var imageCount = (await manager.query("SELECT COUNT(*) as count FROM product_image"))[0].count;
  var thumbCount = (await manager.query("SELECT COUNT(*) as count FROM product WHERE thumbnail IS NOT NULL AND thumbnail != ''"))[0].count;

  console.log("=== Summary ===");
  console.log("Total products: " + productCount);
  console.log("Products with thumbnail: " + thumbCount);
  console.log("Total product_image rows: " + imageCount);
  console.log("Violations: " + violations.length);
  console.log("");

  if (violations.length > 0) {
    console.error("FAILED: " + violations.length + " integrity violations found.");
    console.error("Run fix-product-images.js to backfill missing image rows.");
    process.exit(1);
  } else {
    console.log("PASSED: All product images are consistent.");
    process.exit(0);
  }
}

main().catch(function(err) {
  console.error("Validation failed:", err);
  process.exit(1);
});

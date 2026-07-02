/**
 * Recategorize existing SahibaCar products based on updated scraped data.
 * Usage: docker compose exec medusa node scripts/recategorize-sahibacar.js
 */

var express = require("express");
var loaders = require("@medusajs/medusa/dist/loaders").default;
var fs = require("fs");

var DATA_FILE = "/tmp/sahibacar-data.json";

async function main() {
  console.log("=== SahibaCar Recategorizer ===\n");

  if (!fs.existsSync(DATA_FILE)) {
    console.error("Data file not found: " + DATA_FILE);
    console.error("Run scraper first: node scripts/scrape-sahibacar.js");
    process.exit(1);
  }

  var data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  console.log("Loaded " + data.products.length + " products from scraped data\n");

  var directory = process.cwd();
  var app = express();
  process.env.LOG_LEVEL = "error";

  var container = (await loaders({ directory: directory, expressApp: app, isTest: false })).container;
  var manager = container.resolve("manager");

  // Build lookup from handle -> category
  var categoryMap = {};
  for (var i = 0; i < data.products.length; i++) {
    var p = data.products[i];
    if (p.handle && p.category) {
      categoryMap[p.handle] = p.category;
    }
  }
  console.log("Category map: " + Object.keys(categoryMap).length + " products\n");

  // Get existing products
  var existingProducts = await manager.query(
    "SELECT id, handle, title FROM product WHERE handle LIKE 'sahibacar-%'"
  );
  console.log("Found " + existingProducts.length + " existing products to update\n");

  // Get or create all needed categories
  var categoryCache = {};
  var uniqueCategories = [...new Set(Object.values(categoryMap))];

  for (var c = 0; c < uniqueCategories.length; c++) {
    var catName = uniqueCategories[c];
    var key = catName.toLowerCase().trim();
    if (categoryCache[key]) continue;

    var existing = await manager.query(
      "SELECT id FROM product_category WHERE name = $1",
      [catName]
    );
    if (existing.length > 0) {
      categoryCache[key] = existing[0].id;
    } else {
      var slug = catName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
      var result = await manager.query(
        "INSERT INTO product_category (id, name, handle, is_active, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, true, NOW(), NOW()) RETURNING id",
        [catName, slug]
      );
      categoryCache[key] = result[0].id;
      console.log("  Created category: " + catName);
    }
  }
  console.log("Categories ready: " + Object.keys(categoryCache).length + "\n");

  // Update each product
  var updated = 0;
  var skipped = 0;
  var errors = 0;

  for (var i = 0; i < existingProducts.length; i++) {
    var product = existingProducts[i];
    var newCategoryName = categoryMap[product.handle];

    if (!newCategoryName) {
      skipped++;
      continue;
    }

    try {
      var catKey = newCategoryName.toLowerCase().trim();
      var categoryId = categoryCache[catKey];

      if (!categoryId) {
        errors++;
        continue;
      }

      // Remove old category links
      await manager.query(
        "DELETE FROM product_category_product_categories WHERE product_id = $1",
        [product.id]
      );

      // Add new category link
      await manager.query(
        "INSERT INTO product_category_product_categories (product_id, product_category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [product.id, categoryId]
      );

      updated++;
      if (updated % 50 === 0) {
        console.log("  Updated " + updated + " products...");
      }
    } catch (err) {
      console.error("  Error updating '" + product.title + "': " + err.message);
      errors++;
    }
  }

  console.log("\n=== Done ===");
  console.log("Updated: " + updated);
  console.log("Skipped (no category): " + skipped);
  console.log("Errors: " + errors);

  process.exit(0);
}

main().catch(function(err) {
  console.error("Failed:", err);
  process.exit(1);
});

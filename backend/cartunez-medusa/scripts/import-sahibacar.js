/**
 * SahibaCar.in Product Importer
 *
 * Reads scraped data from /tmp/sahibacar-data.json and imports into Medusa.
 * Usage: node scripts/import-sahibacar.js
 */

var express = require("express");
var loaders = require("@medusajs/medusa/dist/loaders").default;
var fs = require("fs");
var path = require("path");

var DATA_FILE = "/tmp/sahibacar-data.json";

async function main() {
  console.log("=== SahibaCar.in Importer ===\n");

  if (!fs.existsSync(DATA_FILE)) {
    console.error("Data file not found: " + DATA_FILE);
    console.error("Run scraper first: node scripts/scrape-sahibacar.js");
    process.exit(1);
  }

  var data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  console.log("Loaded " + data.totalProducts + " products from scraped data\n");

  var directory = process.cwd();
  var app = express();
  process.env.LOG_LEVEL = "error";

  var container = (await loaders({ directory: directory, expressApp: app, isTest: false })).container;
  var manager = container.resolve("manager");
  var regionService = container.resolve("regionService");

  var regionId;
  try {
    var regions = await regionService.list();
    var india = regions.find(function(r) { return r.currency_code === "inr"; });
    regionId = india ? india.id : (regions[0] ? regions[0].id : null);
    if (!regionId) throw new Error("No region found");
    console.log("Using region: " + regionId + "\n");
  } catch (err) {
    console.error("Could not find region. Make sure you have an India region set up.");
    process.exit(1);
  }

  var categoryCache = {};

  async function getOrCreateCategory(name) {
    var key = name.toLowerCase().trim();
    if (categoryCache[key]) return categoryCache[key];

    try {
      var existing = await manager.query(
        "SELECT id FROM product_category WHERE name = $1",
        [name]
      );
      if (existing.length > 0) {
        categoryCache[key] = existing[0].id;
        return existing[0].id;
      }

      var slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
      var result = await manager.query(
        "INSERT INTO product_category (id, name, handle, is_active, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, true, NOW(), NOW()) RETURNING id",
        [name, slug]
      );
      categoryCache[key] = result[0].id;
      return result[0].id;
    } catch (err) {
      console.error("  Error creating category '" + name + "': " + err.message);
      return null;
    }
  }

  var existingProducts = await manager.query(
    "SELECT handle FROM product WHERE handle LIKE 'sahibacar-%'"
  );
  var existingHandles = {};
  existingProducts.forEach(function(p) { existingHandles[p.handle] = true; });
  console.log("Found " + existingProducts.length + " existing SahibaCar products\n");

  var created = 0;
  var skipped = 0;
  var errors = 0;

  for (var i = 0; i < data.products.length; i++) {
    var product = data.products[i];

    if (existingHandles[product.handle]) {
      skipped++;
      continue;
    }

    try {
      var categoryId = null;
      if (product.category) {
        categoryId = await getOrCreateCategory(product.category);
      }

      var productResult = await manager.query(
        "INSERT INTO product (id, title, handle, description, status, discountable, is_giftcard, metadata, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, $3, 'published', true, false, $4, NOW(), NOW()) RETURNING id",
        [
          product.title,
          product.handle,
          product.description || "",
          JSON.stringify({
            brand: product.vendor,
            source: "sahibacar.in",
            source_url: product.sourceUrl,
            tags: product.tags,
          }),
        ]
      );

      var productId = productResult[0].id;

      if (categoryId) {
        try {
          await manager.query(
            "INSERT INTO product_category_product_categories (product_id, product_category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            [productId, categoryId]
          );
        } catch (e) {}
      }

      var optLabel = "Default";
      if (product.options && product.options.length > 0) {
        optLabel = product.options.map(function(o) { return o.values[0]; }).join(" / ");
      }

      var variantResult = await manager.query(
        "INSERT INTO product_variant (id, title, product_id, sku, inventory_quantity, allow_backorder, manage_inventory, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, $3, 10, false, false, NOW(), NOW()) RETURNING id",
        [optLabel, productId, product.sku]
      );

      var variantId = variantResult[0].id;

      if (product.price > 0) {
        try {
          await manager.query(
            "INSERT INTO product_variant_price (id, currency_code, amount, min_quantity, max_quantity, region_id, variant_id, created_at, updated_at) VALUES (gen_random_uuid(), 'inr', $1, NULL, NULL, $2, $3, NOW(), NOW())",
            [product.price, regionId, variantId]
          );
        } catch (priceErr) {
          // If the price table doesn't exist, try the Medusa way
          if (priceErr.message && priceErr.message.includes("does not exist")) {
            console.log("  Skipping price for: " + product.title + " (price table missing)");
          } else {
            throw priceErr;
          }
        }
      }

      if (product.images && product.images.length > 0) {
        var thumbUrl = product.images[0].servePath;
        await manager.query(
          "UPDATE product SET thumbnail = $1 WHERE id = $2",
          [thumbUrl, productId]
        );
      }

      created++;
      if (created % 10 === 0) {
        console.log("  Imported " + created + " products...");
      }
    } catch (err) {
      console.error("  Error importing '" + product.title + "': " + err.message);
      errors++;
    }
  }

  console.log("\n=== Done ===");
  console.log("Created: " + created);
  console.log("Skipped (duplicate): " + skipped);
  console.log("Errors: " + errors);

  process.exit(0);
}

main().catch(function(err) {
  console.error("Failed:", err);
  process.exit(1);
});

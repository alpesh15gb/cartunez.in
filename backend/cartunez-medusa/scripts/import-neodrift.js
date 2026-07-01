/**
 * Neodrift.in Product Importer
 *
 * Usage: node scripts/import-neodrift.js
 */

var express = require("express");
var loaders = require("@medusajs/medusa/dist/loaders").default;
var fs = require("fs");

var DATA_FILE = "/tmp/neodrift-data.json";

async function main() {
  console.log("=== Neodrift.in Importer ===\n");

  if (!fs.existsSync(DATA_FILE)) {
    console.error("Data file not found. Run scraper first.");
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

  var regions = await regionService.list();
  var india = regions.find(function(r) { return r.currency_code === "inr"; });
  var regionId = india ? india.id : (regions[0] ? regions[0].id : null);
  if (!regionId) { console.error("No region found"); process.exit(1); }
  console.log("Using region: " + regionId + "\n");

  // Link products to default sales channel
  var store = (await manager.query("SELECT default_sales_channel_id FROM store LIMIT 1"))[0];
  var salesChannelId = store ? store.default_sales_channel_id : null;

  var categoryCache = {};
  async function getOrCreateCategory(name) {
    var key = name.toLowerCase().trim();
    if (categoryCache[key]) return categoryCache[key];
    try {
      var existing = await manager.query("SELECT id FROM product_category WHERE name = $1", [name]);
      if (existing.length > 0) { categoryCache[key] = existing[0].id; return existing[0].id; }
      var slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
      var result = await manager.query("INSERT INTO product_category (id, name, handle, is_active, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, true, NOW(), NOW()) RETURNING id", [name, slug]);
      categoryCache[key] = result[0].id;
      return result[0].id;
    } catch (err) { return null; }
  }

  var existingProducts = await manager.query("SELECT handle FROM product WHERE handle LIKE 'neodrift-%'");
  var existingHandles = {};
  existingProducts.forEach(function(p) { existingHandles[p.handle] = true; });
  console.log("Found " + existingProducts.length + " existing Neodrift products\n");

  var created = 0, skipped = 0, errors = 0;

  for (var i = 0; i < data.products.length; i++) {
    var product = data.products[i];
    if (existingHandles[product.handle]) { skipped++; continue; }

    try {
      // Replace neodrift branding with cartunez
      var title = product.title.replace(/neodrift/gi, "Cartunez").replace(/NeoDrift/g, "Cartunez");
      var description = (product.description || "").replace(/neodrift/gi, "Cartunez").replace(/NeoDrift/g, "Cartunez");

      var categoryId = product.category ? await getOrCreateCategory(product.category) : null;

      var productResult = await manager.query(
        "INSERT INTO product (id, title, handle, description, status, discountable, is_giftcard, metadata, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, $3, 'published', true, false, $4, NOW(), NOW()) RETURNING id",
        [title, product.handle, description, JSON.stringify({ brand: product.vendor, source: "neodrift.in", source_url: product.sourceUrl, tags: product.tags })]
      );
      var productId = productResult[0].id;

      if (categoryId) {
        try { await manager.query("INSERT INTO product_category_product (product_id, product_category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [productId, categoryId]); } catch (e) {}
      }

      var variantResult = await manager.query(
        "INSERT INTO product_variant (id, title, product_id, sku, inventory_quantity, allow_backorder, manage_inventory, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, $3, 10, false, false, NOW(), NOW()) RETURNING id",
        [product.options && product.options.length > 0 ? product.options.map(function(o) { return o.values[0]; }).join(" / ") : "Default", productId, product.sku]
      );
      var variantId = variantResult[0].id;

      if (product.price > 0) {
        try {
          var priceResult = await manager.query("INSERT INTO money_amount (id, currency_code, amount, min_quantity, max_quantity, region_id, created_at, updated_at) VALUES (gen_random_uuid(), 'inr', $1, NULL, NULL, $2, NOW(), NOW()) RETURNING id", [product.price, regionId]);
          await manager.query("INSERT INTO product_variant_money_amount (id, money_amount_id, variant_id, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())", [priceResult[0].id, variantId]);
        } catch (e) {}
      }

      if (product.images && product.images.length > 0) {
        await manager.query("UPDATE product SET thumbnail = $1 WHERE id = $2", [product.images[0].servePath, productId]);
      }

      if (salesChannelId) {
        try { await manager.query("INSERT INTO product_sales_channel (product_id, sales_channel_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [productId, salesChannelId]); } catch (e) {}
      }

      created++;
      if (created % 50 === 0) console.log("  Imported " + created + " products...");
    } catch (err) {
      errors++;
    }
  }

  console.log("\n=== Done ===");
  console.log("Created: " + created);
  console.log("Skipped: " + skipped);
  console.log("Errors: " + errors);
  process.exit(0);
}

main().catch(function(err) { console.error("Failed:", err); process.exit(1); });

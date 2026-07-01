/**
 * SahibaCar.in Product Importer
 *
 * Reads scraped data from /tmp/sahibacar-data.json and imports into Medusa.
 * Creates products with categories, variants, images, and pricing.
 *
 * Usage: node scripts/import-sahibacar.js
 */

const express = require("express");
const loaders = require("@medusajs/medusa/dist/loaders").default;
const fs = require("fs");
const path = require("path");

const DATA_FILE = "/tmp/sahibacar-data.json";

async function main() {
  console.log("=== SahibaCar.in Importer ===\n");

  if (!fs.existsSync(DATA_FILE)) {
    console.error(`Data file not found: ${DATA_FILE}`);
    console.error("Run scraper first: node scripts/scrape-sahibacar.js");
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  console.log(`Loaded ${data.totalProducts} products from scraped data\n");

  // Bootstrap Medusa
  const directory = process.cwd();
  const app = express();
  process.env.LOG_LEVEL = "error";

  const { container } = await loaders({ directory, expressApp: app, isTest: false });
  const manager = container.resolve("manager");
  const productService = container.resolve("productService");
  const fileService = container.resolve("fileService");
  const regionService = container.resolve("regionService");

  // Get default region (India) for pricing
  let regionId;
  try {
    const regions = await regionService.list();
    const india = regions.find(r => r.currency_code === "inr");
    regionId = india?.id || regions[0]?.id;
    if (!regionId) throw new Error("No region found");
    console.log(`Using region: ${regionId}\n`);
  } catch (err) {
    console.error("Could not find region. Make sure you have an India region set up.");
    process.exit(1);
  }

  // Build category cache
  const categoryCache = {};

  async function getOrCreateCategory(name) {
    const key = name.toLowerCase().trim();
    if (categoryCache[key]) return categoryCache[key];

    try {
      const existing = await manager.query(
        `SELECT id FROM product_category WHERE name = $1 OR handle = $2`,
        [name, name.toLowerCase().replace(/[^a-z0-9]+/g, "-")]
      );
      if (existing.length > 0) {
        categoryCache[key] = existing[0].id;
        return existing[0].id;
      }

      // Create category
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
      const result = await manager.query(
        `INSERT INTO product_category (id, name, handle, is_active, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, true, NOW(), NOW())
         RETURNING id`,
        [name, slug]
      );
      categoryCache[key] = result[0].id;
      return result[0].id;
    } catch (err) {
      console.error(`  Error creating category "${name}": ${err.message}`);
      return null;
    }
  }

  // Check existing products to avoid duplicates
  const existingProducts = await manager.query(
    `SELECT handle FROM product WHERE handle LIKE 'sahibacar-%'`
  );
  const existingHandles = new Set(existingProducts.map(p => p.handle));
  console.log(`Found ${existingHandles.size} existing SahibaCar products\n`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const product of data.products) {
    if (existingHandles.has(product.handle)) {
      skipped++;
      continue;
    }

    try {
      // Create category if needed
      let categoryId = null;
      if (product.category) {
        categoryId = await getOrCreateCategory(product.category);
      }

      // Create product
      const productResult = await manager.query(
        `INSERT INTO product (
          id, title, handle, description, status, discountable,
          is_giftcard, metadata, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, 'published', true,
          false, $4, NOW(), NOW()
        ) RETURNING id`,
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

      const productId = productResult[0].id;

      // Link to category
      if (categoryId) {
        try {
          await manager.query(
            `INSERT INTO product_category_product_categories (product_id, product_category_id)
             VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [productId, categoryId]
          );
        } catch (e) { /* category link might already exist */ }
      }

      // Create variant
      const variantResult = await manager.query(
        `INSERT INTO product_variant (
          id, title, product_id, sku, inventory_quantity,
          allow_backorder, manage_inventory, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, 10,
          false, false, NOW(), NOW()
        ) RETURNING id`,
        [
          product.options.length > 0 ? product.options.map(o => o.values[0]).join(" / ") : "Default",
          productId,
          product.sku,
        ]
      );

      const variantId = variantResult[0].id;

      // Create price
      if (product.price > 0) {
        await manager.query(
          `INSERT INTO product_variant_price (
            id, currency_code, amount, min_quantity, max_quantity,
            region_id, variant_id, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), 'inr', $1, NULL, NULL,
            $2, $3, NOW(), NOW()
          )`,
          [product.price, regionId, variantId]
        );
      }

      // Download and attach images
      if (product.images.length > 0) {
        const thumbnailImage = product.images[0];
        const thumbUrl = `/uploads/sahibacar/${thumbnailImage.filename}`;

        await manager.query(
          `UPDATE product SET thumbnail = $1 WHERE id = $2`,
          [thumbUrl, productId]
        );
      }

      created++;
      if (created % 10 === 0) {
        console.log(`  Imported ${created} products...`);
      }
    } catch (err) {
      console.error(`  Error importing "${product.title}": ${err.message}`);
      errors++;
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`Created: ${created}`);
  console.log(`Skipped (duplicate): ${skipped}`);
  console.log(`Errors: ${errors}`);

  process.exit(0);
}

main().catch(err => {
  console.error("Failed:", err);
  process.exit(1);
});

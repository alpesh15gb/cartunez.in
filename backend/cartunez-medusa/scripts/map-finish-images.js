/**
 * Map finish codes to product images in Medusa metadata.
 *
 * Reads scraped data from /tmp/neowheels-data.json, finds which uploaded image
 * belongs to which variant (by filename suffix = last 8 chars of variant ID),
 * then stores a finish_to_image mapping in each product's metadata.
 *
 * Usage: node scripts/map-finish-images.js
 */

const express = require("express");
const loaders = require("@medusajs/medusa/dist/loaders").default;
const fs = require("fs");
const path = require("path");

const DATA_FILE = "/tmp/neowheels-data.json";
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");

async function main() {
  console.log("=== Map Finish Codes to Product Images ===\n");

  if (!fs.existsSync(DATA_FILE)) {
    console.error(`Data file not found: ${DATA_FILE}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  console.log(`Loaded ${data.totalDesigns} designs from scraped data`);

  // Get all uploaded files
  const uploadFiles = fs.readdirSync(UPLOAD_DIR);
  console.log(`Found ${uploadFiles.length} uploaded files\n`);

  // Bootstrap Medusa
  const directory = process.cwd();
  const app = express();
  process.env.LOG_LEVEL = "error";

  const { container } = await loaders({ directory, expressApp: app, isTest: false });
  const manager = container.resolve("manager");

  // Get all neowheel products from DB
  const products = await manager.query(`
    SELECT id, handle, title, metadata
    FROM product
    WHERE handle LIKE 'neowheels-%'
    ORDER BY handle
  `);

  console.log(`Found ${products.length} products in database\n`);

  let updated = 0;
  let skipped = 0;

  for (const product of products) {
    const designSlug = product.handle.replace("neowheels-", "");

    // Find this design in scraped data
    const design = data.designs?.find(d => {
      const slug = d.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
      return slug === designSlug || d.handle === designSlug;
    });

    if (!design || !design.variants) {
      skipped++;
      continue;
    }

    // Build finish → image mapping
    const finishToImage = {};

    for (const variant of design.variants) {
      const finishCode = variant.finish || variant.finishCode;
      if (!finishCode) continue;

      // The import script names images as {handle}-{variantId.slice(-8)}.{ext}
      // We need to find the actual uploaded file
      const variantSuffix = variant.id ? variant.id.slice(-8) : null;
      if (!variantSuffix) continue;

      // Search for matching file
      const matchingFile = uploadFiles.find(f =>
        f.startsWith(`${product.handle}-`) && f.includes(variantSuffix)
      );

      if (matchingFile) {
        // Only use first image per finish (some finishes may have multiple variants with same image)
        if (!finishToImage[finishCode]) {
          finishToImage[finishCode] = `/uploads/${matchingFile}`;
        }
      }
    }

    if (Object.keys(finishToImage).length === 0) {
      skipped++;
      continue;
    }

    // Update product metadata with finish_to_image mapping
    const existingMeta = product.metadata && typeof product.metadata === 'string'
      ? JSON.parse(product.metadata)
      : (product.metadata || {});

    const updatedMeta = {
      ...existingMeta,
      finish_to_image: finishToImage,
    };

    await manager.query(
      `UPDATE product SET metadata = $1 WHERE id = $2`,
      [JSON.stringify(updatedMeta), product.id]
    );

    updated++;
    const finishes = Object.keys(finishToImage).join(", ");
    console.log(`  ${product.handle}: ${finishes}`);
  }

  console.log(`\n=== Done ===`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);

  process.exit(0);
}

main().catch(err => {
  console.error("Failed:", err);
  process.exit(1);
});

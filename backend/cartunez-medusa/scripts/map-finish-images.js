/**
 * Map finish codes to product images in Medusa metadata.
 *
 * Queries the database for products and variants, matches uploaded images
 * to variants by filename pattern ({handle}-{variantIdLast8}.{ext}),
 * then stores a finish_to_image mapping in each product's metadata.
 *
 * Usage: node scripts/map-finish-images.js
 */

const express = require("express");
const loaders = require("@medusajs/medusa/dist/loaders").default;
const fs = require("fs");
const path = require("path");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");

async function main() {
  console.log("=== Map Finish Codes to Product Images ===\n");

  // Get all uploaded files
  const uploadFiles = fs.readdirSync(UPLOAD_DIR);
  console.log(`Found ${uploadFiles.length} uploaded files`);

  // Bootstrap Medusa
  const directory = process.cwd();
  const app = express();
  process.env.LOG_LEVEL = "error";

  const { container } = await loaders({ directory, expressApp: app, isTest: false });
  const manager = container.resolve("manager");

  // Get all neowheel products with their variants and finish option
  const products = await manager.query(`
    SELECT p.id, p.handle, p.title, p.metadata
    FROM product p
    WHERE p.handle LIKE 'neowheels-%'
    ORDER BY p.handle
  `);

  console.log(`Found ${products.length} products in database\n`);

  let updated = 0;
  let skipped = 0;

  for (const product of products) {
    // Get variants with their Finish option value
    const variants = await manager.query(`
      SELECT v.id, v.title, v.metadata,
             ov.value AS finish_value
      FROM product_variant v
      JOIN product_option_value ov ON ov.variant_id = v.id
      JOIN product_option o ON o.id = ov.option_id
      WHERE v.product_id = $1
        AND o.title = 'Finish'
      ORDER BY v.variant_rank
    `, [product.id]);

    if (variants.length === 0) {
      skipped++;
      continue;
    }

    // Build finish → image mapping
    const finishToImage = {};

    for (const variant of variants) {
      const finishCode = variant.finish_value;
      if (!finishCode) continue;

      // Import script names images as {handle}-{variantId.slice(-8)}.{ext}
      const variantSuffix = variant.id.slice(-8);

      // Search for matching file
      const matchingFile = uploadFiles.find(f =>
        f.startsWith(`${product.handle}-`) && f.includes(variantSuffix)
      );

      if (matchingFile && !finishToImage[finishCode]) {
        finishToImage[finishCode] = `/uploads/${matchingFile}`;
      }
    }

    if (Object.keys(finishToImage).length === 0) {
      skipped++;
      continue;
    }

    // Update product metadata
    let existingMeta = {};
    try {
      existingMeta = typeof product.metadata === 'string'
        ? JSON.parse(product.metadata)
        : (product.metadata || {});
    } catch { existingMeta = {}; }

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

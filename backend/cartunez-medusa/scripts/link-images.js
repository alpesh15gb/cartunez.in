/**
 * Link uploaded images to Medusa products
 * Matches filenames like neowheels-{design}-{suffix}.{ext} to products
 */

const express = require("express");
const loaders = require("@medusajs/medusa/dist/loaders").default;
const fs = require("fs");
const path = require("path");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");

async function main() {
  console.log("=== Link Images to Products ===\n");

  const directory = process.cwd();
  const app = express();
  process.env.LOG_LEVEL = "error";

  const { container } = await loaders({ directory, expressApp: app, isTest: false });

  const manager = container.resolve("manager");
  const productService = container.resolve("productService");
  const fileService = container.resolve("fileService");

  // Get all neowheel products
  const products = await manager.query(`
    SELECT id, handle, title, thumbnail
    FROM product
    WHERE handle LIKE 'neowheels-%'
    ORDER BY handle
  `);

  console.log(`Found ${products.length} alloy wheel products`);

  // Get all uploaded images
  const files = fs.readdirSync(UPLOAD_DIR).filter(f => f.startsWith("neowheels-"));
  console.log(`Found ${files.length} uploaded images\n`);

  let linkedCount = 0;
  let skippedCount = 0;
  let imageRowsInserted = 0;

  for (const product of products) {
    // Extract design slug from handle: "neowheels-hydra" -> "hydra"
    const designSlug = product.handle.replace("neowheels-", "");

    // Find matching images
    const matchingImages = files.filter(f => f.startsWith(`neowheels-${designSlug}-`));

    if (matchingImages.length === 0) {
      continue;
    }

    // Use first image as product thumbnail
    const thumbnailImage = matchingImages[0];

    // Update product with thumbnail if it doesn't have one
    if (!product.thumbnail) {
      try {
        const filePath = path.join(UPLOAD_DIR, thumbnailImage);

        // Read the file and create a proper upload object
        const fileBuffer = fs.readFileSync(filePath);
        const ext = path.extname(thumbnailImage).slice(1);
        const mimeType = ext === "jpg" ? "image/jpeg" : `image/${ext}`;

        // Upload via file service
        const uploadResult = await fileService.upload({
          path: filePath,
          originalname: thumbnailImage,
          mimetype: mimeType,
        });

        // Update product thumbnail
        const thumbnailUrl = uploadResult.url || `/uploads/${thumbnailImage}`;
        await manager.query(
          `UPDATE product SET thumbnail = $1 WHERE id = $2`,
          [thumbnailUrl, product.id]
        );

        linkedCount++;
        if (linkedCount % 10 === 0) {
          console.log(`  Linked ${linkedCount} products...`);
        }
      } catch (err) {
        console.error(`  Error linking ${product.handle}: ${err.message}`);
        skippedCount++;
      }
    } else {
      skippedCount++;
    }

    // Insert all matching images into product_image table (skip if already exists)
    const existingImages = await manager.query(
      "SELECT url FROM product_image WHERE product_id = $1",
      [product.id]
    );
    const existingUrls = new Set(existingImages.map(img => img.url));

    for (let idx = 0; idx < matchingImages.length; idx++) {
      const imgFile = matchingImages[idx];
      const imageUrl = `/uploads/${imgFile}`;

      if (existingUrls.has(imageUrl)) {
        continue;
      }

      try {
        await manager.query(
          "INSERT INTO product_image (id, product_id, url, rank, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())",
          [product.id, imageUrl, idx]
        );
        imageRowsInserted++;
      } catch (imgErr) {
        console.error(`  Error inserting image row for ${product.handle}: ${imgErr.message}`);
      }
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`Thumbnail linked: ${linkedCount}`);
  console.log(`Skipped (already had thumbnail): ${skippedCount}`);
  console.log(`Image rows inserted: ${imageRowsInserted}`);

  process.exit(0);
}

main().catch(err => {
  console.error("Failed:", err);
  process.exit(1);
});

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
        await manager.query(
          `UPDATE product SET thumbnail = $1 WHERE id = $2`,
          [uploadResult.url || `/uploads/${thumbnailImage}`, product.id]
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
  }

  console.log(`\n=== Done ===`);
  console.log(`Linked: ${linkedCount}`);
  console.log(`Skipped (already had thumbnail): ${skippedCount}`);

  process.exit(0);
}

main().catch(err => {
  console.error("Failed:", err);
  process.exit(1);
});

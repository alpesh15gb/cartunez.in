/**
 * NeoWheels Alloy Wheel Import Script
 *
 * Reads scraped data from neowheels-data.json and imports into Medusa.
 * Creates products, variants, categories, and vehicle compatibility links.
 *
 * Usage: node scripts/import-neowheels.js
 * Idempotent — safe to re-run (skips existing products by handle).
 */

const express = require("express");
const loaders = require("@medusajs/medusa/dist/loaders").default;
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const DATA_FILE = "/tmp/neowheels-data.json";
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
const CATEGORY_HANDLE = "alloy-wheels";
const CATEGORY_NAME = "Alloy Wheels";
const BRAND_NAME = "NeoWheels";

// Price in paise (Medusa uses smallest currency unit, INR has 2 decimals)
function rupeesToPaise(amount) {
  return Math.round(amount * 100);
}

async function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(destPath)) {
      return resolve(destPath); // already downloaded
    }

    const protocol = url.startsWith("https") ? https : http;
    const req = protocol.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Follow redirect
        return downloadImage(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const fileStream = fs.createWriteStream(destPath);
      res.pipe(fileStream);
      fileStream.on("finish", () => {
        fileStream.close();
        resolve(destPath);
      });
      fileStream.on("error", reject);
    });
    req.on("error", reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error(`Timeout downloading ${url}`));
    });
  });
}

async function main() {
  console.log("=== NeoWheels Import Script ===\n");

  // Load scraped data
  if (!fs.existsSync(DATA_FILE)) {
    console.error(`Data file not found: ${DATA_FILE}`);
    console.error("Run scraper first: node scripts/scrape-neowheels.js");
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  console.log(`Loaded ${data.totalDesigns} designs, ${data.totalVariants} variants\n`);

  // Ensure uploads directory
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  // Bootstrap Medusa container
  console.log("Bootstrapping Medusa...");
  process.env.LOG_LEVEL = "error";
  const directory = process.cwd();
  const app = express();
  const { container } = await loaders({ directory, expressApp: app, isTest: false });

  const manager = container.resolve("manager");
  const productService = container.resolve("productService");
  const productVariantService = container.resolve("productVariantService");
  const productCategoryService = container.resolve("productCategoryService");
  const regionService = container.resolve("regionService");
  const salesChannelService = container.resolve("salesChannelService");
  const shippingProfileService = container.resolve("shippingProfileService");

  // Get region, sales channel, shipping profile
  const regions = await regionService.list();
  let region = regions.find((r) => r.currency_code === "inr" || r.currency_code === "INR");
  if (!region) {
    console.error("No INR region found. Run seed-data.js first.");
    process.exit(1);
  }
  const regionId = region.id;

  const defaultSalesChannel = await salesChannelService.retrieveDefault();
  const salesChannelId = defaultSalesChannel.id;

  const defaultProfile = await shippingProfileService.retrieveDefault();
  const profileId = defaultProfile.id;

  console.log(`Region: ${region.name} (${regionId})`);

  // Create Alloy Wheels category
  let category;
  const existingCat = await manager.query(
    "SELECT * FROM product_category WHERE handle = $1",
    [CATEGORY_HANDLE]
  );
  if (existingCat.length > 0) {
    category = existingCat[0];
    console.log(`Category exists: ${CATEGORY_NAME}`);
  } else {
    category = await productCategoryService.create({
      name: CATEGORY_NAME,
      handle: CATEGORY_HANDLE,
      description: "Premium alloy wheels from NeoWheels - India's #1 alloy wheel brand. ARAI certified, lifetime structural warranty.",
      is_active: true,
      is_internal: false,
    });
    console.log(`Created category: ${CATEGORY_NAME}`);
  }

  // Fetch existing products to avoid duplicates
  const existingProducts = await productService.list({}, { select: ["id", "handle"] });
  const existingHandles = new Set(existingProducts.map((p) => p.handle));

  let createdCount = 0;
  let skippedCount = 0;
  let variantCount = 0;
  let imageCount = 0;
  let compatibilityCount = 0;

  // Process each design
  for (const [designSlug, design] of Object.entries(data.designs)) {
    const productHandle = `neowheels-${designSlug}`;

    if (existingHandles.has(productHandle)) {
      console.log(`  Skip (exists): ${design.name}`);
      skippedCount++;
      continue;
    }

    console.log(`\nCreating: ${design.name} (${design.variants.length} variants)`);

    // Determine all unique options across variants
    const sizes = [...new Set(design.variants.map((v) => v.size).filter(Boolean))];
    const pcds = [...new Set(design.variants.map((v) => v.pcd).filter(Boolean))];
    const finishes = [...new Set(design.variants.map((v) => v.finish).filter(Boolean))];

    // Build product options
    const options = [];
    if (sizes.length > 0) options.push({ title: "Size" });
    if (pcds.length > 0) options.push({ title: "PCD" });
    if (finishes.length > 0) options.push({ title: "Finish" });

    if (options.length === 0) {
      options.push({ title: "Variant" });
    }

    // Create product
    const product = await productService.create({
      title: `NeoWheels ${design.name} Alloy Wheel`,
      description: `NeoWheels ${design.name} - premium ARAI certified alloy wheel. Available in multiple sizes, PCD configurations, and finishes. Lifetime limited structural warranty.`,
      handle: productHandle,
      status: "published",
      sales_channels: [{ id: salesChannelId }],
      is_giftcard: false,
      discountable: false,
      options,
      profile_id: profileId,
      metadata: {
        brand: BRAND_NAME,
        design_name: design.name,
        source_url: `https://www.neowheels.com/product/${designSlug}`,
        country_of_origin: "India",
        gst_rate: 28,
        hsn_code: "8708",
      },
    });

    // Link to category
    await productService.update(product.id, {
      categories: [{ id: category.id }],
    });

    // Get option IDs
    const dbProduct = await productService.retrieve(product.id, { relations: ["options"] });
    const optionMap = {};
    for (const opt of dbProduct.options) {
      optionMap[opt.title] = opt.id;
    }

    // Collect all compatible car names for this design
    const allCompatibleCars = new Map(); // key: "MAKE|MODEL" -> car info

    // Create variants
    for (const v of design.variants) {
      // Every variant MUST have a value for every product option
      const optionValues = [];
      if (optionMap["Size"]) {
        optionValues.push({ option_id: optionMap["Size"], value: v.size || "Standard" });
      }
      if (optionMap["PCD"]) {
        optionValues.push({ option_id: optionMap["PCD"], value: v.pcd || "Universal" });
      }
      if (optionMap["Finish"]) {
        optionValues.push({ option_id: optionMap["Finish"], value: v.finish || "Standard" });
      }

      const variant = await productVariantService.create(product.id, {
        title: v.title || `${v.size} ${v.pcd} ${v.finish}`.trim(),
        prices: [
          {
            currency_code: "INR",
            amount: rupeesToPaise(v.salePrice || 0),
            region_id: regionId,
          },
        ],
        options: optionValues,
        inventory_quantity: 10,
        manage_inventory: false,
        metadata: {
          mrp: rupeesToPaise(v.mrp || v.salePrice || 0),
          sale_price: rupeesToPaise(v.salePrice || 0),
          offset: v.offset || null,
          bore_size: v.boreSize || null,
          source_url: v.url || null,
        },
      });

      // Download and set product thumbnail image
      if (v.imageUrl) {
        try {
          const ext = v.imageUrl.match(/\.(jpg|jpeg|png|webp)$/i)?.[1] || "jpg";
          const imgFilename = `${productHandle}-${variant.id.slice(-8)}.${ext}`;
          const imgPath = path.join(UPLOAD_DIR, imgFilename);

          await downloadImage(v.imageUrl, imgPath);

          // Update product thumbnail (use first variant's image)
          if (!product.thumbnail) {
            await productService.update(product.id, {
              thumbnail: `/uploads/${imgFilename}`,
            });
          }

          imageCount++;
        } catch (err) {
          console.error(`    Image error for ${v.title}: ${err.message}`);
        }
      }

      variantCount++;

      // Collect compatible cars
      if (v.compatibleCars && v.compatibleCars.length > 0) {
        for (const car of v.compatibleCars) {
          const key = `${car.make}|${car.model}`;
          if (!allCompatibleCars.has(key)) {
            allCompatibleCars.set(key, car);
          }
        }
      }
    }

    // Link vehicle compatibility
    if (allCompatibleCars.size > 0) {
      const vehicleModels = require("../dist/models/vehicle");
      const compatRepo = manager.getRepository(
        vehicleModels.ProductVehicleCompatibility
      );
      const vehicleVariantRepo = manager.getRepository(
        vehicleModels.VehicleVariant
      );
      const vehicleModelRepo = manager.getRepository(
        vehicleModels.VehicleModel
      );
      const vehicleMakeRepo = manager.getRepository(
        vehicleModels.VehicleMake
      );

      for (const [key, car] of allCompatibleCars) {
        try {
          // Find make
          const make = await vehicleMakeRepo.findOne({
            where: { name: car.make },
          });
          if (!make) {
            // Try case-insensitive
            const makes = await vehicleMakeRepo.find();
            const foundMake = makes.find(
              (m) => m.name.toLowerCase() === car.make.toLowerCase()
            );
            if (!foundMake) {
              console.log(`    Make not found: ${car.make} (skipping compatibility)`);
              continue;
            }
            car.makeId = foundMake.id;
          } else {
            car.makeId = make.id;
          }

          // Find model
          const model = await vehicleModelRepo.findOne({
            where: { name: car.model, make_id: car.makeId },
          });
          if (!model) {
            // Try partial match
            const models = await vehicleModelRepo.find({
              where: { make_id: car.makeId },
            });
            const foundModel = models.find(
              (m) =>
                m.name.toLowerCase() === car.model.toLowerCase() ||
                car.model.toLowerCase().includes(m.name.toLowerCase()) ||
                m.name.toLowerCase().includes(car.model.toLowerCase())
            );
            if (!foundModel) {
              console.log(`    Model not found: ${car.make} ${car.model}`);
              continue;
            }
            car.modelId = foundModel.id;
          } else {
            car.modelId = model.id;
          }

          // Get all vehicle variants for this model (any year)
          const vehicleYears = await manager.query(
            "SELECT id FROM vehicle_year WHERE model_id = $1",
            [car.modelId]
          );

          for (const yearRow of vehicleYears) {
            const variants = await vehicleVariantRepo.find({
              where: { year_id: yearRow.id },
            });
            for (const v of variants) {
              // Check if compatibility already exists
              const existing = await compatRepo.findOne({
                where: {
                  product_id: product.id,
                  vehicle_variant_id: v.id,
                },
              });
              if (!existing) {
                const entry = compatRepo.create({
                  product_id: product.id,
                  vehicle_variant_id: v.id,
                  fitment_type: "exact",
                  notes: `Compatible via PCD ${design.variants[0]?.pcd || "universal"}`,
                });
                await compatRepo.save(entry);
                compatibilityCount++;
              }
            }
          }
        } catch (err) {
          console.error(`    Compatibility error for ${key}: ${err.message}`);
        }
      }
    }

    createdCount++;
    console.log(`  Created: ${product.title}`);
  }

  console.log(`\n=== Import Complete ===`);
  console.log(`Products created: ${createdCount}`);
  console.log(`Products skipped (existing): ${skippedCount}`);
  console.log(`Variants created: ${variantCount}`);
  console.log(`Images downloaded: ${imageCount}`);
  console.log(`Compatibility links: ${compatibilityCount}`);
  console.log(`\nRun MeiliSearch reindex: node reindex-search.js`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});

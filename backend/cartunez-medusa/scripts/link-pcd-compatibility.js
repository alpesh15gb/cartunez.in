/**
 * Link alloy wheel products to compatible car models by PCD pattern.
 *
 * Reads each alloy wheel's PCD option values, matches them to car models
 * using a known PCD mapping for Indian cars, then populates the
 * product_vehicle_compatibility table.
 *
 * Usage: node scripts/link-pcd-compatibility.js
 */

const express = require("express");
const loaders = require("@medusajs/medusa/dist/loaders").default;

// PCD patterns for popular Indian car models (lowercase for matching)
// Each car model may have different PCDs across generations
const CAR_PCD_MAP = {
  // Maruti Suzuki
  "swift": ["4x100"],
  "baleno": ["4x100"],
  "wagon r": ["4x100"],
  "brezza": ["4x100"],
  "ertiga": ["4x100"],
  "grand vitara": ["5x114.3"],
  "fronx": ["4x100"],
  "dzire": ["4x100"],
  "alto": ["4x100"],
  "s-presso": ["4x100"],
  "celerio": ["4x100"],
  "ignis": ["4x100"],
  "xl6": ["4x100"],
  "ciaz": ["4x100"],
  "jimny": ["4x100"],
  // Hyundai
  "creta": ["5x114.3"],
  "i20": ["4x100"],
  "venue": ["4x100"],
  "verna": ["4x100"],
  "tucson": ["5x114.3"],
  "alcazar": ["5x114.3"],
  "exter": ["4x100"],
  "aura": ["4x100"],
  "grand i10 nios": ["4x100"],
  "i10": ["4x100"],
  // Tata
  "nexon": ["4x100"],
  "punch": ["4x100"],
  "harrier": ["5x114.3"],
  "safari": ["5x114.3"],
  "altroz": ["4x100"],
  "tiago": ["4x100"],
  "tigor": ["4x100"],
  // Mahindra
  "thar": ["5x150"],
  "xuv700": ["5x114.3"],
  "scorpio-n": ["5x114.3"],
  "xuv400": ["4x100"],
  "bolero": ["4x100"],
  "xuv300": ["4x100"],
  "scorpio": ["5x150"],
  // Kia
  "seltos": ["5x114.3"],
  "sonet": ["4x100"],
  "carens": ["4x100"],
  "ev6": ["5x114.3"],
  // Toyota
  "innova crysta": ["5x114.3"],
  "innova hycross": ["5x114.3"],
  "fortuner": ["6x139.7"],
  "glanza": ["4x100"],
  "urban cruiser hyryder": ["5x114.3"],
  "camry": ["5x114.3"],
  // Honda
  "city": ["4x100"],
  "amaze": ["4x100"],
  "elevate": ["4x100"],
  "wr-v": ["4x100"],
  // MG
  "hector": ["5x114.3"],
  "astor": ["5x114.3"],
  "gloster": ["6x139.7"],
  "zs ev": ["5x114.3"],
  // Volkswagen
  "taigun": ["5x114.3"],
  "virtus": ["5x114.3"],
  "tiguan": ["5x114.3"],
  // Skoda
  "kushaq": ["5x114.3"],
  "slavia": ["5x114.3"],
  "kodiaq": ["5x114.3"],
  "karoq": ["5x114.3"],
  // Renault
  "kiger": ["4x100"],
  "triber": ["4x100"],
  // Nissan
  "magnite": ["4x100"],
  "kicks": ["4x100"],
  // Citroen
  "c3 aircross": ["4x100"],
  "c3": ["4x100"],
  "c3 aircross": ["4x100"],
};

async function main() {
  console.log("=== Link PCD Compatibility ===\n");

  const directory = process.cwd();
  const app = express();
  process.env.LOG_LEVEL = "error";

  const { container } = await loaders({ directory, expressApp: app, isTest: false });
  const manager = container.resolve("manager");

  // 1. Get all alloy wheel products with their PCD option values
  const wheelProducts = await manager.query(`
    SELECT p.id, p.handle, p.title,
           pov.value AS pcd_value
    FROM product p
    JOIN product_option po ON po.product_id = p.id AND po.title = 'PCD'
    JOIN product_option_value pov ON pov.option_id = po.id
    JOIN product_variant pv ON pv.id = pov.variant_id
    WHERE p.handle LIKE 'neowheels-%'
    GROUP BY p.id, p.handle, p.title, pov.value
    ORDER BY p.handle
  `);

  console.log(`Found ${wheelProducts.length} wheel+PCD combinations`);

  // 2. Get all vehicle variants with their model name (from FastAPI tables)
  // We query Medusa's vehicle tables which have the hierarchy
  const vehicleVariants = await manager.query(`
    SELECT vv.id AS variant_id, vv.name AS variant_name,
           vm.name AS model_name,
           vmk.name AS make_name
    FROM vehicle_variant vv
    JOIN vehicle_year vy ON vy.id = vv.year_id
    JOIN vehicle_model vm ON vm.id = vy.model_id
    JOIN vehicle_make vmk ON vmk.id = vm.make_id
    ORDER BY vmk.name, vm.name, vy.year
  `);

  console.log(`Found ${vehicleVariants.length} vehicle variants in Medusa\n`);

  // If Medusa vehicle tables are empty, try FastAPI tables
  let variants = vehicleVariants;
  let useFastAPI = false;

  if (variants.length === 0) {
    console.log("Medusa vehicle tables empty, trying FastAPI tables...\n");
    variants = await manager.query(`
      SELECT vv.id AS variant_id, vv.name AS variant_name,
             vm.name AS model_name,
             vmk.name AS make_name
      FROM vehicle_variants vv
      JOIN vehicle_years vy ON vy.id = vv.vehicle_year_id
      JOIN vehicle_models vm ON vm.id = vy.model_id
      JOIN vehicle_makes vmk ON vmk.id = vm.make_id
      ORDER BY vmk.name, vm.name, vy.year
    `);
    useFastAPI = true;
    console.log(`Found ${variants.length} vehicle variants in FastAPI tables\n`);
  }

  if (variants.length === 0) {
    console.log("No vehicle variants found in either table. Run vehicle seed first.");
    process.exit(1);
  }

  // 3. Build PCD → vehicle variants mapping
  const pcdToVehicles = {};
  for (const v of variants) {
    const modelLower = v.model_name.toLowerCase().trim();
    const pcds = CAR_PCD_MAP[modelLower];
    if (!pcds) continue;

    for (const pcd of pcds) {
      if (!pcdToVehicles[pcd]) pcdToVehicles[pcd] = [];
      // Avoid duplicates
      if (!pcdToVehicles[pcd].some(x => x.variant_id === v.variant_id)) {
        pcdToVehicles[pcd].push(v);
      }
    }
  }

  const matchedPCDs = Object.keys(pcdToVehicles);
  console.log(`PCD patterns in vehicle DB: ${matchedPCDs.join(", ")}\n`);

  // 4. Link products to compatible vehicle variants
  let linksCreated = 0;
  let productsLinked = 0;

  for (const wheel of wheelProducts) {
    const pcdValue = wheel.pcd_value; // e.g., "5x114.3"
    const compatibleVehicles = pcdToVehicles[pcdValue] || [];

    if (compatibleVehicles.length === 0) continue;

    // Find which product variant has this PCD
    const variantRows = await manager.query(`
      SELECT pv.id AS variant_id
      FROM product_variant pv
      JOIN product_option_value pov ON pov.variant_id = pv.id
      JOIN product_option po ON po.id = pov.option_id
      WHERE pv.product_id = $1 AND po.title = 'PCD' AND pov.value = $2
      LIMIT 1
    `, [wheel.id, pcdValue]);

    if (variantRows.length === 0) continue;

    const wheelVariantId = variantRows[0].variant_id;

    for (const vehicle of compatibleVehicles) {
      // Check if link already exists
      const existing = await manager.query(`
        SELECT id FROM product_vehicle_compatibility
        WHERE product_id = $1 AND vehicle_variant_id = $2
      `, [wheel.id, vehicle.variant_id]);

      if (existing.length > 0) continue;

      await manager.query(`
        INSERT INTO product_vehicle_compatibility (id, product_id, vehicle_variant_id, fitment_type, created_at)
        VALUES (gen_random_uuid(), $1, $2, 'exact', NOW())
      `, [wheel.id, vehicle.variant_id]);

      linksCreated++;
    }

    productsLinked++;
  }

  console.log(`\n=== Done ===`);
  console.log(`Products linked: ${productsLinked}`);
  console.log(`Compatibility links created: ${linksCreated}`);

  process.exit(0);
}

main().catch(err => {
  console.error("Failed:", err);
  process.exit(1);
});

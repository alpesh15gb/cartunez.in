/**
 * Sync vehicle data from FastAPI tables to Medusa tables.
 *
 * FastAPI stores vehicles in plural-named tables (vehicle_makes, etc.)
 * Medusa stores them in singular-named tables (vehicle_make, etc.)
 * This script copies data so the compatibility feature works.
 *
 * Usage: node scripts/sync-vehicles.js
 */

const express = require("express");
const loaders = require("@medusajs/medusa/dist/loaders").default;

async function main() {
  console.log("=== Sync Vehicles: FastAPI → Medusa ===\n");

  const directory = process.cwd();
  const app = express();
  process.env.LOG_LEVEL = "error";

  const { container } = await loaders({ directory, expressApp: app, isTest: false });
  const manager = container.resolve("manager");

  // Check if Medusa tables already have data
  const existingMakes = await manager.query(`SELECT COUNT(*) AS cnt FROM vehicle_make`);
  if (parseInt(existingMakes[0].cnt) > 0) {
    console.log(`Medusa vehicle_make already has ${existingMakes[0].cnt} rows. Skipping sync.`);
    process.exit(0);
  }

  // 1. Sync Makes
  const fastMakes = await manager.query(`SELECT * FROM vehicle_makes ORDER BY name`);
  console.log(`Copying ${fastMakes.length} makes...`);

  const makeIdMap = {}; // FastAPI UUID → Medusa UUID

  for (const m of fastMakes) {
    const newId = await manager.query(`SELECT gen_random_uuid() AS id`);
    const medusaId = newId[0].id;
    makeIdMap[m.id] = medusaId;

    await manager.query(`
      INSERT INTO vehicle_make (id, name, country, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, true, NOW(), NOW())
    `, [medusaId, m.name, m.country || '']);
  }

  // 2. Sync Models
  const fastModels = await manager.query(`SELECT * FROM vehicle_models ORDER BY name`);
  console.log(`Copying ${fastModels.length} models...`);

  const modelIdMap = {};

  for (const m of fastModels) {
    const newId = await manager.query(`SELECT gen_random_uuid() AS id`);
    const medusaId = newId[0].id;
    modelIdMap[m.id] = medusaId;
    const medusaMakeId = makeIdMap[m.make_id];

    if (!medusaMakeId) continue;

    await manager.query(`
      INSERT INTO vehicle_model (id, name, make_id, body_type, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, true, NOW(), NOW())
    `, [medusaId, m.name, medusaMakeId, m.body_type || '']);
  }

  // 3. Sync Years
  const fastYears = await manager.query(`SELECT * FROM vehicle_years ORDER BY year DESC`);
  console.log(`Copying ${fastYears.length} years...`);

  const yearIdMap = {};

  for (const y of fastYears) {
    const newId = await manager.query(`SELECT gen_random_uuid() AS id`);
    const medusaId = newId[0].id;
    yearIdMap[y.id] = medusaId;
    const medusaModelId = modelIdMap[y.model_id];

    if (!medusaModelId) continue;

    await manager.query(`
      INSERT INTO vehicle_year (id, year, model_id, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, true, NOW(), NOW())
    `, [medusaId, y.year, medusaModelId]);
  }

  // 4. Sync Variants
  const fastVariants = await manager.query(`SELECT * FROM vehicle_variants ORDER BY name`);
  console.log(`Copying ${fastVariants.length} variants...`);

  let variantCount = 0;

  for (const v of fastVariants) {
    const newId = await manager.query(`SELECT gen_random_uuid() AS id`);
    const medusaId = newId[0].id;
    const medusaYearId = yearIdMap[v.vehicle_year_id];

    if (!medusaYearId) continue;

    await manager.query(`
      INSERT INTO vehicle_variant (id, name, year_id, engine_type, fuel_type, transmission, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
    `, [medusaId, v.name, medusaYearId, v.engine || '', v.fuel_type || '', v.transmission || '']);

    variantCount++;
  }

  console.log(`\n=== Done ===`);
  console.log(`Makes: ${fastMakes.length}`);
  console.log(`Models: ${fastModels.length}`);
  console.log(`Years: ${fastYears.length}`);
  console.log(`Variants: ${variantCount}`);

  process.exit(0);
}

main().catch(err => {
  console.error("Failed:", err);
  process.exit(1);
});

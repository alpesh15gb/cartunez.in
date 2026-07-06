/**
 * Strips "sahibacar-{id}-" prefix from product handles to get clean URLs.
 * Example: sahibacar-9066077126910-toyota-fortuner-2016-onwards-ambient-light
 *       -> toyota-fortuner-2016-onwards-ambient-light
 *
 * Usage: node scripts/cleanup-handles.js
 * Safe to run multiple times (idempotent).
 */
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const client = await pool.connect();
  try {
    // 1. Find all sahibacar- prefixed handles
    const { rows: products } = await client.query(
      "SELECT id, handle, title FROM product WHERE handle LIKE 'sahibacar-%'"
    );

    console.log(`Found ${products.length} products with sahibacar- prefix\n`);

    if (products.length === 0) {
      console.log("Nothing to clean up!");
      return;
    }

    let updated = 0;
    let skipped = 0;

    for (const p of products) {
      // Strip "sahibacar-{numeric_id}-" prefix
      const clean = p.handle.replace(/^sahibacar-\d+-/, "");

      if (!clean || clean === p.handle) {
        console.log(`  SKIP (no clean form): ${p.handle}`);
        skipped++;
        continue;
      }

      // Check for collision
      const { rows: existing } = await client.query(
        "SELECT id FROM product WHERE handle = $1 AND id != $2",
        [clean, p.id]
      );

      if (existing.length > 0) {
        console.log(`  SKIP (collision): ${p.handle} -> ${clean} (taken by ${existing[0].id})`);
        skipped++;
        continue;
      }

      await client.query("UPDATE product SET handle = $1 WHERE id = $2", [clean, p.id]);
      console.log(`  ${p.handle} -> ${clean}`);
      updated++;
    }

    console.log(`\nDone: ${updated} updated, ${skipped} skipped`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

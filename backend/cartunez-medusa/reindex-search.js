#!/usr/bin/env node
/**
 * Manual MeiliSearch reindex script.
 * Usage: node reindex-search.js
 *
 * Reads published products directly from the database (bypassing the store
 * API, which filters by sales channel / publishable key) and pushes them to
 * MeiliSearch. Run after a bulk import or when changing index settings.
 */

var express = require("express");
var loaders = require("@medusajs/medusa/dist/loaders").default;

const MEILI_HOST = process.env.MEILISEARCH_HOST || "http://localhost:7700";
const MEILI_KEY = process.env.MEILISEARCH_API_KEY || "";

async function reindex() {
  console.log("Loading Medusa...");
  var directory = process.cwd();
  var app = express();
  process.env.LOG_LEVEL = "error";
  var container = (await loaders({ directory: directory, expressApp: app, isTest: false })).container;
  var manager = container.resolve("manager");

  console.log("Fetching products from database...");
  var rows = await manager.query(
    `SELECT p.id, p.title, p.description, p.handle, p.thumbnail,
            COALESCE(array_agg(DISTINCT pc.name) FILTER (WHERE pc.name IS NOT NULL), '{}') AS categories
     FROM product p
     LEFT JOIN product_category_product pcp ON pcp.product_id = p.id
     LEFT JOIN product_category pc ON pc.id = pcp.product_category_id
     WHERE p.status = 'published'
     GROUP BY p.id
     ORDER BY p.created_at`
  );

  var documents = rows.map(function (r) {
    return {
      id: r.id,
      title: r.title || "",
      description: r.description || "",
      handle: r.handle,
      thumbnail: r.thumbnail || "",
      categories: Array.isArray(r.categories) ? r.categories.join(", ") : "",
    };
  });
  console.log(`Found ${documents.length} products.`);

  console.log("Indexing to MeiliSearch...");
  var headers = { "Content-Type": "application/json" };
  if (MEILI_KEY) headers["Authorization"] = "Bearer " + MEILI_KEY;

  var indexRes = await fetch(`${MEILI_HOST}/indexes/products/documents`, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(documents),
  });

  if (!indexRes.ok) {
    var err = await indexRes.text();
    console.error("Index failed:", indexRes.status, err);
    process.exit(1);
  }

  var result = await indexRes.json();
  console.log(`Indexed ${documents.length} documents. Task ID: ${result.taskUid}`);
  console.log("Reindex complete.");
}

reindex().catch(function (err) {
  console.error("Reindex error:", err);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Manual MeiliSearch reindex script.
 * Usage: node reindex-search.js
 *
 * Reads all products from the Medusa API and pushes them to MeiliSearch.
 * Run after initial seed or when changing index settings.
 */

const MEILI_HOST = process.env.MEILISEARCH_HOST || "http://localhost:7700";
const MEILI_KEY = process.env.MEILISEARCH_API_KEY || "";
const MEDUSA_HOST = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000";

async function reindex() {
  console.log("Fetching products from Medusa...");
  const res = await fetch(`${MEDUSA_HOST}/store/products?limit=100&expand=categories`);
  const { products } = await res.json();
  console.log(`Found ${products.length} products.`);

  // Transform products for MeiliSearch index
  const documents = products.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description || "",
    handle: p.handle,
    thumbnail: p.thumbnail || "",
    categories: (p.categories || []).map((c) => c.name).join(", "),
  }));

  console.log("Indexing to MeiliSearch...");
  const headers = { "Content-Type": "application/json" };
  if (MEILI_KEY) headers["Authorization"] = `Bearer ${MEILI_KEY}`;

  const indexRes = await fetch(`${MEILI_HOST}/indexes/products/documents`, {
    method: "POST",
    headers,
    body: JSON.stringify(documents),
  });

  if (!indexRes.ok) {
    const err = await indexRes.text();
    console.error("Index failed:", indexRes.status, err);
    process.exit(1);
  }

  const result = await indexRes.json();
  console.log(`Indexed ${documents.length} documents. Task ID: ${result.taskUid}`);
  console.log("Reindex complete.");
}

reindex().catch((err) => {
  console.error("Reindex error:", err);
  process.exit(1);
});

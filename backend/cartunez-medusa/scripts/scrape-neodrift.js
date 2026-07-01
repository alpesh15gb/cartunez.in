/**
 * Neodrift.in Product Scraper
 *
 * Scrapes all products from neodrift.in using Shopify's /products.json API.
 * Downloads images and saves data to neodrift-data.json for import.
 *
 * Usage: node scripts/scrape-neodrift.js
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

const BASE_URL = "https://www.neodrift.in";
const OUTPUT_FILE = "/tmp/neodrift-data.json";
const IMAGES_DIR = path.join(__dirname, "..", "uploads", "neodrift");
const PAGE_SIZE = 250;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchJSON(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; CartunezBot/1.0)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function downloadImage(url, destPath) {
  if (fs.existsSync(destPath)) return;
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        fs.unlinkSync(destPath);
        return downloadImage(res.headers.location, destPath).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on("finish", () => { file.close(); resolve(); });
      file.on("error", (err) => { fs.unlinkSync(destPath); reject(err); });
    }).on("error", reject);
  });
}

function stripHTML(html) {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
}

function extractTags(product) {
  const tags = new Set();
  if (product.product_type) tags.add(product.product_type);
  if (product.vendor) tags.add(product.vendor);
  if (Array.isArray(product.tags)) {
    product.tags.forEach(t => { if (t) tags.add(t.trim()); });
  } else if (product.tags) {
    product.tags.split(",").forEach(t => { const trimmed = t.trim(); if (trimmed) tags.add(trimmed); });
  }
  return [...tags];
}

function mapCategory(product) {
  const type = (product.product_type || "").toLowerCase();
  const tagsRaw = Array.isArray(product.tags) ? product.tags.join(",") : (product.tags || "");
  const tags = tagsRaw.toLowerCase();
  const title = (product.title || "").toLowerCase();

  if (type.includes("5d mat") || tags.includes("5d car mats") || title.includes("5d floor mat")) return "5D Floor Mats";
  if (type.includes("7d mat") || tags.includes("7d car mats") || title.includes("7d floor mat")) return "7D Floor Mats";
  if (type.includes("car cover") || tags.includes("car covers") || title.includes("car cover")) return "Car Covers";
  if (type.includes("bike cover") || tags.includes("bike covers") || title.includes("bike cover")) return "Bike Covers";
  if (type.includes("seat cover") || tags.includes("seat covers") || title.includes("seat cover")) return "Seat Covers";
  if (type.includes("back cushion") || tags.includes("back cushion") || title.includes("lumbar")) return "Back Cushions";
  if (type.includes("microfiber") || tags.includes("microfiber")) return "Microfiber Cloth";
  if (type.includes("bike accessory") || tags.includes("bike accessories")) return "Bike Accessories";
  if (type.includes("car accessory") || tags.includes("car accessories")) return "Car Accessories";
  if (type.includes("floor mat") || tags.includes("floor mats") || title.includes("floor mat")) return "Floor Mats";
  if (type.includes("body cover") || tags.includes("body cover")) return "Body Covers";

  return "Car Accessories";
}

function rupeesToPaise(priceStr) {
  const num = parseFloat(priceStr);
  if (isNaN(num) || num <= 0) return 0;
  return Math.round(num * 100);
}

async function main() {
  console.log("=== Neodrift.in Scraper ===\n");

  // Scrape products
  console.log("Scraping products...");
  const allProducts = [];
  let page = 1;

  while (true) {
    const data = await fetchJSON(`${BASE_URL}/products.json?limit=${PAGE_SIZE}&page=${page}`);
    if (!data.products || data.products.length === 0) break;
    allProducts.push(...data.products);
    console.log(`  Page ${page}: ${data.products.length} products (total: ${allProducts.length})`);
    if (data.products.length < PAGE_SIZE) break;
    page++;
    await sleep(500);
  }

  console.log(`  Total products: ${allProducts.length}\n`);

  // Download images
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }

  console.log("Downloading images...");
  let downloaded = 0;
  let failed = 0;

  const products = allProducts.map(p => {
    const handle = `neodrift-${p.id}-${p.handle}`;
    const images = (p.images || []).map((img, idx) => {
      const ext = (img.src.match(/\.(jpg|jpeg|png|webp|gif)/i) || [".jpg"])[0];
      const filename = `${handle}-${idx + 1}${ext}`;
      return {
        url: img.src,
        localPath: path.join(IMAGES_DIR, filename),
        servePath: `/uploads/neodrift/${filename}`,
        filename,
      };
    });

    const variant = p.variants && p.variants[0];
    const price = rupeesToPaise(variant ? variant.price : "0");
    const comparePrice = rupeesToPaise(variant ? variant.compare_at_price : "0");

    const options = (p.options || [])
      .filter(o => o.name !== "Title" || (o.values && o.values.length > 1))
      .map(o => ({ name: o.name, values: o.values || [] }));

    return {
      sourceId: p.id,
      title: p.title,
      handle,
      description: stripHTML(p.body_html).substring(0, 2000),
      vendor: p.vendor,
      category: mapCategory(p),
      tags: extractTags(p),
      price,
      compareAtPrice: comparePrice,
      sku: variant ? variant.sku : null,
      available: variant ? variant.available : true,
      images,
      options,
      sourceUrl: `${BASE_URL}/products/${p.handle}`,
    };
  });

  for (const product of products) {
    for (const img of product.images.slice(0, 3)) {
      try {
        await downloadImage(img.url, img.localPath);
        downloaded++;
      } catch (err) {
        failed++;
      }
    }
  }

  const output = {
    scrapedAt: new Date().toISOString(),
    totalProducts: products.length,
    products,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`\nSaved to ${OUTPUT_FILE}`);
  console.log(`Products: ${products.length}`);
  console.log(`Images downloaded: ${downloaded}`);
  console.log(`Images failed: ${failed}`);
}

main().catch(err => {
  console.error("Failed:", err);
  process.exit(1);
});

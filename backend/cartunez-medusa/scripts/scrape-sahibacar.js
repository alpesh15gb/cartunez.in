/**
 * SahibaCar.in Product Scraper
 *
 * Scrapes all products from sahibacar.in using Shopify's /products.json API.
 * Downloads images and saves data to sahibacar-data.json for import.
 *
 * Usage: node scripts/scrape-sahibacar.js
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

const BASE_URL = "https://www.sahibacar.in";
const OUTPUT_FILE = "/tmp/sahibacar-data.json";
const IMAGES_DIR = path.join(__dirname, "..", "uploads", "sahibacar");
const PAGE_SIZE = 250; // Shopify max

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

async function scrapeCollections() {
  console.log("Scraping collections...");
  const data = await fetchJSON(`${BASE_URL}/collections.json?limit=250`);
  const collections = data.collections
    .filter(c => c.handle !== "frontpage" && c.products_count > 0)
    .map(c => ({
      id: c.id,
      title: c.title,
      handle: c.handle,
      products_count: c.products_count,
    }));
  console.log(`  Found ${collections.length} collections\n`);
  return collections;
}

async function scrapeProducts() {
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
  return allProducts;
}

function stripHTML(html) {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTags(product) {
  const tags = new Set();
  if (product.product_type) tags.add(product.product_type);
  if (product.vendor) tags.add(product.vendor);
  if (Array.isArray(product.tags)) {
    for (const tag of product.tags) {
      if (tag) tags.add(tag.trim());
    }
  } else if (product.tags) {
    for (const tag of product.tags.split(",")) {
      const t = tag.trim();
      if (t) tags.add(t);
    }
  }
  return [...tags];
}

function mapCategory(product) {
  const type = (product.product_type || "").toLowerCase();
  const tagsRaw = Array.isArray(product.tags) ? product.tags.join(",") : (product.tags || "");
  const tags = tagsRaw.toLowerCase();

  if (type.includes("speaker") || tags.includes("car speakers") || tags.includes("speakers")) return "Car Speakers";
  if (type.includes("stereo") || tags.includes("car stereos") || tags.includes("android frame")) return "Android Stereos";
  if (type.includes("amplifier") || tags.includes("car amplifiers")) return "Car Amplifiers";
  if (type.includes("subwoofer") || tags.includes("car subwoofer")) return "Car Subwoofers";
  if (type.includes("camera") || tags.includes("reverse camera") || tags.includes("car cameras")) return "Reverse Cameras";
  if (type.includes("dashcam") || tags.includes("car dashcams")) return "Dash Cameras";
  if (type.includes("light") || tags.includes("car led lights") || tags.includes("car exterior lighting")) return "LED Lights";
  if (type.includes("android") || tags.includes("android frames")) return "Android Frames";
  if (type.includes("oem") || tags.includes("car oem parts")) return "OEM Parts";
  if (type.includes("grill") || tags.includes("car grills")) return "Car Grills";
  if (type.includes("spoiler") || tags.includes("car spoilers")) return "Car Spoilers";
  if (type.includes("perfume") || tags.includes("car perfumes")) return "Car Perfumes";
  if (type.includes("damping") || tags.includes("car damping")) return "Sound Damping";
  if (type.includes("ambient") || tags.includes("car ambient lighting")) return "Ambient Lighting";
  if (type.includes("activator")) return "Activators";
  if (type.includes("headlight") || tags.includes("car headlights")) return "Headlights";
  if (type.includes("tail") || tags.includes("car tail lights")) return "Tail Lights";
  if (type.includes("accessories") || tags.includes("accessories for car speakers")) return "Speaker Accessories";
  if (type.includes("harness") || tags.includes("wiring harness")) return "Wiring Harnesses";

  return "Car Accessories";
}

function rupeesToPaise(priceStr) {
  const num = parseFloat(priceStr);
  if (isNaN(num) || num <= 0) return 0;
  return Math.round(num * 100);
}

async function main() {
  console.log("=== SahibaCar.in Scraper ===\n");

  const collections = await scrapeCollections();
  const rawProducts = await scrapeProducts();

  // Download images
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }

  let downloaded = 0;
  let skipped = 0;

  const products = rawProducts.map(p => {
    const handle = `sahibacar-${p.id}-${p.handle}`;
    const images = (p.images || []).map((img, idx) => {
      const ext = (img.src.match(/\.(jpg|jpeg|png|webp|gif)/i) || [".jpg"])[0];
      const filename = `${handle}-${idx + 1}${ext}`;
      const localPath = path.join(IMAGES_DIR, filename);

      // Queue download (will be done separately)
      return {
        url: img.src,
        localPath: path.join(IMAGES_DIR, filename),
        servePath: `/uploads/sahibacar/${filename}`,
        filename,
      };
    });

    const variant = p.variants?.[0];
    const price = rupeesToPaise(variant?.price || "0");
    const comparePrice = rupeesToPaise(variant?.compare_at_price || "0");

    const options = (p.options || [])
      .filter(o => o.name !== "Title" || o.values.length > 1)
      .map(o => ({
        name: o.name,
        values: o.values,
      }));

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
      sku: variant?.sku || null,
      available: variant?.available ?? true,
      images,
      options,
      sourceUrl: `${BASE_URL}/products/${p.handle}`,
      sourceImageUrls: (p.images || []).map(i => i.src),
    };
  });

  // Download images in batches
  console.log("Downloading images...");
  for (const product of products) {
    for (const img of product.images.slice(0, 3)) { // Max 3 images per product
      try {
        await downloadImage(img.url, img.localPath);
        downloaded++;
      } catch (err) {
        console.error(`  Failed: ${img.filename}: ${err.message}`);
        skipped++;
      }
    }
  }

  // Save data
  const output = {
    scrapedAt: new Date().toISOString(),
    totalProducts: products.length,
    collections,
    products,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`\nSaved to ${OUTPUT_FILE}`);
  console.log(`Products: ${products.length}`);
  console.log(`Images downloaded: ${downloaded}`);
  console.log(`Images failed: ${skipped}`);
}

main().catch(err => {
  console.error("Failed:", err);
  process.exit(1);
});

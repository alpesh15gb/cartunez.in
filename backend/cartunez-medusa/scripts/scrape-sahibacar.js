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

async function scrapeCollectionProducts(collections) {
  console.log("Scraping products per collection...");
  const productCollections = {}; // productId -> [collection handles]

  for (const col of collections) {
    let page = 1;
    while (true) {
      try {
        const data = await fetchJSON(`${BASE_URL}/collections/${col.handle}/products.json?limit=${PAGE_SIZE}&page=${page}`);
        if (!data.products || data.products.length === 0) break;

        for (const p of data.products) {
          if (!productCollections[p.id]) productCollections[p.id] = [];
          if (!productCollections[p.id].includes(col.handle)) {
            productCollections[p.id].push(col.handle);
          }
        }

        if (data.products.length < PAGE_SIZE) break;
        page++;
        await sleep(300);
      } catch (err) {
        console.error(`  Error scraping collection ${col.handle}: ${err.message}`);
        break;
      }
    }
  }

  console.log(`  Mapped ${Object.keys(productCollections).length} products to collections\n`);
  return productCollections;
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

function mapCategory(product, collectionHandles = []) {
  const type = (product.product_type || "").toLowerCase();
  const tagsRaw = Array.isArray(product.tags) ? product.tags.join(",") : (product.tags || "");
  const tags = tagsRaw.toLowerCase();
  const title = (product.title || "").toLowerCase();
  const collectionStr = collectionHandles.join(",").toLowerCase();

  // Audio categories
  if (type.includes("speaker") || tags.includes("car speakers") || tags.includes("speakers") || title.includes("speaker")) return "Car Speakers";
  if (type.includes("stereo") || tags.includes("car stereos") || tags.includes("android frame") || title.includes("stereo") || title.includes("android player")) return "Android Stereos";
  if (type.includes("amplifier") || tags.includes("car amplifiers") || tags.includes("amplifier") || title.includes("amplifier") || title.includes("amp ")) return "Car Amplifiers";
  if (type.includes("subwoofer") || tags.includes("car subwoofer") || tags.includes("subwoofer") || title.includes("subwoofer") || title.includes("subwoofer") || title.includes(" sub ")) return "Car Subwoofers";
  if (type.includes("damping") || tags.includes("car damping") || tags.includes("damping") || title.includes("damping") || title.includes("sound deadening")) return "Sound Damping";
  if (type.includes("accessories") || tags.includes("accessories for car speakers") || tags.includes("speaker accessories") || collectionStr.includes("speaker-accessories")) return "Speaker Accessories";

  // Camera categories
  if (type.includes("dashcam") || tags.includes("car dashcams") || tags.includes("dashcam") || tags.includes("dash cam") || title.includes("dashcam") || title.includes("dash cam")) return "Dash Cameras";
  if (type.includes("camera") || tags.includes("reverse camera") || tags.includes("car cameras") || tags.includes("camera") || title.includes("camera") || title.includes("reversing camera")) return "Reverse Cameras";

  // Lighting categories
  if (type.includes("ambient") || tags.includes("car ambient lighting") || tags.includes("ambient light") || title.includes("ambient light")) return "Ambient Lighting";
  if (type.includes("headlight") || tags.includes("car headlights") || tags.includes("headlight") || title.includes("headlight") || title.includes("head lamp")) return "Headlights";
  if (type.includes("tail") || tags.includes("car tail lights") || tags.includes("tail light") || title.includes("tail light") || title.includes("taillight")) return "Tail Lights";
  if (type.includes("light") || tags.includes("car led lights") || tags.includes("car exterior lighting") || tags.includes("led light") || title.includes("led light") || title.includes("fog light") || title.includes("indicator")) return "LED Lights";

  // Exterior accessories
  if (type.includes("grill") || tags.includes("car grills") || tags.includes("grill") || title.includes("grill") || title.includes("grille")) return "Car Grills";
  if (type.includes("spoiler") || tags.includes("car spoilers") || tags.includes("spoiler") || title.includes("spoiler")) return "Car Spoilers";
  if (type.includes("body kit") || tags.includes("body kit") || title.includes("body kit") || title.includes("bumper")) return "Body Kits";

  // Interior accessories
  if (type.includes("perfume") || tags.includes("car perfumes") || tags.includes("perfume") || title.includes("perfume") || title.includes("air freshener")) return "Car Perfumes";
  if (type.includes("floor mat") || tags.includes("floor mat") || title.includes("floor mat") || title.includes("mats")) return "Floor Mats";
  if (type.includes("seat cover") || tags.includes("seat cover") || title.includes("seat cover")) return "Seat Covers";
  if (type.includes("steering") || tags.includes("steering") || title.includes("steering cover")) return "Steering Covers";

  // Electronics
  if (type.includes("android") || tags.includes("android frames") || tags.includes("android") || title.includes("android") || title.includes("carplay")) return "Android Stereos";
  if (type.includes("harness") || tags.includes("wiring harness") || tags.includes("harness") || title.includes("wiring harness") || title.includes("harness")) return "Wiring Harnesses";
  if (type.includes("activator") || tags.includes("activator") || title.includes("activator") || title.includes("adapter")) return "Activators";

  // OEM / Replacement parts
  if (type.includes("oem") || tags.includes("car oem parts") || tags.includes("oem") || title.includes("oem")) return "OEM Parts";

  // Collections-based fallback (use Shopify collection handles)
  if (collectionStr.includes("speaker")) return "Car Speakers";
  if (collectionStr.includes("stereo") || collectionStr.includes("android")) return "Android Stereos";
  if (collectionStr.includes("amplifier") || collectionStr.includes("amp")) return "Car Amplifiers";
  if (collectionStr.includes("subwoofer") || collectionStr.includes("sub")) return "Car Subwoofers";
  if (collectionStr.includes("camera")) return "Reverse Cameras";
  if (collectionStr.includes("light") || collectionStr.includes("led")) return "LED Lights";
  if (collectionStr.includes("damping")) return "Sound Damping";
  if (collectionStr.includes("sunshade") || collectionStr.includes("sunshade")) return "Sunshades";
  if (collectionStr.includes("protection")) return "Car Protection";
  if (collectionStr.includes("perfume") || collectionStr.includes("fragrance")) return "Car Perfumes";
  if (collectionStr.includes("floor") || collectionStr.includes("mat")) return "Floor Mats";
  if (collectionStr.includes("seat")) return "Seat Covers";
  if (collectionStr.includes("steering")) return "Steering Covers";
  if (collectionStr.includes("body") || collectionStr.includes("kit")) return "Body Kits";
  if (collectionStr.includes("spoiler")) return "Car Spoilers";
  if (collectionStr.includes("grill") || collectionStr.includes("grille")) return "Car Grills";
  if (collectionStr.includes("headlight") || collectionStr.includes("head lamp")) return "Headlights";
  if (collectionStr.includes("tail")) return "Tail Lights";
  if (collectionStr.includes("ambient")) return "Ambient Lighting";

  // Product type-based fallback
  if (type.includes("sunshade") || type.includes("sun shade")) return "Sunshades";
  if (type.includes("protection") || type.includes("guard")) return "Car Protection";
  if (type.includes("reflector")) return "LED Lights";
  if (type.includes("cover")) return "Car Covers";
  if (type.includes("garnish")) return "Car Garnish";
  if (type.includes("beading") || type.includes("molding")) return "Car Molding";

  // Title-based fallback for common products
  if (title.includes("sunshade") || title.includes("sun shade") || title.includes("window curtain")) return "Sunshades";
  if (title.includes("wireless charg") || title.includes("qi charg")) return "Wireless Chargers";
  if (title.includes("air purifier") || title.includes("hepa")) return "Air Purifiers";
  if (title.includes("tyre inflator") || title.includes("tire inflator") || title.includes("air compressor")) return "Tyre Inflators";
  if (title.includes("wiring kit") || title.includes("relay")) return "Wiring Kits";
  if (title.includes("steering") && (title.includes("hub") || title.includes("cover"))) return "Steering Covers";
  if (title.includes("fog light") || title.includes("foglamp")) return "LED Lights";

  // Final fallback
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
  const productCollections = await scrapeCollectionProducts(collections);

  // Download images
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }

  let downloaded = 0;
  let skipped = 0;

  const products = rawProducts.map(p => {
    const handle = p.handle;
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

    const collectionHandles = productCollections[p.id] || [];

    return {
      sourceId: p.id,
      title: p.title,
      handle,
      description: stripHTML(p.body_html).substring(0, 2000),
      vendor: p.vendor,
      category: mapCategory(p, collectionHandles),
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

  // Print category distribution
  const categoryCount = {};
  for (const p of products) {
    categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
  }
  console.log("\nCategory Distribution:");
  for (const [cat, count] of Object.entries(categoryCount).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count}`);
  }
}

main().catch(err => {
  console.error("Failed:", err);
  process.exit(1);
});

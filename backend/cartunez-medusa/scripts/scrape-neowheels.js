/**
 * NeoWheels Alloy Wheel Catalog Scraper
 *
 * Scrapes all wheel designs, variants, prices, and car compatibility
 * from https://www.neowheels.com/ and saves to neowheels-data.json.
 *
 * Usage: node scripts/scrape-neowheels.js
 * Requires: cheerio (npm install cheerio)
 */

const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

const BASE_URL = "https://www.neowheels.com";
const OUTPUT_FILE = path.join(__dirname, "..", "neowheels-data.json");
const DELAY_MS = 500; // polite delay between requests

async function fetchPage(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Step 1: Get all design slugs from the product listing page
async function getDesignSlugs() {
  console.log("Fetching design listing...");
  const html = await fetchPage(`${BASE_URL}/product`);
  const $ = cheerio.load(html);
  const slugs = [];

  $('a[href*="/product/"]').each((_, el) => {
    const href = $(el).attr("href");
    const match = href && href.match(/\/product\/([a-z0-9-]+)$/);
    if (match && !slugs.includes(match[1])) {
      slugs.push(match[1]);
    }
  });

  console.log(`Found ${slugs.length} designs`);
  return slugs;
}

// Step 2: Get variant URLs for a given design
async function getVariantUrls(designSlug) {
  const html = await fetchPage(`${BASE_URL}/product/${designSlug}`);
  const $ = cheerio.load(html);
  const urls = new Set();

  // Variant links follow pattern: /design-slug/variant-slug
  $('a[href*="/' + designSlug + '/"]').each((_, el) => {
    const href = $(el).attr("href");
    if (href && href.includes("/" + designSlug + "/") && !href.includes("?")) {
      urls.add(href.startsWith("http") ? href : BASE_URL + href);
    }
  });

  return [...urls];
}

// Step 3: Parse a single variant detail page
async function parseVariantPage(url) {
  const html = await fetchPage(url);
  const $ = cheerio.load(html);

  // Product title
  const title = $("h1").first().text().trim();

  // Parse title: "18x7.5 Hydra 5x139.7 CB+M"
  const titleMatch = title.match(
    /^([\d.]+x[\d.]+)\s+(.+?)\s+([\d.]+x[\d.]+)\s+(.+)$/
  );

  let size = "",
    design = "",
    pcd = "",
    finish = "";
  if (titleMatch) {
    [, size, design, pcd, finish] = titleMatch;
  } else {
    // Fallback: try to extract from specification list
    design = title;
  }

  // Image URL
  const imgSrc =
    $('img[src*="Upload/product"]').first().attr("src") ||
    $('img[alt*="' + design + '"]').first().attr("src") ||
    "";
  const imageUrl = imgSrc.startsWith("http")
    ? imgSrc
    : imgSrc
    ? BASE_URL + imgSrc
    : "";

  // Prices
  let salePrice = 0;
  let mrp = 0;

  // Try to find price text
  const priceText = $("body").text();
  const saleMatch = priceText.match(/(?:Deal Price|₹|INR)\s*:?\s*([\d,]+)/);
  const mrpMatch = priceText.match(/MRP\s*:?\s*₹?\s*([\d,]+)/);

  if (saleMatch) salePrice = parseInt(saleMatch[1].replace(/,/g, ""), 10);
  if (mrp) mrp = parseInt(mrpMatch[1].replace(/,/g, ""), 10);

  // Also try structured price elements
  if (!salePrice) {
    const priceEl = $(".product-price, .price, [class*='price']").first();
    if (priceEl.length) {
      const match = priceEl.text().match(/[\d,]+/);
      if (match) salePrice = parseInt(match[0].replace(/,/g, ""), 10);
    }
  }

  // Specification chart
  let offset = "";
  let boreSize = "";
  const specText = $(".specification-chart, table").text() || "";
  const offsetMatch = specText.match(/OFFSET[:\s]*(\d+)/i);
  const boreMatch = specText.match(/BORE\s*SIZE[:\s]*([\d.]+)/i);
  if (offsetMatch) offset = offsetMatch[1];
  if (boreMatch) boreSize = boreMatch[1];

  // Try to get specs from the full page text if not found in table
  if (!offset || !boreSize) {
    const fullText = $("body").text();
    if (!offset) {
      const m = fullText.match(/offset[:\s]*(\d+)/i);
      if (m) offset = m[1];
    }
    if (!boreSize) {
      const m = fullText.match(/bore\s*size[:\s]*([\d.]+)/i);
      if (m) boreSize = m[1];
    }
  }

  // Car compatibility - look for "Suitable For Car" section
  const compatibleCars = [];
  const carSection = $('a[href*="/car/"]');
  carSection.each((_, el) => {
    const href = $(el).attr("href") || "";
    const carMatch = href.match(/\/car\/([a-z0-9-]+)/);
    if (carMatch) {
      // Extract make and model from the text near the link
      const parent = $(el).closest("li, div, a");
      const text = parent.text().trim();
      // Try to split into make and model
      const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length >= 2) {
        compatibleCars.push({
          make: lines[0],
          model: lines[1],
          slug: carMatch[1],
        });
      } else if (lines.length === 1) {
        // Try to split "MAHINDRA XUV 5OO" format
        const parts = lines[0].split(/\s+/);
        if (parts.length >= 2) {
          compatibleCars.push({
            make: parts[0],
            model: parts.slice(1).join(" "),
            slug: carMatch[1],
          });
        }
      }
    }
  });

  return {
    title,
    design: design.trim(),
    size: size.trim(),
    pcd: pcd.trim(),
    finish: finish.trim(),
    salePrice,
    mrp: mrp || salePrice,
    offset,
    boreSize,
    imageUrl,
    compatibleCars,
    url,
  };
}

// Main
async function main() {
  console.log("=== NeoWheels Catalog Scraper ===\n");

  const designSlugs = await getDesignSlugs();
  const allVariants = [];
  let processedCount = 0;

  for (const slug of designSlugs) {
    console.log(`\nProcessing design: ${slug}`);
    const variantUrls = await getVariantUrls(slug);
    console.log(`  Found ${variantUrls.length} variants`);

    for (const url of variantUrls) {
      try {
        const variant = await parseVariantPage(url);
        if (variant.title) {
          allVariants.push(variant);
          processedCount++;
          if (processedCount % 10 === 0) {
            console.log(`  Processed ${processedCount} variants...`);
          }
        }
      } catch (err) {
        console.error(`  Error parsing ${url}: ${err.message}`);
      }
      await sleep(DELAY_MS);
    }
  }

  // Group by design
  const designs = {};
  for (const v of allVariants) {
    const key = v.design.toLowerCase().replace(/\s+/g, "-");
    if (!designs[key]) {
      designs[key] = {
        name: v.design,
        slug: key,
        variants: [],
      };
    }
    designs[key].variants.push(v);
  }

  const output = {
    scrapedAt: new Date().toISOString(),
    totalDesigns: Object.keys(designs).length,
    totalVariants: allVariants.length,
    designs,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`\n=== Done ===`);
  console.log(`Total designs: ${output.totalDesigns}`);
  console.log(`Total variants: ${output.totalVariants}`);
  console.log(`Output: ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error("Scraper failed:", err);
  process.exit(1);
});

/**
 * NeoWheels Alloy Wheel Catalog Scraper
 *
 * Scrapes all wheel designs, variants, prices, and car compatibility
 * from https://www.neowheels.com/ and saves to neowheels-data.json.
 *
 * Usage: node scripts/scrape-neowheels.js
 * No external dependencies — uses Node.js built-in fetch + regex parsing.
 */

const fs = require("fs");
const path = require("path");

const BASE_URL = "https://www.neowheels.com";
const OUTPUT_FILE = "/tmp/neowheels-data.json";
const DELAY_MS = 300; // polite delay between requests

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; CartunezBot/1.0)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Extract all href values matching a pattern from raw HTML
function extractHrefs(html, pattern) {
  const results = [];
  const regex = /href="([^"]*?)"/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const href = match[1];
    if (pattern.test(href) && !results.includes(href)) {
      results.push(href);
    }
  }
  return results;
}

// Extract text between two markers
function extractBetween(html, startMarker, endMarker) {
  const startIdx = html.indexOf(startMarker);
  if (startIdx === -1) return "";
  const fromStart = html.substring(startIdx + startMarker.length);
  const endIdx = fromStart.indexOf(endMarker);
  if (endIdx === -1) return fromStart.substring(0, 500);
  return fromStart.substring(0, endIdx);
}

// Save progress periodically
function saveProgress(allVariants) {
  const designs = {};
  for (const v of allVariants) {
    const key = v.design.toLowerCase().replace(/\s+/g, "-");
    if (!designs[key]) {
      designs[key] = { name: v.design, slug: key, variants: [] };
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
  console.log(`  [Progress saved: ${allVariants.length} variants]`);
}

// Step 1: Get all design slugs from the product listing page
async function getDesignSlugs() {
  console.log("Fetching design listing...");
  const html = await fetchPage(`${BASE_URL}/product`);
  const slugs = [];

  // Design links: /product/{slug}
  const hrefs = extractHrefs(html, /\/product\/[a-z0-9-]+$/);
  for (const href of hrefs) {
    const match = href.match(/\/product\/([a-z0-9-]+)$/);
    if (match && !slugs.includes(match[1])) {
      slugs.push(match[1]);
    }
  }

  console.log(`Found ${slugs.length} designs`);
  return slugs;
}

// Step 2: Get variant URLs for a given design
async function getVariantUrls(designSlug) {
  const html = await fetchPage(`${BASE_URL}/product/${designSlug}`);
  const urls = new Set();

  const hrefs = extractHrefs(html, new RegExp(`/${designSlug}/[a-z0-9-]+`));
  for (const href of hrefs) {
    if (href.includes(`/${designSlug}/`) && !href.includes("?")) {
      const full = href.startsWith("http") ? href : BASE_URL + href;
      urls.add(full);
    }
  }

  return [...urls];
}

// Step 3: Parse a single variant detail page
async function parseVariantPage(url, designSlug) {
  const html = await fetchPage(url);

  // Product title from <h1>
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/s);
  const title = h1Match
    ? h1Match[1].replace(/<[^>]+>/g, "").trim()
    : "";

  // Parse title: "18x7.5 Hydra 5x139.7 CB+M" or "13x5.5 Atlas 4x100x114.3 BM"
  // Use the URL slug for design name (most reliable), parse rest from title
  let size = "",
    design = designSlug || "",
    pcd = "",
    finish = "";

  // Try to extract size (first NxN pattern)
  const sizeMatch = title.match(/^([\d.]+x[\d.]+)/);
  if (sizeMatch) size = sizeMatch[1];

  // Try to extract PCD (NxN or NxNxN pattern, not at start)
  const pcdMatch = title.match(/\s([\d]+x[\d]+(?:x[\d.]+)?)\s/i);
  if (pcdMatch) pcd = pcdMatch[1];

  // Finish is typically the last word(s) after PCD
  if (pcd) {
    const pcdIdx = title.indexOf(pcd);
    const afterPcd = title.substring(pcdIdx + pcd.length).trim();
    if (afterPcd) finish = afterPcd;
  }

  // Image URL from img tags
  let imageUrl = "";
  const imgRegex = /<img[^>]+src="([^"]*Upload\/product[^"]*)"/gi;
  const imgMatch = imgRegex.exec(html);
  if (imgMatch) {
    let imgSrc = imgMatch[1].replace(/\s+/g, "%20");
    imageUrl = imgSrc.startsWith("http") ? imgSrc : BASE_URL + imgSrc;
  }

  // Prices — neowheels.com uses &#x20b9; (HTML entity for ₹) and literal ₹
  let salePrice = 0;
  let mrp = 0;

  // Normalize: replace HTML entity with literal character
  const normalizedHtml = html.replace(/&#x20b9;/g, "₹");

  // Pattern 1: "Deal Price : ₹ 9875" — most reliable
  const dealPriceMatch = normalizedHtml.match(
    /Deal\s*Price\s*:?\s*₹\s*([\d,]+)/i
  );
  // Pattern 2: MRP — may have HTML tags between "MRP:" and the price
  const mrpMatch = normalizedHtml.match(/MRP[\s\S]{0,50}?₹\s*([\d,]+)/i);
  // Pattern 3: First ₹ that's NOT in "You Save" context
  // Find "Deal Price" section first, then extract ₹ from there
  const dealSection = normalizedHtml.match(
    /Deal\s*Price[\s\S]{0,200}/i
  );
  let sectionPrice = 0;
  if (dealSection) {
    const pMatch = dealSection[0].match(/₹\s*([\d,]+)/);
    if (pMatch) sectionPrice = parseInt(pMatch[1].replace(/,/g, ""), 10);
  }

  if (dealPriceMatch) {
    salePrice = parseInt(dealPriceMatch[1].replace(/,/g, ""), 10);
  } else if (sectionPrice) {
    salePrice = sectionPrice;
  }

  if (mrpMatch) {
    mrp = parseInt(mrpMatch[1].replace(/,/g, ""), 10);
  }

  // If we only found one price, use it for both
  if (salePrice && !mrp) mrp = salePrice;
  if (mrp && !salePrice) salePrice = mrp;

  // Specification chart — look for key-value pairs
  let offset = "";
  let boreSize = "";

  const offsetMatch = html.match(/OFFSET[:\s<\/>a-z]*?(\d+)/i);
  const boreMatch = html.match(/BORE\s*SIZE[:\s<\/>a-z]*?([\d.]+)/i);
  if (offsetMatch) offset = offsetMatch[1];
  if (boreMatch) boreSize = boreMatch[1];

  // Car compatibility — look for /car/ links
  const compatibleCars = [];
  const carHrefs = extractHrefs(html, /\/car\/[a-z0-9-]+/);
  const seenSlugs = new Set();

  for (const href of carHrefs) {
    const carSlugMatch = href.match(/\/car\/([a-z0-9-]+)/);
    if (!carSlugMatch || seenSlugs.has(carSlugMatch[1])) continue;
    seenSlugs.add(carSlugMatch[1]);

    // Find the text near this link (within ~200 chars after the href)
    const linkIdx = html.indexOf(href);
    if (linkIdx === -1) continue;

    // Look for text content between tags after this link
    const nearby = html.substring(linkIdx, linkIdx + 300);
    const textContent = nearby
      .replace(/<[^>]+>/g, "\n")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("http"));

    // First two non-empty text lines should be MAKE and MODEL
    if (textContent.length >= 2) {
      compatibleCars.push({
        make: textContent[0],
        model: textContent[1],
        slug: carSlugMatch[1],
      });
    } else if (textContent.length === 1) {
      const parts = textContent[0].split(/\s+/);
      if (parts.length >= 2) {
        compatibleCars.push({
          make: parts[0],
          model: parts.slice(1).join(" "),
          slug: carSlugMatch[1],
        });
      }
    }
  }

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
    let variantUrls;
    try {
      variantUrls = await getVariantUrls(slug);
    } catch (err) {
      console.error(`  Error fetching design page: ${err.message}`);
      continue;
    }
    console.log(`  Found ${variantUrls.length} variants`);

    for (const url of variantUrls) {
      try {
        const variant = await parseVariantPage(url, slug);
        if (variant.title) {
          allVariants.push(variant);
          processedCount++;
          if (processedCount % 10 === 0) {
            console.log(`  Processed ${processedCount} variants...`);
          }
          // Save progress every 50 variants
          if (processedCount % 50 === 0) {
            saveProgress(allVariants);
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

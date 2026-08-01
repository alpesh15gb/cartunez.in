/**
 * Re-downloads missing SahibaCar product images.
 *
 * The scraper only downloads the first 3 images per product, but the
 * importer records every image URL, so 4th+ images were broken links.
 * This reads the scraped data and downloads any image file that is not
 * present yet.
 *
 * Usage: docker exec cartunez-medusa node scripts/fix-sahibacar-images.js
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

const DATA_FILE = "/tmp/sahibacar-data.json";
const IMAGES_DIR = path.join(__dirname, "..", "uploads", "sahibacar");

function downloadImage(url, destPath) {
  if (fs.existsSync(destPath)) return Promise.resolve(false);
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        fs.unlinkSync(destPath);
        return downloadImage(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        return reject(new Error("HTTP " + res.statusCode));
      }
      res.pipe(file);
      file.on("finish", () => { file.close(); resolve(true); });
      file.on("error", (err) => { fs.unlinkSync(destPath); reject(err); });
    }).on("error", reject);
  });
}

async function main() {
  if (!fs.existsSync(DATA_FILE)) {
    console.error("Data file not found: " + DATA_FILE);
    console.error("Re-run the scraper first: node scripts/scrape-sahibacar.js");
    process.exit(1);
  }

  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }

  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  let downloaded = 0;
  let present = 0;
  let stillMissing = 0;

  for (const product of data.products || []) {
    for (const img of product.images || []) {
      if (fs.existsSync(img.localPath)) {
        present++;
        continue;
      }
      try {
        await downloadImage(img.url, img.localPath);
        downloaded++;
      } catch (err) {
        stillMissing++;
        console.error("  Failed: " + img.filename + ": " + err.message);
      }
    }
  }

  console.log("\n=== Done ===");
  console.log("Downloaded: " + downloaded);
  console.log("Already present: " + present);
  console.log("Still missing: " + stillMissing);
  process.exit(0);
}

main().catch(function (err) {
  console.error("Failed:", err);
  process.exit(1);
});

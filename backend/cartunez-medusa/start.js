const { Medusa } = require("@medusajs/medusa");
const port = parseInt(process.env.PORT || "9000", 10);
const host = process.env.HOST || "0.0.0.0";

(async () => {
  try {
    const app = new Medusa(process.cwd());
    await app.listen(port, host);
  } catch (err) {
    console.error("FATAL:", err);
    process.exit(1);
  }
})();

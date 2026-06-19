const start = require("@medusajs/medusa/dist/commands/start").default;
const port = parseInt(process.env.PORT || "9000", 10);
const directory = process.cwd();

(async () => {
  try {
    await start({ port, directory });
  } catch (err) {
    console.error("FATAL:", err.message);
    process.exit(1);
  }
})();

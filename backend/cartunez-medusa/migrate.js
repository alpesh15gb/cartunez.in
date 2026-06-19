const migrate = require("@medusajs/medusa/dist/commands/migrate").default;
const directory = process.cwd();

migrate({ directory, action: "run" })
  .then(() => {
    console.log("Migrations completed successfully");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });

const { DataSource } = require("typeorm");
require("dotenv").config({ path: require("path").resolve(__dirname, ".env.production") });
require("dotenv").config({ path: require("path").resolve(__dirname, ".env") });

const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@postgres:5432/cartunez";
console.log("DATABASE_URL:", dbUrl);

const ds = new DataSource({
  type: "postgres",
  url: dbUrl,
  entities: ["./dist/models/*.js"],
  migrations: ["./dist/migrations/*.js"],
});

ds.initialize()
  .then(() => {
    console.log("DB connection OK");
    return ds.runMigrations();
  })
  .then((migrations) => {
    console.log("Migrations run:", migrations.length);
    return ds.destroy();
  })
  .catch((err) => {
    console.error("DB ERROR:", err.message);
    console.error("Error code:", err.code);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  });

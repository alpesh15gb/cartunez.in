const express = require("express");
const { Medusa } = require("@medusajs/medusa");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, ".env") });

const port = parseInt(process.env.PORT || "9000", 10);
const app = express();

app.use(express.json());

const medusa = new Medusa(app, {
  database: {
    type: "postgres",
    url: process.env.DATABASE_URL,
  },
  redis_url: process.env.REDIS_URL,
  jwt_secret: process.env.JWT_SECRET,
  cookie_secret: process.env.COOKIE_SECRET,
});

medusa.listen(port).then(() => {
  console.log(`Medusa server started on port: ${port}`);
}).catch((err) => {
  console.error("FATAL:", err.message);
  process.exit(1);
});

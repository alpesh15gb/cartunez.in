const dotenv = require("dotenv");
const path = require("path");

let ENV_FILE_NAME = "";
switch (process.env.NODE_ENV) {
  case "production":
    ENV_FILE_NAME = ".env.production";
    break;
  case "test":
    ENV_FILE_NAME = ".env.test";
    break;
  default:
    ENV_FILE_NAME = ".env";
}

try {
  dotenv.config({ path: path.resolve(__dirname, ENV_FILE_NAME) });
} catch (err) {}

const databaseUrl = process.env.DATABASE_URL;
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

if (!databaseUrl) {
  console.error("FATAL: DATABASE_URL environment variable is not set.");
  process.exit(1);
}

const jwtSecret = process.env.JWT_SECRET;
const cookieSecret = process.env.COOKIE_SECRET;

if (!jwtSecret || !cookieSecret) {
  console.error("FATAL: JWT_SECRET and COOKIE_SECRET environment variables must be set.");
  process.exit(1);
}

const storeCors = process.env.STORE_CORS || "https://cartunez.in,https://shop.cartunez.in,http://localhost:3000,http://localhost:3001,http://localhost:5173";
const adminCors = process.env.ADMIN_CORS || "https://cartunez.in,https://shop.cartunez.in,http://localhost:7001,http://localhost:3000,http://localhost:9000";

/** @type {import('@medusajs/medusa').ConfigModule["projectConfig"]} */
const projectConfig = {
  database_url: databaseUrl,
  database_type: "postgres",
  redis_url: redisUrl,
  store_cors: storeCors,
  admin_cors: adminCors,
  jwt_secret: jwtSecret,
  cookie_secret: cookieSecret,
  cookie_secure: process.env.COOKIE_SECURE === "true",
};

/** @type {import('@medusajs/medusa').ConfigModule} */
module.exports = {
  projectConfig,
  featureFlags: {
    product_categories: true,
  },
  plugins: [
    {
      resolve: "@medusajs/admin",
      /** @type {import('@medusajs/admin').PluginOptions} */
      options: {
        serve: true,
        autoRebuild: false,
      },
    },
    {
      resolve: "@medusajs/event-bus-redis",
      options: {
        redisUrl,
      },
    },
    {
      resolve: "@medusajs/file-local",
      options: {
        upload_dir: "uploads",
        backend_url: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000",
      },
    },
    {
      resolve: "medusa-plugin-meilisearch",
      options: {
        config: {
          host: process.env.MEILISEARCH_HOST || "http://localhost:7700",
          apiKey: process.env.MEILISEARCH_API_KEY || "",
        },
        settings: {
          products: {
            searchableAttributes: [
              "title",
              "description",
            ],
            displayedAttributes: [
              "id",
              "title",
              "description",
              "handle",
              "thumbnail",
            ],
            filterableAttributes: [
              "categories",
            ],
            sortableAttributes: ["created_at", "title"],
          },
        },
      },
    },
    "medusa-payment-manual",
    "medusa-fulfillment-manual",
  ],
  modules: {
    eventBus: {
      resolve: "@medusajs/event-bus-redis",
      options: {
        redisUrl,
      },
    },
    cacheService: {
      resolve: "@medusajs/cache-redis",
      options: {
        redisUrl,
        ttl: 30,
      },
    },
  },
};

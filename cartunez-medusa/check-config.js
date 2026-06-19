console.log("DATABASE_URL:", process.env.DATABASE_URL);
console.log("NODE_ENV:", process.env.NODE_ENV);

const config = require("./medusa-config.js");
console.log("Config DB URL:", config.projectConfig.database_url);
console.log("Config redis_url:", config.projectConfig.redis_url);

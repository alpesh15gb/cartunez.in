console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "[SET]" : "[NOT SET]");
console.log("REDIS_URL:", process.env.REDIS_URL ? "[SET]" : "[NOT SET]");

const config = require("./medusa-config.js");
console.log("Config DB URL:", config.projectConfig.database_url ? "[SET]" : "[NOT SET]");
console.log("Config redis_url:", config.projectConfig.redis_url ? "[SET]" : "[NOT SET]");

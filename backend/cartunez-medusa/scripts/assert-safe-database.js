const { URL } = require("url");

function assertSafeDatabase(operation = "development seed") {
  if (process.env.NODE_ENV === "production") {
    throw new Error(`${operation} is disabled when NODE_ENV=production`);
  }

  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is required");

  const database = new URL(raw);
  const name = database.pathname.replace(/^\//, "").toLowerCase();
  const localHost = ["localhost", "127.0.0.1", "postgres"].includes(database.hostname);
  const disposableName = /(?:^|_)(?:dev|test|ci)$/.test(name);

  if (!localHost && !disposableName) {
    throw new Error(`${operation} refused: use localhost or a database ending in _dev, _test, or _ci`);
  }

  if (process.env.CONFIRM_DISPOSABLE_DATABASE !== "yes") {
    throw new Error(`${operation} refused: set CONFIRM_DISPOSABLE_DATABASE=yes after verifying the target`);
  }
}

function describeDatabaseTarget() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is required");
  const database = new URL(raw);
  return { host: database.hostname, name: database.pathname.replace(/^\//, "") };
}

module.exports = { assertSafeDatabase, describeDatabaseTarget };

#!/usr/bin/env node

const { execFileSync } = require("child_process");
const { assertSafeDatabase, describeDatabaseTarget } = require("./assert-safe-database");

function output(command, args = []) {
  return execFileSync(command, args, { encoding: "utf8" }).trim();
}

const nodeVersion = process.version;
const npmVersion = output("npm", ["--version"]);
const registry = output("npm", ["config", "get", "registry"]);
const medusaRegistry = output("npm", ["config", "get", "@medusajs:registry"]);

if (!/^v20\./.test(nodeVersion)) throw new Error(`Node 20.x is required; received ${nodeVersion}`);
if (npmVersion !== "10.8.2") throw new Error(`npm 10.8.2 is required; received ${npmVersion}`);
if (registry !== "https://registry.npmjs.org/") throw new Error(`Unexpected npm registry: ${registry}`);
if (!['undefined', 'null', ''].includes(medusaRegistry)) {
  throw new Error("A scoped @medusajs registry override is not permitted");
}

assertSafeDatabase("commerce runtime verification");
const target = describeDatabaseTarget();
console.log(`Node ${nodeVersion}; npm ${npmVersion}`);
console.log(`npm registry: ${registry}; @medusajs override: none`);
console.log(`Disposable database target: host=${target.host} database=${target.name}`);

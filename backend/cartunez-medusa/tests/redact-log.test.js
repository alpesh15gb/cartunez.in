const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const directory = fs.mkdtempSync(path.join(os.tmpdir(), "cartunez-redact-"));
const input = path.join(directory, "input.log");
const output = path.join(directory, "output.log");
fs.writeFileSync(input, [
  "postgresql://user:database-password@db.example.test:5432/cartunez_ci",
  "Authorization: Bearer secret-jwt",
  "Set-Cookie: connect.sid=secret-cookie",
  "api_key=secret-provider-key",
  "customer@example.test",
].join("\n"));

execFileSync(process.execPath, [path.join(__dirname, "../scripts/redact-log.js"), input, output]);
const redacted = fs.readFileSync(output, "utf8");
for (const secret of ["database-password", "secret-jwt", "secret-cookie", "secret-provider-key", "customer@example.test"]) {
  assert(!redacted.includes(secret), `log retained ${secret}`);
}
assert(redacted.includes("<redacted>"));
assert(redacted.includes("<redacted-email>"));
fs.rmSync(directory, { recursive: true, force: true });
console.log("Medusa diagnostic log redaction checks passed");

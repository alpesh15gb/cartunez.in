#!/usr/bin/env node

const fs = require("fs");

const input = process.argv[2];
const output = process.argv[3];

if (!input || !output) throw new Error("Usage: node scripts/redact-log.js INPUT OUTPUT (use - for stdin/stdout)");

let log = input === "-"
  ? fs.readFileSync(0, "utf8")
  : fs.existsSync(input) ? fs.readFileSync(input, "utf8") : "No Medusa log was produced.\n";

log = log
  .replace(/(postgres(?:ql)?:\/\/[^:\s/@]+:)[^@\s/]+@/gi, "$1<redacted>@")
  .replace(/(authorization\s*[:=]\s*bearer\s+)[^\s]+/gi, "$1<redacted>")
  .replace(/(set-cookie|cookie)(\s*[:=]\s*)[^\r\n]+/gi, "$1$2<redacted>")
  .replace(/((?:password|api[_-]?key|jwt[_-]?secret|cookie[_-]?secret)\s*[:=]\s*)[^\s,;]+/gi, "$1<redacted>")
  .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "<redacted-email>");

if (output === "-") process.stdout.write(log);
else fs.writeFileSync(output, log, { mode: 0o600 });

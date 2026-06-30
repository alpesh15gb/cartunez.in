FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps
# Patch plugins.js to log actual error message
RUN sed -i 's/throw new Error("Cannot register ".concat(name, ". Make sure to default export a service class in ").concat(fn));/console.error("PLUGIN_DEBUG: Cannot register service", name, "from", fn, "typeof loaded:", typeof loaded); throw new Error("Cannot register ".concat(name, ". Make sure to default export a service class in ").concat(fn));/' /app/node_modules/@medusajs/medusa/dist/loaders/plugins.js
# Patch all *Service.registerInstalledProviders to skip update when no providers and fix variable names
RUN node << 'EOF'
const fs = require('fs');
const services = ['payment-provider', 'notification', 'fulfillment-provider', 'tax-provider'];
services.forEach(s => {
  const p = '/app/node_modules/@medusajs/medusa/dist/services/' + s + '.js';
  if (!fs.existsSync(p)) {
    console.log('NOT EXISTS:', s);
    return;
  }
  let c = fs.readFileSync(p, 'utf8');
  // Fix function signature: function (providerIds) -> function (providers)
  c = c.replace(/function \(providerIds\)/g, 'function (providers)');
  // Fix all occurrences of providerIds with providers
  c = c.replace(/providerIds/g, 'providers');
  // Fix empty criteria updates that fail on TypeORM 0.3.x
  c = c.replace(/([a-zA-Z0-9_]+)\.update\(\{\},\s*\{\s*is_installed:\s*false\s*\}\)/g, '$1.createQueryBuilder().update().set({ is_installed: false }).execute()');
  fs.writeFileSync(p, c);
  console.log('Fixed', s);
});

// Patch express.js to dynamically support secure/SameSite session cookies over HTTP (local testing)
const expressLoaderPath = '/app/node_modules/@medusajs/medusa/dist/loaders/express.js';
if (fs.existsSync(expressLoaderPath)) {
  let content = fs.readFileSync(expressLoaderPath, 'utf8');
  const oldStr = 'app.use((0, express_session_1.default)(sessionOpts));';
  const newStr = `const sessionMiddleware = (0, express_session_1.default)(sessionOpts);
            app.use(function (req, res, next) {
                sessionMiddleware(req, res, function (err) {
                    if (err) return next(err);
                    if (req.session && req.session.cookie) {
                        if (!req.secure) {
                            req.session.cookie.secure = false;
                            req.session.cookie.sameSite = "lax";
                        }
                    }
                    next();
                });
            });`;
  if (content.includes(oldStr)) {
    content = content.replace(oldStr, newStr);
    fs.writeFileSync(expressLoaderPath, content);
    console.log('Fixed express session loader');
  } else {
    console.log('Could not find express session line to patch');
  }
}
EOF

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cartunez
ENV JWT_SECRET=build_placeholder_secret
ENV COOKIE_SECRET=build_placeholder_secret
RUN npm run build
RUN npx medusa-admin build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 medusa

COPY --from=builder --chown=medusa:nodejs /app/dist ./dist
COPY --from=builder --chown=medusa:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=medusa:nodejs /app/package.json ./package.json
COPY --from=builder --chown=medusa:nodejs /app/medusa-config.js ./medusa-config.js
COPY --from=builder --chown=medusa:nodejs /app/start.js ./start.js
COPY --from=builder --chown=medusa:nodejs /app/migrate.js ./migrate.js
COPY --from=builder --chown=medusa:nodejs /app/check-db.js ./check-db.js
COPY --from=builder --chown=medusa:nodejs /app/build ./build
COPY --from=builder --chown=medusa:nodejs /app/scripts ./scripts
COPY --from=builder --chown=medusa:nodejs /app/seed-data.js ./seed-data.js

RUN mkdir -p /app/uploads && chown -R medusa:nodejs /app/uploads

USER medusa

EXPOSE 9000

ENV PORT 9000
ENV HOST 0.0.0.0

CMD ["sh", "-c", "npx medusa migrations run && npx medusa start"]
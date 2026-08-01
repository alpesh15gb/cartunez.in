FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json ./
# medusa-plugin-meilisearch pins peer medusa-interfaces@1.3.6 while the root
# package requires ^1.3.7 — an unsatisfiable peer tree, so --legacy-peer-deps is
# required. No lockfile is tracked for this package.
RUN npm install --legacy-peer-deps --no-audit --no-fund && npm cache clean --force

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

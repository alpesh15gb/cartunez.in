FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG VITE_MEDUSA_URL
ARG VITE_API_URL
ARG VITE_MEILISEARCH_URL
ARG VITE_MEILISEARCH_KEY
ARG VITE_MEDUSA_PUBLISHABLE_KEY=pk_01KVBSWHFD53JWKRBEHS43FDBJ

ENV VITE_MEDUSA_URL=$VITE_MEDUSA_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_MEILISEARCH_URL=$VITE_MEILISEARCH_URL
ENV VITE_MEILISEARCH_KEY=$VITE_MEILISEARCH_KEY
ENV VITE_MEDUSA_PUBLISHABLE_KEY=$VITE_MEDUSA_PUBLISHABLE_KEY

RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 8000

ENV PORT 8000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
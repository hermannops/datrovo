# syntax=docker/dockerfile:1

# --- deps : installe les dépendances seules (couche cacheable tant que
# package*.json ne change pas) ---
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# --- builder : build Next.js en mode standalone ---
FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# API_BASE_URL/SITE_URL sont lus à la requête côté serveur (pas inlinés dans
# le bundle client) : aucune de nos pages n'est statiquement pré-rendue au
# build (toutes dépendent de données dynamiques), donc pas besoin de ces
# variables ici — seulement au runtime du conteneur (cf. docker-compose.yml).
RUN npm run build

# --- runtime : image finale minimale ---
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN groupadd --gid 1001 datrovo && useradd --uid 1001 --gid datrovo --create-home datrovo

COPY --from=builder /app/public ./public
COPY --from=builder --chown=datrovo:datrovo /app/.next/standalone ./
COPY --from=builder --chown=datrovo:datrovo /app/.next/static ./.next/static

USER datrovo

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]

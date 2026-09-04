FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY prisma ./prisma
COPY prisma.config.js ./
# Dummy URL is enough for client generation (no DB connection made)
RUN DATABASE_URL="postgresql://user:password@localhost:5432/db" npx prisma generate

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --gid 1001 appuser
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/generated ./generated
COPY package.json package-lock.json prisma.config.js prisma.js ./
COPY prisma ./prisma
COPY src ./src
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh && chown -R appuser:appgroup /app
USER appuser
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://localhost:4000/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "src/index.js"]

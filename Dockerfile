# ──────────────────────────────────────────────────────────────────────────────
# Dockerfile — Next.js Frontend (OceanIA PeritajeVehiculo)
# Multi-stage build for minimal production image.
# Runs as non-root user "node" for improved security.
# ──────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Install dependencies ─────────────────────────────────────────────
FROM node:20-alpine AS deps

# Install libc compatibility for native modules on Alpine
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package manifests only — leverages Docker layer cache
COPY package.json package-lock.json* ./

# Install exact versions from lockfile; omit devDependencies for production
RUN npm ci --omit=dev

# ── Stage 2: Build the Next.js application ─────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy installed production dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy the entire source tree
COPY . .

# Environment variables needed at build time
# We provide dummy values here so Next.js can build successfully.
# Real values will be injected at runtime via docker-compose env_file.
ENV SESSION_SECRET="build_time_secret_do_not_use_123" \
    APP_USERNAME="alfredo" \
    APP_PASSWORD_HASH="\$2b\$12\$dummyhashdummyhashdummyhash" \
    NEXT_PUBLIC_API_URL="http://localhost:8000" \
    NEXT_PUBLIC_APP_URL="http://localhost:3000" \
    NODE_ENV="production" \
    NEXT_TELEMETRY_DISABLED=1

# Build the production Next.js bundle
RUN npm run build

# ── Stage 3: Production runtime image ─────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

# Create a dedicated non-root group and user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Copy only the output artifacts needed to run Next.js in standalone mode
# (public static assets, prerendered pages, server chunks)
COPY --from=builder /app/public ./public

# Use Next.js standalone output for a minimal runtime
# Set correct ownership for the nextjs user
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user — never run as root in production
USER nextjs

# Expose the Next.js default port
EXPOSE 3000

ENV PORT=3000 \
    HOSTNAME="0.0.0.0"

# Healthcheck — Docker will restart the container if the health check fails
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD wget -qO- http://localhost:3000/ || exit 1

# Start the Next.js server (standalone mode — no next start, just node server.js)
CMD ["node", "server.js"]

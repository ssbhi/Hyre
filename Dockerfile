# True Hire — production image for the hackathon EC2 box (Recipe A/B, port 8080→3000).
# Debian-slim keeps Prisma's engines happy without musl workarounds.
FROM node:22-bookworm-slim

# openssl is required by Prisma's query engine at runtime.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

# Install dependencies first so Docker layer-caches them.
# --include=dev is required because NODE_ENV=production would otherwise skip
# devDependencies — and the build needs Tailwind/PostCSS, while the entrypoint
# needs `prisma` (db push) and `tsx` (seed).
COPY package.json package-lock.json ./
RUN npm ci --include=dev

# Generate the Prisma client, then build the app.
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
RUN npm run build

# Runtime: SQLite lives on a mounted volume at /app/data; resumes/JDs at /app/public/uploads.
RUN chmod +x scripts/docker-entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["./scripts/docker-entrypoint.sh"]

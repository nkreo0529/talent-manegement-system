# Single stage - run TypeScript directly with tsx
FROM node:20-slim

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY client/package.json ./client/
COPY shared/ ./shared/
COPY server/ ./server/

# Install all dependencies (tsx is a devDependency)
RUN pnpm install --frozen-lockfile

# Build shared types
RUN pnpm --filter @talent/types build

WORKDIR /app/server

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["npx", "tsx", "src/index.ts"]

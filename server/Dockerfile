# Multi-stage build for the Kanban Express API.
# Build context must be the repository root because the server workspace
# imports shared contracts from ../shared and resolves via the root lockfile:
#   docker build -f server/Dockerfile -t kanban-api .
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json ./server/
RUN npm ci
COPY tsconfig.json ./
COPY shared ./shared
COPY server ./server
RUN npm --workspace server run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY server/package.json ./server/
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/server/dist ./server/dist
# Run unprivileged; the node image ships a non-root `node` user.
USER node
EXPOSE 5000
# tsc uses rootDir ".." so the emitted tree keeps its source layout.
# Container orchestrators should probe /health for liveness and /ready for traffic.
CMD ["node", "server/dist/server/src/server.js"]

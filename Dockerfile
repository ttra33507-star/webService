# Build stage installs all dependencies for the TypeScript compiler
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Copy the rest of the source and compile to JavaScript
COPY . .
RUN npm run build

# Drop development dependencies to slim the runtime bundle
RUN npm prune --omit=dev

# Runtime stage contains only what is needed to execute the compiled app
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3002

# Copy the application artifacts from the builder image
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js

# Run the service as an unprivileged user inside the container
RUN addgroup -g 1001 -S nodejs && adduser -S nodeuser -u 1001
RUN chown -R nodeuser:nodejs /app
USER nodeuser

EXPOSE 3002

CMD ["node", "server.js"]
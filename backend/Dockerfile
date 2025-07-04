# Use Node.js LTS (Long Term Support) version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Install dev dependencies for build (TypeScript, Prisma)
RUN npm install typescript ts-node @types/node

# Generate Prisma client
RUN npx prisma generate

# Copy source code (exclude scripts that aren't needed for production)
COPY src ./src
COPY prisma ./prisma
COPY public ./public
COPY tsconfig.json ./

# Create a production tsconfig that only includes src
RUN echo '{"extends": "./tsconfig.json", "include": ["src/**/*"], "exclude": ["node_modules", "dist", "scripts"]}' > tsconfig.prod.json

# Build TypeScript to JavaScript using production config
RUN npx tsc -p tsconfig.prod.json

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Start the application
CMD ["npm", "start"]
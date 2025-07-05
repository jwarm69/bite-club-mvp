# Multi-stage build for React application

# Stage 1: Build the React app
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the app for production
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Remove default nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/

# Copy built app from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Create non-root user for security
RUN addgroup -g 1001 -S nginx-app
RUN adduser -S nginx-app -u 1001

# Ensure nginx can access the files
RUN chown -R nginx-app:nginx-app /usr/share/nginx/html
RUN chown -R nginx-app:nginx-app /var/cache/nginx
RUN chown -R nginx-app:nginx-app /var/log/nginx
RUN chown -R nginx-app:nginx-app /etc/nginx/conf.d
RUN touch /var/run/nginx.pid
RUN chown -R nginx-app:nginx-app /var/run/nginx.pid

# Switch to non-root user
USER nginx-app

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
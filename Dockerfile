# Use Node.js for building the application
FROM node:20-slim AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source files and build the application
COPY . .
RUN npm run build

# Final stage
FROM node:20-slim

WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
COPY --from=build /app/server ./server
COPY --from=build /app/node_modules ./node_modules
COPY .env.local .env.local

# Create db directory
RUN mkdir -p /app/server/db

# Environment variables
ENV PORT=3001
ENV DB_PATH=/app/server/db/db.json
ENV FRONTEND_URL=http://localhost:8092

# Expose backend port
EXPOSE 3001

# Run the server
CMD ["npm", "run", "server"]

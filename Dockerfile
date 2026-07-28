# Use Node.js LTS version
FROM node:20-slim

# Create app directory
WORKDIR /usr/src/app

# Install dependencies separately for caching
COPY package*.json ./
RUN npm install --production

# If you have a separate server directory, make sure to handle it
# But based on the current structure, server logic is in /server and entry is server.ts

# Copy the rest of the application
COPY . .

# Build the frontend assets
# Note: This requires dev dependencies, so if you want to build in Docker, 
# you might need a multi-stage build or install dev deps first.
# For simplicity, we'll assume you build locally or we do a full install here.

RUN npm install && npm run build && npm prune --production

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables for production
ENV NODE_ENV=production

# Start the application
CMD [ "npm", "run", "start" ]

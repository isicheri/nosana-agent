# Use a lightweight Node.js base image
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose the port your app runs on
EXPOSE 4000

# Start the app
CMD ["node", "dist/main.js"]
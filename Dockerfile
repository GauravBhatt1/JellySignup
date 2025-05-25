FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Create data directory for SQLite
RUN mkdir -p data

# Build the application
RUN npm run build

# Expose the port
EXPOSE 5000

# Set environment variables at runtime
ENV NODE_ENV=production

# Start the server
CMD ["npm", "start"]
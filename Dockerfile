FROM node:20-alpine

WORKDIR /app

# Install necessary packages
RUN apk add --no-cache python3 make g++

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Expose the port
EXPOSE 5000

# Set environment variables at runtime
ENV NODE_ENV=production

# Start the server
CMD ["npm", "start"]
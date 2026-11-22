FROM node:22-alpine

WORKDIR /app

# Copy manifests
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN npm --prefix client install

# Copy source code
COPY . .

# Build frontend client
RUN npm run build:client

# Expose default port
EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

CMD ["npm", "start"]

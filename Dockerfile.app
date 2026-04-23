# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY Frontend/package*.json ./
RUN npm install
COPY Frontend/ ./
RUN npm run build

# Stage 2: Main App (The "Brains")
FROM node:20-alpine
WORKDIR /app

# No compilers here - security!
COPY Backend/package*.json ./Backend/
RUN cd Backend && npm install --production
COPY Backend/ ./Backend/

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./Frontend/dist

# Persistent projects folder
RUN mkdir -p /app/Backend/projects \
    && chown -R node:node /app

WORKDIR /app/Backend
USER node
EXPOSE 3000
CMD ["node", "server.js"]

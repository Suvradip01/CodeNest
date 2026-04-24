# Main App (The "Brains" + "Worker")
FROM node:20-alpine
WORKDIR /app

# Install all necessary compilers for direct execution
RUN apk add --no-cache python3 g++ gcc make openjdk17-jdk

# Copy only the Backend code
COPY Backend/package*.json ./
RUN npm install --production
COPY Backend/ ./

# Persistent projects folder
RUN mkdir -p /app/projects \
    && chown -R node:node /app

USER node
EXPOSE 3000
CMD ["node", "server.js"]

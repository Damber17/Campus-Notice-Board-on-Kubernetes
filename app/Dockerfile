# Purpose: Build a small Alpine-based Node application, running as non-root.
# Build command: docker build --build-arg APP_VERSION=1.0.0 -t notice-board:02230123-1.0.0 app
FROM node:22-alpine
ARG APP_VERSION=1.0.0
ARG BROKEN_HEALTH=false
ENV APP_VERSION=${APP_VERSION} BROKEN_HEALTH=${BROKEN_HEALTH} STUDENT_ID=02230123
WORKDIR /app
COPY --chown=node:node package.json server.js ./
USER node
EXPOSE 8080
CMD ["node", "server.js"]

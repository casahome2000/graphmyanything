# Stdio MCP server for Glama / container hosts (Node built-in SQLite).
FROM node:24-slim

WORKDIR /app

# Ship a known release; override build-arg to test local tarballs.
ARG GMA_MCP_VERSION=0.1.2
RUN npm install -g "graphmyanything-mcp@${GMA_MCP_VERSION}"

ENV GRAPHMYANYTHING_DB_PATH=/data/metrics.db
VOLUME ["/data"]

ENTRYPOINT ["graphmyanything-mcp"]
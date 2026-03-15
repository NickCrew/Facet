FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY .npmrc package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY proxy/package.json ./proxy/package.json
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

FROM node:22-alpine AS runtime
WORKDIR /app
RUN corepack enable
COPY .npmrc package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY proxy/package.json ./proxy/package.json
RUN pnpm install --prod --filter facet-ai-proxy --frozen-lockfile
COPY --from=build /app/dist ./dist
COPY proxy ./proxy
ENV HOST=0.0.0.0
ENV PORT=9001
ENV FACET_STATIC_DIR=/app/dist
WORKDIR /app/proxy
EXPOSE 9001
CMD ["pnpm", "run", "start"]

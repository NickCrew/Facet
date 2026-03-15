FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY .npmrc package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY proxy/package.json ./proxy/package.json
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80

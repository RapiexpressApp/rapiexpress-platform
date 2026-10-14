FROM node:24-alpine AS build
RUN corepack enable && corepack prepare pnpm@12.6.0 --activate
WORKDIR /repo

COPY pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm fetch

COPY . .
RUN pnpm install --offline --frozen-lockfile

ARG APP
ARG VITE_API_URL
ARG PUBLIC_PORTAL_URL
RUN case "$APP" in \
      admin|portal) test -n "$VITE_API_URL" || { echo "VITE_API_URL is required for $APP" >&2; exit 1; } ;; \
      landing) test -n "$PUBLIC_PORTAL_URL" || { echo "PUBLIC_PORTAL_URL is required for landing" >&2; exit 1; } ;; \
      *) echo "APP must be admin, portal or landing" >&2; exit 1 ;; \
    esac
RUN pnpm --filter "@rapiexpress/${APP}" build

FROM caddy:2-alpine
ARG APP
COPY docker/caddy/ /tmp/caddy/
RUN if [ "$APP" = landing ]; then cp /tmp/caddy/static.Caddyfile /etc/caddy/Caddyfile; \
    else cp /tmp/caddy/spa.Caddyfile /etc/caddy/Caddyfile; fi && rm -rf /tmp/caddy
COPY --from=build /repo/apps/${APP}/dist /srv
EXPOSE 80

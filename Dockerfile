# ---- Build ----
FROM oven/bun:1 AS build
WORKDIR /app

# Dependências primeiro (aproveita cache de layer)
COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile

# Código-fonte e build de produção (saída em .output/)
COPY . .
# Garante saída node-server mesmo com o build rodando sob bun
ENV NITRO_PRESET=node-server
RUN bun run build

# ---- Runtime ----
# O build do TanStack Start + Nitro (preset node-server) gera um servidor SSR
# pronto em .output/server/index.mjs — serve a app e os assets estáticos.
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0

COPY --from=build /app/.output ./.output

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]

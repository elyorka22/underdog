FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY apps/api/package.json ./apps/api/

RUN npm ci --workspace=@underdog/api --include-workspace-root=false

COPY packages/shared ./packages/shared
COPY packages/db ./packages/db
COPY apps/api ./apps/api

ENV NODE_ENV=production
ENV API_PORT=4000
EXPOSE 4000
CMD ["npm", "run", "start", "-w", "@underdog/api"]

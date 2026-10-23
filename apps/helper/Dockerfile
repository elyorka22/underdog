FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY apps/helper/package.json ./apps/helper/

RUN npm ci --workspace=@underdog/helper --include-workspace-root=false

COPY packages/shared ./packages/shared
COPY packages/db ./packages/db
COPY apps/helper ./apps/helper

ENV NODE_ENV=production
CMD ["npm", "run", "start", "-w", "@underdog/helper"]

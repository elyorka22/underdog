FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/bot/package.json ./apps/bot/

RUN npm ci --workspace=@underdog/bot --include-workspace-root=false

COPY packages/shared ./packages/shared
COPY apps/bot ./apps/bot

ENV NODE_ENV=production
CMD ["npm", "run", "start", "-w", "@underdog/bot"]

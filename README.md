# UnderDog

Поиск Telegram-каналов и групп: сайт + API + бот + helper-автосбор.

## Стек

- `apps/web` — Next.js сайт
- `apps/api` — Express API (Postgres или seed fallback)
- `apps/bot` — Telegram-бот (grammY)
- `apps/helper` — воркер автосбора публичных каналов/групп
- `packages/shared` — seed + общая логика
- `packages/db` — Postgres schema, каталог, очередь candidates
- DigitalOcean Droplet — Docker Compose

## Локальный запуск (без Docker БД)

Без `DATABASE_URL` API работает на seed-данных:

```bash
cp .env.example .env
npm install
npm run start:api
npm run dev:web
```

## Запуск с Postgres + helper

```bash
cp .env.example .env
npm install
docker compose up -d db
# дождитесь healthy, затем:
export DATABASE_URL=postgres://underdog:underdog@localhost:5432/underdog
npm run db:migrate
npm run db:seed
npm run start:api
npm run start:helper   # или: npm run once -w @underdog/helper
npm run dev:web
```

Добавить username в очередь:

```bash
curl -X POST http://localhost:4000/api/helper/candidates \
  -H "Content-Type: application/json" \
  -H "x-admin-token: change-me-admin-token" \
  -d '{"usernames":["durov","telegram"]}'
```

## Деплой на DigitalOcean Droplet

```bash
git clone https://github.com/elyorka22/underdog.git
cd underdog
cp .env.example .env
nano .env   # IP, BOT_TOKEN, ADMIN_TOKEN, POSTGRES_PASSWORD
```

Сайт + API + БД:

```bash
docker compose up -d --build db api web
```

Helper:

```bash
docker compose --profile helper up -d --build helper
```

Бот:

```bash
docker compose --profile bot up -d --build bot
```

Проверка:

- http://IP:3000 — сайт
- http://IP:4000/health — `"database": true`

## Как работает helper

### Автопоиск (полноценный)

Нужен **user-аккаунт** Telegram (не бот):

1. Получите `api_id` / `api_hash` на https://my.telegram.org  
2. Создайте сессию:

```bash
export TELEGRAM_API_ID=...
export TELEGRAM_API_HASH=...
npm run login -w @underdog/helper
# вставьте TELEGRAM_SESSION=... в .env
```

3. Запустите helper — он сам крутит ключевые слова (uz/ru/en) и ищет через:
   - `contacts.search`
   - `messages.searchGlobal` (каналы и группы)
   - `channels.getChannelRecommendations`

Найденные публичные `@username` попадают в очередь `candidates`.

### Обработка очереди

1. Берёт `pending` username из `candidates`
2. Тянет метаданные (Bot API или `t.me` preview)
3. Пишет в `communities`
4. Достаёт `@mentions` из описаний → снова в очередь
5. Паузы `HELPER_DELAY_MS` + обработка FloodWait

Только публичные каналы/группы. Без `TELEGRAM_SESSION` остаётся режим mentions/ручной очереди.

> Используйте отдельный аккаунт, не спамьте запросами — иначе Telegram ограничит поиск.

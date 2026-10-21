# Underdog

Поиск Telegram-каналов и групп: сайт + API + бот.  
Сервис-помощник для автосбора — отдельным этапом.

## Стек

- `apps/web` — Next.js сайт
- `apps/api` — Express API
- `apps/bot` — Telegram-бот (grammY)
- `packages/shared` — общий каталог и логика поиска
- DigitalOcean Droplet — Docker Compose

Сейчас данные — seed-каталог (демо).

## Локальный запуск

```bash
cp .env.example .env
npm install
npm run start -w @underdog/api
npm run dev -w @underdog/web
```

- Сайт: http://localhost:3000  
- API: http://localhost:4000/health  

Бот:

```bash
# BOT_TOKEN в .env
npm run dev:bot
```

## Деплой на DigitalOcean Droplet

Нужен Droplet с Ubuntu 22.04+, Docker и Docker Compose.

### 1. На сервере

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-v2 git
sudo usermod -aG docker $USER
# перелогиньтесь, чтобы группа docker применилась
```

### 2. Клон и env

```bash
git clone https://github.com/elyorka22/underdog.git
cd underdog
cp .env.example .env
nano .env
```

В `.env` замените `YOUR_DROPLET_IP` на публичный IP (или домен):

```env
WEB_URL=http://YOUR_DROPLET_IP:3000
NEXT_PUBLIC_API_URL=http://YOUR_DROPLET_IP:4000
CORS_ORIGIN=http://YOUR_DROPLET_IP:3000
```

Откройте порты в firewall / DO Cloud Firewall: `3000`, `4000` (и `22`).

### 3. Запуск сайта + API

```bash
docker compose up -d --build api web
```

Проверка:

- http://YOUR_DROPLET_IP:3000 — сайт  
- http://YOUR_DROPLET_IP:4000/health — API  

### 4. Бот (опционально)

```bash
# в .env: BOT_TOKEN=... и ADMIN_CHAT_ID=ваш_chat_id
docker compose --profile bot up -d --build bot
```

`ADMIN_CHAT_ID` — числовой ID вашего чата с ботом. Только этому чату видна кнопка «Админ» и команда `/admin` (статистика).

### Полезные команды

```bash
docker compose logs -f web api
docker compose ps
docker compose down
```

## Основные сценарии

- Поиск по тексту, типу (канал/группа), категории
- Карточка сообщества со ссылкой в Telegram
- Бот: кнопки «Поиск», «Категории», «Популярное», «Сайт» + текстовый поиск

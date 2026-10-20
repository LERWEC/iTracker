# iTracker

Учебный трекер задач: Fastify + Postgres + Vue.

## Что нужно

- Node 24
- Docker (Postgres)

## Первый запуск

```bash
cp .env.example .env
```

В `.env` задай `JWT_SECRET` (любая длинная строка).

```bash
docker compose up -d
npm install
npm install --prefix server
npm install --prefix web
npm run migrate
```

## Разработка

Оба сразу (сервер `:3000`, фронт `:5173`):

```bash
npm run dev
```

По отдельности:

```bash
npm run dev:server
npm run dev:web
```

Фронт ходит на API через прокси `/api` → `127.0.0.1:3000`.

## Скрипты

| Команда | Что делает |
| --- | --- |
| `npm run dev` | сервер и фронт вместе |
| `npm run dev:server` | только API |
| `npm run dev:web` | только Vite |
| `npm run migrate` | накатить миграции |
| `npm run format` | oxfmt |

Открой [http://localhost:5173](http://localhost:5173).

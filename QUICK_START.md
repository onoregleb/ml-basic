# 🚀 Быстрый запуск проекта

Интерактивный курс машинного обучения с симуляторами.

## Требования
- Python 3.8+
- Node.js 18+
- npm

## Установка и запуск

### 1. Установка зависимостей

**Backend:**
```bash
cd backend
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Инициализация базы данных
```bash
cd backend
python init_db.py
```

### 3. Запуск приложения

**Backend (терминал 1):**
```bash
cd backend
uvicorn main:app --reload --port 8000
```

**Frontend (терминал 2):**
```bash
cd frontend
npm run dev
```

## Доступ к приложению

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API документация:** http://localhost:8000/docs

## Docker (деплой “как на компьютере”)

В корне проекта есть `docker-compose.yml`.

### Запуск

```bash
docker compose up -d --build
```

Откройте:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000

### Инициализация БД (один раз, вручную)

Сидинг уроков сейчас делает `init_db.py` (он очищает и пересоздаёт данные), поэтому запускайте его **по необходимости**:

```bash
docker compose run --rm backend python init_db.py
```

### Ограничения ресурсов

В `docker-compose.yml` уже заданы лимиты под сервер **4 vCPU / 8GB RAM** (backend ~3 CPU/6GB, frontend ~1 CPU/2GB).

## Проверка финального проекта через GigaChat (опционально)

Чтобы работала кнопка проверки проекта в уроке 9, добавьте в `backend/.env`:

```env
# вариант 1 (рекомендуется): готовый base64 "Authorization key" из документации
GIGACHAT_AUTHORIZATION_KEY=YTczYzFj...==

# вариант 2: client_id + client_secret (код сам соберёт Basic)
# GIGACHAT_CLIENT_ID=...
# GIGACHAT_CLIENT_SECRET=...

# опционально:
GIGACHAT_SCOPE=GIGACHAT_API_PERS
GIGACHAT_MODEL=GigaChat-Pro
GIGACHAT_VERIFY_SSL=true
# если получаете CERTIFICATE_VERIFY_FAILED, варианты:
# - быстро (не рекомендуется для продакшена): GIGACHAT_VERIFY_SSL=false
# - правильно: укажите путь к CA bundle/сертификату:
#   GIGACHAT_CA_BUNDLE=C:\\path\\to\\ca-bundle.pem
```

Затем перезапустите backend.


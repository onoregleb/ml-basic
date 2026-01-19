# Демо чат-ботов/симуляторов/AI-ассистента

## 1) Что именно демонстрируем

В проекте реализованы интерактивные симуляторы ML (backend API + frontend визуализация) и **AI‑помощник для проверки финального проекта** (опционально, через GigaChat).

## 2) Ссылка на демо

TODO — вставьте ссылку на видео/диск/YouTube (или запись экрана).

## 3) Инструкция запуска (локально)

Источник: `QUICK_START.md`.

### Backend

1. `cd backend`
2. `pip install -r requirements.txt`
3. `python init_db.py`
4. `uvicorn main:app --reload --port 8000`

### Frontend

1. `cd frontend`
2. `npm install`
3. `npm run dev`
4. Открыть `http://localhost:3000`

## 4) Что показать в демо (скрипт)

### A) Симуляторы (web UI)

- зайти в курс, открыть уроки 1–9 и показать встроенные симуляторы (графики/интерактив);
- подчеркнуть, что вычисления идут через API (`/api/ml/*`), результаты отображаются Plotly.

### B) API‑демо симуляторов (Swagger)

- открыть `http://localhost:8000/docs` (Swagger)
- показать эндпоинты симуляторов:
  - `POST /api/ml/linear-regression`
  - `POST /api/ml/logistic-regression`
  - `POST /api/ml/knn-classification`
  - `POST /api/ml/kmeans-clustering`
  - `GET /api/ml/metrics-comparison`
  - `POST /api/ml/overfitting`
  - `POST /api/ml/customer-segmentation`

## 5) AI‑инструмент в продукте

Использован AI‑инструмент — **GigaChat** для проверки и рецензирования итогового проекта.

### Где в проекте

- API уроков: `backend/routers/lessons.py`
- эндпоинты проверки:
  - `POST /api/lessons/9/project/check` — проверка по текстовому описанию
  - `POST /api/lessons/9/project/check-upload` — проверка по `predictions.csv` (+ опционально код/отчёт) и выдача фидбека
- настройка: переменные окружения в `backend/.env` (см. `QUICK_START.md`)

## 6) Что приложить в качестве доказательств

Добавьте в папку/ссылку вместе с видео:
- скрин `Swagger` с эндпоинтами симуляторов
- скрин урока 9 (загрузка датасета/предсказаний)
- скрин результата AI‑рецензии (если есть ключ GigaChat)

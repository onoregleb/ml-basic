# ML Interactive Course

RU: Интерактивный курс по машинному обучению с теорией, прогрессом и симуляторами.

EN: An interactive machine learning course with theory, progress tracking, and simulators.

## 🚀 Технологии / Tech stack

- **Backend**: FastAPI + SQLAlchemy + PostgreSQL
- **Frontend**: Next.js 14 + TypeScript + TailwindCSS (+ Typography)
- **ML**: scikit-learn + numpy + pandas
- **Charts**: Plotly.js (+ react-plotly.js)

## 📁 Структура проекта / Project structure

```
├── backend/          # FastAPI server
├── frontend/         # Next.js app
├── PROJECT_COMPLETION_PLAN.md
└── QUICK_START.md
```

## 🔐 Аутентификация / Auth

RU: JWT-аутентификация реализована. **Важно:** `backend/routers/auth.py` содержит дефолтный `SECRET_KEY` — поменяйте его перед продакшеном.

EN: JWT auth is implemented. **Important:** `backend/routers/auth.py` has a default `SECRET_KEY` — change it before production.

## 🛠️ Установка и запуск / Install & run

### Backend

```bash
cd backend
pip install -r requirements.txt
python init_db.py
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

RU: Открыть `http://localhost:3000` (Frontend) и `http://localhost:8000/docs` (Swagger).

EN: Open `http://localhost:3000` (Frontend) and `http://localhost:8000/docs` (Swagger).

## 📚 Уроки / Lessons (9)

1. Введение в ML (симулятор типов задач)
2. Работа с данными (симулятор подготовки/визуализации)
3. Линейная регрессия (симулятор + метрики)
4. Логистическая регрессия (классификация)
5. kNN
6. Метрики качества (генерация сценариев + сравнение)
7. Переобучение (train/val error)
8. K-means
9. Мини‑проект: сегментация клиентов (интерактив)

## 🧾 Контент уроков / Lesson content rendering

RU: Контент хранится как текст в БД, но при запросе урока backend возвращает **sanitized HTML + TOC** (`content_html`, `toc`). Это улучшает отображение формул/кода и оглавления.

EN: Content is stored as text in DB, but lesson details return **sanitized HTML + TOC** (`content_html`, `toc`) to improve rendering and navigation.

## ⚠️ Важно / Notes

- **RU:** `python init_db.py` очищает и пересоздаёт уроки/вопросы (пересид). Используйте после правок `backend/init_db.py`.
- **EN:** `python init_db.py` clears and reseeds lessons/questions. Run it after changing `backend/init_db.py`.

## 🎯 Текущий статус / Status

- [x] Структура проекта / Project structure
- [x] Backend API (lessons + progress + simulators)
- [x] Frontend интерфейс (login/dashboard/lesson pages)
- [x] Интерактивные симуляторы (уроки 1–9)
- [x] Базовая система прогресса
- [ ] Квизы/викторины (проверка ответов + начисление баллов)
- [ ] Мини‑проект уровня “платформа” (скачивание данных, загрузка результатов, автопроверка/LLM)
- [ ] Тесты (unit/e2e)
- [ ] Деплой (Docker/CI-CD)

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


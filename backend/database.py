from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Database URL (по умолчанию — PostgreSQL).
# В Docker берите значение из переменной окружения DATABASE_URL (см. docker-compose.yml).
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://postgres:postgres@localhost:5432/ml_course",
)

# Создаем engine
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Создаем SessionLocal класс
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Создаем Base класс для моделей
Base = declarative_base()

# Dependency для получения DB сессии
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

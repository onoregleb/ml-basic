from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Database URL (defaults to local SQLite file).
# For Docker, set DATABASE_URL=sqlite:////data/ml_course.db and mount /data as a volume.
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ml_course.db")

# Создаем engine
connect_args = {}
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    # Нужно для SQLite
    connect_args = {"check_same_thread": False}

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)

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

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
import uvicorn

from database import get_db, engine
from models import Base
from routers import auth, lessons, ml_simulator
from schemas import Token

# Создаем таблицы
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ML Interactive Course API",
    description="API для интерактивного курса по машинному обучению",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Схема для логина через JSON
class LoginRequest(BaseModel):
    email: str
    password: str

# Подключаем роутеры
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(lessons.router, prefix="/api/lessons", tags=["lessons"])
app.include_router(ml_simulator.router, prefix="/api/ml", tags=["ml-simulator"])

# Исправленный эндпоинт для логина, принимающий JSON
@app.post("/api/auth/login")
async def login_alias(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Эндпоинт для логина, принимающий JSON данные"""
    from routers.auth import login_for_access_token
    from fastapi.security import OAuth2PasswordRequestForm
    
    # Создаем объект OAuth2PasswordRequestForm из JSON данных
    form_data = OAuth2PasswordRequestForm(
        username=login_data.email,  # OAuth2 использует username, но мы передаем email
        password=login_data.password
    )
    
    try:
        return await login_for_access_token(form_data, db)
    except HTTPException as e:
        # Перехватываем исключение и возвращаем более понятное сообщение
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": e.detail}
        )

# Добавляем эндпоинт для регистрации
@app.post("/api/auth/register")
async def register_alias(user_data: dict, db: Session = Depends(get_db)):
    """Алиас для /api/auth/register для совместимости с фронтендом"""
    from routers.auth import register
    from schemas import UserCreate
    
    # Создаем объект UserCreate из полученных данных
    user_create = UserCreate(
        email=user_data["email"],
        password=user_data["password"],
        full_name=user_data.get("username", user_data["email"])
    )
    
    return register(user_create, db)

@app.get("/")
async def root():
    return {"message": "ML Interactive Course API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
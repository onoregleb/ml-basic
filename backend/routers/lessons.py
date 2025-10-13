from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from database import get_db
from models import Lesson, User, UserProgress
from schemas import Lesson as LessonSchema, UserProgress as UserProgressSchema
from routers.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[LessonSchema])
def get_lessons(
    module_id: int = None,
    db: Session = Depends(get_db)
):
    """Получить список уроков (публичный эндпоинт)"""
    query = db.query(Lesson).filter(Lesson.is_active == True)
    
    if module_id:
        query = query.filter(Lesson.module_id == module_id)
    
    lessons = query.order_by(Lesson.order_index).all()
    return lessons

@router.get("/user/progress", response_model=List[UserProgressSchema])
def get_user_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить весь прогресс пользователя"""
    progress = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id
    ).all()
    return progress

@router.get("/{lesson_id}", response_model=LessonSchema)
def get_lesson(
    lesson_id: int,
    db: Session = Depends(get_db)
):
    """Получить конкретный урок (публичный эндпоинт)"""
    # Валидация lesson_id
    if lesson_id <= 0:
        raise HTTPException(status_code=400, detail="Invalid lesson ID")
    
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id, Lesson.is_active == True).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson

@router.post("/{lesson_id}/progress", response_model=UserProgressSchema)
def update_progress(
    lesson_id: int,
    status: str,
    score: float = 0.0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обновить прогресс по уроку"""
    # Валидация lesson_id
    if lesson_id <= 0:
        raise HTTPException(status_code=400, detail="Invalid lesson ID")
    
    # Проверяем, существует ли урок
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Проверяем существующий прогресс
    progress = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.lesson_id == lesson_id
    ).first()
    
    if progress:
        # Обновляем существующий прогресс
        progress.status = status
        progress.score = score
        if status == "completed":
            progress.completed_at = datetime.utcnow()
    else:
        # Создаем новый прогресс
        progress = UserProgress(
            user_id=current_user.id,
            lesson_id=lesson_id,
            status=status,
            score=score,
            completed_at=datetime.utcnow() if status == "completed" else None
        )
        db.add(progress)
    
    db.commit()
    db.refresh(progress)
    return progress

@router.get("/{lesson_id}/progress", response_model=UserProgressSchema)
def get_lesson_progress(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить прогресс по конкретному уроку"""
    # Валидация lesson_id
    if lesson_id <= 0:
        raise HTTPException(status_code=400, detail="Invalid lesson ID")
    
    progress = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.lesson_id == lesson_id
    ).first()
    
    if not progress:
        # Возвращаем базовый прогресс, если его нет
        return UserProgressSchema(
            id=0,
            user_id=current_user.id,
            lesson_id=lesson_id,
            status="not_started",
            score=0.0,
            completed_at=None
        )
    
    return progress


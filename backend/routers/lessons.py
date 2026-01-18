from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from database import get_db
from models import Lesson, User, UserProgress
from schemas import (
    Lesson as LessonSchema,
    LessonDetail as LessonDetailSchema,
    LessonTocItem,
    ProjectCheckRequest,
    ProjectCheckResponse,
    ProjectCheckResult,
    ProjectRubric,
    UserProgress as UserProgressSchema,
)
from routers.auth import get_current_user
from markdown_utils import markdown_to_sanitized_html
from gigachat_client import GigaChatClient, GigaChatError, load_gigachat_config

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

@router.get("/{lesson_id}", response_model=LessonDetailSchema)
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

    content_html, toc = markdown_to_sanitized_html(lesson.content)
    toc_items = [LessonTocItem(level=i.level, text=i.text, id=i.id) for i in toc]

    # Return all base lesson fields + rendered HTML.
    return {
        "id": lesson.id,
        "title": lesson.title,
        "description": lesson.description,
        "content": lesson.content,  # keep for backward compatibility
        "lesson_type": lesson.lesson_type,
        "order_index": lesson.order_index,
        "module_id": lesson.module_id,
        "is_active": lesson.is_active,
        "content_html": content_html,
        "toc": toc_items,
    }

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


def _extract_project_assignment(content: str) -> str:
    """
    Extract the 'Задание (сдача проекта)' block from seeded markdown to keep prompt short.
    Falls back to a short generic assignment when not found.
    """
    if not content:
        return "Сдай проект: краткий отчёт по сегментации клиентов и рекомендациям."

    marker = "## ✅ Задание"
    start = content.find(marker)
    if start == -1:
        return "Сдай проект: краткий отчёт по сегментации клиентов и рекомендациям."

    # Try to cut at the next horizontal rule or heading to keep context bounded
    tail = content[start:]
    cut_candidates = []
    hr = tail.find("\n---")
    if hr != -1:
        cut_candidates.append(hr)
    next_h2 = tail.find("\n## ", len(marker))
    if next_h2 != -1:
        cut_candidates.append(next_h2)

    end = min(cut_candidates) if cut_candidates else len(tail)
    return tail[:end].strip()


@router.post("/{lesson_id}/project/check", response_model=ProjectCheckResponse)
def check_project_submission(
    lesson_id: int,
    payload: ProjectCheckRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Проверка финального проекта через GigaChat (для lesson_id=9).
    Возвращает оценку и фидбек; при passed=true обновляет прогресс урока.
    """
    if lesson_id <= 0:
        raise HTTPException(status_code=400, detail="Invalid lesson ID")

    lesson = db.query(Lesson).filter(Lesson.id == lesson_id, Lesson.is_active == True).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    if lesson_id != 9:
        raise HTTPException(status_code=400, detail="Project check is available only for the final project lesson")

    submission_text = (payload.submission_text or "").strip()
    if len(submission_text) < 50:
        raise HTTPException(status_code=400, detail="Submission is too short (min 50 characters)")

    cfg = load_gigachat_config()
    if cfg is None:
        return ProjectCheckResponse(
            ok=False,
            error="GigaChat credentials are not configured. Set GIGACHAT_CLIENT_ID and GIGACHAT_CLIENT_SECRET.",
        )

    client = GigaChatClient(cfg)
    assignment_text = _extract_project_assignment(lesson.content)

    try:
        grading = client.grade_project_submission(assignment_text=assignment_text, submission_text=submission_text)
    except GigaChatError as e:
        return ProjectCheckResponse(ok=False, error=str(e))
    except Exception as e:
        return ProjectCheckResponse(ok=False, error=f"Unexpected error: {e}")

    parsed = grading.get("parsed")
    model_text = grading.get("text") or None

    result: ProjectCheckResult | None = None
    if isinstance(parsed, dict):
        try:
            rubric_dict = parsed.get("rubric") or {}
            rubric = ProjectRubric(
                data_and_features=int(rubric_dict.get("data_and_features", 0)),
                model_choice=int(rubric_dict.get("model_choice", 0)),
                k_selection=int(rubric_dict.get("k_selection", 0)),
                segment_interpretation=int(rubric_dict.get("segment_interpretation", 0)),
                business_recommendations=int(rubric_dict.get("business_recommendations", 0)),
            )
            score = int(parsed.get("score", 0))
            passed = bool(parsed.get("passed", score >= 70))

            result = ProjectCheckResult(
                score=max(0, min(100, score)),
                passed=passed,
                summary=str(parsed.get("summary", ""))[:2000],
                strengths=[str(x) for x in (parsed.get("strengths") or [])][:20],
                improvements=[str(x) for x in (parsed.get("improvements") or [])][:20],
                rubric=rubric,
            )
        except Exception:
            result = None

    # Update progress for this lesson
    try:
        score_for_progress = float(result.score) if result else 0.0
        status_for_progress = "completed" if (result and result.passed) else "in_progress"

        progress = db.query(UserProgress).filter(
            UserProgress.user_id == current_user.id,
            UserProgress.lesson_id == lesson_id,
        ).first()

        if progress:
            progress.status = status_for_progress
            progress.score = score_for_progress
            if status_for_progress == "completed":
                progress.completed_at = datetime.utcnow()
        else:
            progress = UserProgress(
                user_id=current_user.id,
                lesson_id=lesson_id,
                status=status_for_progress,
                score=score_for_progress,
                completed_at=datetime.utcnow() if status_for_progress == "completed" else None,
            )
            db.add(progress)

        db.commit()
    except Exception:
        # Never fail the grading response due to progress update issues
        db.rollback()

    return ProjectCheckResponse(ok=True, result=result, model_text=model_text)


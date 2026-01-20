from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

import pandas as pd
from sklearn.metrics import r2_score, mean_squared_error

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
    RegressionProjectCheckResponse,
    RegressionProjectMetrics,
    UserProgress as UserProgressSchema,
)
from routers.auth import get_current_user
from markdown_utils import markdown_to_sanitized_html
from gigachat_client import GigaChatClient, GigaChatError, load_gigachat_config
from project_regression import generate_regression_project_data

router = APIRouter()

# Важно: FastAPI по умолчанию редиректит со `/api/lessons` на `/api/lessons/`.
# Если backend запущен в Docker, редирект может содержать Location вида `http://backend:8000/...`,
# и браузер (внешний клиент) попытается открыть `backend:8000` напрямую → "Failed to fetch".
# Поэтому делаем явный алиас без завершающего слеша.
@router.get("", response_model=List[LessonSchema])
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
        return "Сдай проект: реши задачу регрессии по предоставленным данным и загрузите predictions.csv и код."

    marker = "## ✅ Задание"
    start = content.find(marker)
    if start == -1:
        return "Сдай проект: реши задачу регрессии по предоставленным данным и загрузите predictions.csv и код."

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

    result = None  # type: ProjectCheckResult | None
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


@router.get("/{lesson_id}/project/dataset/{split}")
def download_project_dataset(
    lesson_id: int,
    split: str,
    current_user: User = Depends(get_current_user),
):
    """
    Скачать датасет для финального проекта (регрессия).
    split: train | test
    """
    if lesson_id != 9:
        raise HTTPException(status_code=400, detail="Dataset is available only for the final project lesson")
    if split not in {"train", "test"}:
        raise HTTPException(status_code=400, detail="Invalid split. Use train or test.")

    data = generate_regression_project_data(current_user.id)
    df = data.train if split == "train" else data.test
    csv_text = df.to_csv(index=False)

    filename = f"lesson{lesson_id}_{split}.csv"
    return Response(
        content=csv_text,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/{lesson_id}/project/check-upload", response_model=RegressionProjectCheckResponse)
async def check_project_submission_upload(
    lesson_id: int,
    predictions: UploadFile = File(...),
    code: UploadFile = File(None),
    report_text: str = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Проверка проекта регрессии:
    - predictions.csv обязателен (columns: id, y_pred)
    - code/report опциональны (для LLM-рекомендаций)
    """
    if lesson_id != 9:
        raise HTTPException(status_code=400, detail="Project check is available only for the final project lesson")

    lesson = db.query(Lesson).filter(Lesson.id == lesson_id, Lesson.is_active == True).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    if not predictions.filename:
        raise HTTPException(status_code=400, detail="predictions file is required")

    # Read predictions
    raw_pred = await predictions.read()
    if len(raw_pred) > 2_000_000:
        raise HTTPException(status_code=400, detail="predictions file is too large (max 2MB)")

    try:
        from io import BytesIO
        pred_df = pd.read_csv(BytesIO(raw_pred))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cannot read predictions CSV: {e}")

    if "id" not in pred_df.columns or "y_pred" not in pred_df.columns:
        raise HTTPException(status_code=400, detail="predictions.csv must contain columns: id, y_pred")

    pred_df = pred_df[["id", "y_pred"]].copy()
    pred_df["id"] = pd.to_numeric(pred_df["id"], errors="coerce")
    pred_df["y_pred"] = pd.to_numeric(pred_df["y_pred"], errors="coerce")
    pred_df = pred_df.dropna(subset=["id", "y_pred"])
    pred_df["id"] = pred_df["id"].astype(int)

    data = generate_regression_project_data(current_user.id)
    y_true_df = data.test_labels.copy()

    merged = y_true_df.merge(pred_df, on="id", how="left")
    n_test = int(len(y_true_df))
    n_pred = int(pred_df["id"].nunique())

    if merged["y_pred"].isna().any():
        missing = int(merged["y_pred"].isna().sum())
        return RegressionProjectCheckResponse(
            ok=False,
            passed=False,
            score=0,
            error=f"Missing predictions for {missing} test rows. Ensure predictions.csv contains all test ids.",
        )

    y_true = merged["y"].to_numpy()
    y_pred = merged["y_pred"].to_numpy()
    r2 = float(r2_score(y_true, y_pred))
    rmse = float(mean_squared_error(y_true, y_pred) ** 0.5)

    # Metric-based score (0..100). R2 below 0 -> 0 score.
    metric_score = int(max(0.0, min(1.0, r2)) * 100.0)
    passed = r2 >= 0.70

    metrics = RegressionProjectMetrics(r2=r2, rmse=rmse, n_test=n_test, n_pred=n_pred)

    # LLM feedback (optional)
    llm_resp = None  # type: ProjectCheckResponse | None
    cfg = load_gigachat_config()
    if cfg is not None:
        artifacts_parts: list[str] = []
        if report_text:
            artifacts_parts.append("REPORT_TEXT:\n" + str(report_text))
        if code is not None and code.filename:
            raw_code = await code.read()
            if len(raw_code) <= 200_000:
                try:
                    artifacts_parts.append(f"CODE_FILE ({code.filename}):\n" + raw_code.decode("utf-8", errors="replace"))
                except Exception:
                    artifacts_parts.append(f"CODE_FILE ({code.filename}): <binary or unreadable>")
            else:
                artifacts_parts.append(f"CODE_FILE ({code.filename}): <too large, {len(raw_code)} bytes>")

        artifacts_text = "\n\n".join(artifacts_parts) or "<no artifacts provided>"
        assignment_text = _extract_project_assignment(lesson.content)
        metrics_text = f"R2={r2:.4f}, RMSE={rmse:.4f}, passed_by_metric={passed}, metric_score={metric_score}"

        try:
            client = GigaChatClient(cfg)
            grading = client.review_regression_submission(
                assignment_text=assignment_text,
                metrics_text=metrics_text,
                artifacts_text=artifacts_text[:40_000],
            )
            parsed = grading.get("parsed")
            model_text = grading.get("text") or None
            if isinstance(parsed, dict):
                # Reuse existing parsing path with ProjectCheckResponse shape
                try:
                    rubric_dict = parsed.get("rubric") or {}
                    rubric = ProjectRubric(
                        data_and_features=int(rubric_dict.get("data_and_features", 0)),
                        model_choice=int(rubric_dict.get("model_choice", 0)),
                        k_selection=int(rubric_dict.get("k_selection", 0)),
                        segment_interpretation=int(rubric_dict.get("segment_interpretation", 0)),
                        business_recommendations=int(rubric_dict.get("business_recommendations", 0)),
                    )
                    score_llm = int(parsed.get("score", metric_score))
                    passed_llm = bool(parsed.get("passed", passed))
                    result = ProjectCheckResult(
                        score=max(0, min(100, score_llm)),
                        passed=passed_llm,
                        summary=str(parsed.get("summary", ""))[:2000],
                        strengths=[str(x) for x in (parsed.get("strengths") or [])][:20],
                        improvements=[str(x) for x in (parsed.get("improvements") or [])][:20],
                        rubric=rubric,
                    )
                    llm_resp = ProjectCheckResponse(ok=True, result=result, model_text=model_text)
                except Exception:
                    llm_resp = ProjectCheckResponse(ok=True, result=None, model_text=model_text)
            else:
                llm_resp = ProjectCheckResponse(ok=True, result=None, model_text=model_text)
        except GigaChatError as e:
            llm_resp = ProjectCheckResponse(ok=False, error=str(e))
        except Exception as e:
            llm_resp = ProjectCheckResponse(ok=False, error=f"Unexpected error: {e}")

    # Update progress: use metric_score and pass flag
    try:
        status_for_progress = "completed" if passed else "in_progress"
        progress = db.query(UserProgress).filter(
            UserProgress.user_id == current_user.id,
            UserProgress.lesson_id == lesson_id,
        ).first()

        if progress:
            progress.status = status_for_progress
            progress.score = float(metric_score)
            if status_for_progress == "completed":
                progress.completed_at = datetime.utcnow()
        else:
            progress = UserProgress(
                user_id=current_user.id,
                lesson_id=lesson_id,
                status=status_for_progress,
                score=float(metric_score),
                completed_at=datetime.utcnow() if status_for_progress == "completed" else None,
            )
            db.add(progress)
        db.commit()
    except Exception:
        db.rollback()

    return RegressionProjectCheckResponse(
        ok=True,
        passed=passed,
        score=metric_score,
        metrics=metrics,
        llm=llm_resp,
        error=None,
    )


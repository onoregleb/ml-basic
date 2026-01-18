from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Auth schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Lesson schemas
class LessonBase(BaseModel):
    title: str
    description: Optional[str] = None
    content: str
    lesson_type: str
    order_index: int
    module_id: int

class LessonCreate(LessonBase):
    pass

class Lesson(LessonBase):
    id: int
    is_active: bool
    
    class Config:
        from_attributes = True

# Lesson detail (rich content)
class LessonTocItem(BaseModel):
    level: int
    text: str
    id: str

class LessonDetail(Lesson):
    # Sanitized HTML ready for rendering on the frontend
    content_html: str
    toc: List[LessonTocItem] = []

# Question schemas
class QuestionBase(BaseModel):
    question_text: str
    question_type: str
    options: Optional[str] = None
    correct_answer: str
    points: int

class QuestionCreate(QuestionBase):
    lesson_id: int

class Question(QuestionBase):
    id: int
    lesson_id: int
    
    class Config:
        from_attributes = True

# Progress schemas
class UserProgressBase(BaseModel):
    status: str
    score: float

class UserProgressCreate(UserProgressBase):
    user_id: int
    lesson_id: int

class UserProgress(UserProgressBase):
    id: int
    user_id: int
    lesson_id: int
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Submission schemas
class SubmissionBase(BaseModel):
    answer: str

class SubmissionCreate(SubmissionBase):
    user_id: int
    question_id: int

class Submission(SubmissionBase):
    id: int
    user_id: int
    question_id: int
    is_correct: Optional[bool] = None
    submitted_at: datetime
    
    class Config:
        from_attributes = True

# ML Simulator schemas
class LinearRegressionParams(BaseModel):
    slope: float
    intercept: float
    noise_level: float = 0.1
    n_points: int = 50

class LinearRegressionResponse(BaseModel):
    x: List[float]
    y: List[float]
    predicted_y: List[float]
    mse: float
    r2: float

# Classification schemas
class ClassificationParams(BaseModel):
    n_samples: int = 200
    n_features: int = 2
    n_classes: int = 2
    noise: float = 0.1
    random_state: int = 42

class ClassificationResponse(BaseModel):
    x: List[List[float]]
    y: List[int]
    x_train: List[List[float]]
    y_train: List[int]
    x_test: List[List[float]]
    y_test: List[int]
    y_pred: List[int]
    accuracy: float
    precision: float
    recall: float
    f1: float
    decision_boundary: Optional[List[List[float]]] = None
    probabilities: Optional[List[List[float]]] = None

# Clustering schemas
class ClusteringParams(BaseModel):
    n_samples: int = 300
    n_features: int = 2
    n_clusters: int = 3
    cluster_std: float = 1.0
    random_state: int = 42

class ClusteringResponse(BaseModel):
    x: List[List[float]]
    labels: List[int]
    centroids: List[List[float]]
    silhouette_score: float
    wcss: float

# Overfitting simulator schemas
class OverfittingParams(BaseModel):
    n_samples: int = 120
    noise: float = 0.3
    max_degree: int = 12
    alpha: float = 0.0  # Ridge regularization strength
    test_size: float = 0.3
    random_state: int = 42
    selected_degree: int = 6

class OverfittingResponse(BaseModel):
    degrees: List[int]
    train_mse: List[float]
    val_mse: List[float]
    x_train: List[float]
    y_train: List[float]
    x_val: List[float]
    y_val: List[float]
    x_curve: List[float]
    y_true_curve: List[float]
    y_pred_curve: List[float]
    selected_degree: int

# Customer segmentation simulator schemas
class CustomerSegmentationParams(BaseModel):
    n_customers: int = 300
    n_clusters: int = 4
    noise: float = 0.25
    random_state: int = 42

class ClusterProfile(BaseModel):
    cluster: int
    size: int
    avg_age: float
    avg_total_spent: float
    avg_frequency: float
    avg_recency: float

class CustomerSegmentationResponse(BaseModel):
    points_2d: List[List[float]]
    labels: List[int]
    centroids_2d: List[List[float]]
    profiles: List[ClusterProfile]


# Project checking (GigaChat) schemas
class ProjectCheckRequest(BaseModel):
    submission_text: str


class ProjectRubric(BaseModel):
    data_and_features: int
    model_choice: int
    k_selection: int
    segment_interpretation: int
    business_recommendations: int


class ProjectCheckResult(BaseModel):
    score: int
    passed: bool
    summary: str
    strengths: List[str] = []
    improvements: List[str] = []
    rubric: ProjectRubric


class ProjectCheckResponse(BaseModel):
    ok: bool
    result: Optional[ProjectCheckResult] = None
    model_text: Optional[str] = None  # raw assistant message (fallback)
    error: Optional[str] = None


class RegressionProjectMetrics(BaseModel):
    r2: float
    rmse: float
    n_test: int
    n_pred: int


class RegressionProjectCheckResponse(BaseModel):
    ok: bool
    passed: bool
    score: int
    metrics: Optional[RegressionProjectMetrics] = None
    llm: Optional[ProjectCheckResponse] = None
    error: Optional[str] = None
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
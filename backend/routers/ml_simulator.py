from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import numpy as np
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.cluster import KMeans
from sklearn.metrics import mean_squared_error, r2_score, accuracy_score, precision_score, recall_score, f1_score
from sklearn.model_selection import train_test_split
from sklearn.datasets import make_classification, make_blobs
import json

from database import get_db
from models import User
from schemas import LinearRegressionParams, LinearRegressionResponse, ClassificationParams, ClassificationResponse, ClusteringParams, ClusteringResponse
from routers.auth import get_current_user

router = APIRouter()

@router.post("/linear-regression", response_model=LinearRegressionResponse)
async def linear_regression_simulator(
    params: LinearRegressionParams,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Симулятор линейной регрессии
    
    Генерирует данные с заданными параметрами и обучает модель
    """
    # Генерируем данные
    np.random.seed(42)  # Для воспроизводимости
    
    # Создаем x координаты
    x = np.linspace(0, 10, params.n_points)
    
    # Генерируем y с заданными параметрами и шумом
    y_true = params.slope * x + params.intercept
    noise = np.random.normal(0, params.noise_level, params.n_points)
    y = y_true + noise
    
    # Обучаем модель
    X = x.reshape(-1, 1)
    model = LinearRegression()
    model.fit(X, y)
    
    # Получаем предсказания
    y_pred = model.predict(X)
    
    # Вычисляем метрики
    mse = mean_squared_error(y, y_pred)
    r2 = r2_score(y, y_pred)
    
    return LinearRegressionResponse(
        x=x.tolist(),
        y=y.tolist(),
        predicted_y=y_pred.tolist(),
        mse=float(mse),
        r2=float(r2)
    )

@router.get("/linear-regression/example")
async def get_linear_regression_example(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Получить пример данных для демонстрации
    """
    # Простой пример с небольшим количеством точек
    x = [1, 2, 3, 4, 5]
    y = [2.1, 3.9, 6.1, 7.8, 10.2]
    
    # Обучаем модель
    X = np.array(x).reshape(-1, 1)
    model = LinearRegression()
    model.fit(X, y)
    
    # Получаем предсказания
    y_pred = model.predict(X)
    
    # Вычисляем метрики
    mse = mean_squared_error(y, y_pred)
    r2 = r2_score(y, y_pred)
    
    return LinearRegressionResponse(
        x=x,
        y=y,
        predicted_y=y_pred.tolist(),
        mse=float(mse),
        r2=float(r2)
    )

@router.post("/linear-regression/interactive")
async def interactive_linear_regression(
    slope: float,
    intercept: float,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Интерактивная настройка параметров линейной регрессии
    
    Позволяет пользователю изменять slope и intercept в реальном времени
    """
    # Генерируем данные
    np.random.seed(42)
    x = np.linspace(0, 10, 50)
    y_true = slope * x + intercept
    noise = np.random.normal(0, 0.5, 50)
    y = y_true + noise
    
    # Создаем линию с заданными параметрами
    y_line = slope * x + intercept
    
    return {
        "x": x.tolist(),
        "y": y.tolist(),
        "y_line": y_line.tolist(),
        "slope": slope,
        "intercept": intercept
    }

@router.post("/logistic-regression", response_model=ClassificationResponse)
async def logistic_regression_simulator(
    params: ClassificationParams,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Симулятор логистической регрессии для бинарной классификации
    """
    # Генерируем данные
    X, y = make_classification(
        n_samples=params.n_samples,
        n_features=params.n_features,
        n_classes=params.n_classes,
        n_redundant=0,
        n_informative=params.n_features,
        noise=params.noise,
        random_state=params.random_state
    )

    # Разделяем данные
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.3, random_state=params.random_state
    )

    # Обучаем модель
    model = LogisticRegression(
        random_state=params.random_state,
        solver='liblinear',  # Стабильный solver для небольших датасетов
        max_iter=1000       # Увеличиваем количество итераций
    )
    model.fit(X_train, y_train)

    # Получаем предсказания
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)

    # Вычисляем метрики с обработкой исключений
    try:
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
        recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
        f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
    except Exception as e:
        print(f"Ошибка при вычислении метрик: {e}")
        accuracy = 0.0
        precision = 0.0
        recall = 0.0
        f1 = 0.0

    # Создаем сетку для границы решений (только для 2D)
    decision_boundary = None
    try:
        if params.n_features == 2:
            x_min, x_max = X[:, 0].min() - 0.5, X[:, 0].max() + 0.5
            y_min, y_max = X[:, 1].min() - 0.5, X[:, 1].max() + 0.5
            
            # Уменьшаем сетку для производительности
            xx, yy = np.meshgrid(np.linspace(x_min, x_max, 50),
                               np.linspace(y_min, y_max, 50))

            Z = model.predict(np.c_[xx.ravel(), yy.ravel()])
            Z = Z.reshape(xx.shape)

            decision_boundary = []
            for i in range(len(xx)):
                for j in range(len(xx[i])):
                    decision_boundary.append([float(xx[i, j]), float(yy[i, j]), int(Z[i, j])])
    except Exception as e:
        print(f"Ошибка при создании границы решений: {e}")
        decision_boundary = None

    return ClassificationResponse(
        x=X.tolist(),
        y=y.tolist(),
        x_train=X_train.tolist(),
        y_train=y_train.tolist(),
        x_test=X_test.tolist(),
        y_test=y_test.tolist(),
        y_pred=y_pred.tolist(),
        accuracy=float(accuracy),
        precision=float(precision),
        recall=float(recall),
        f1=float(f1),
        decision_boundary=decision_boundary,
        probabilities=y_proba.tolist()
    )

@router.post("/knn-classification", response_model=ClassificationResponse)
async def knn_classification_simulator(
    k: int = 5,
    params: ClassificationParams = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Симулятор kNN классификации
    """
    if params is None:
        params = ClassificationParams()

    # Генерируем данные
    X, y = make_classification(
        n_samples=params.n_samples,
        n_features=params.n_features,
        n_classes=params.n_classes,
        n_redundant=0,
        n_informative=params.n_features,
        noise=params.noise,
        random_state=params.random_state
    )

    # Разделяем данные
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.3, random_state=params.random_state
    )

    # Обучаем модель
    model = KNeighborsClassifier(n_neighbors=k)
    model.fit(X_train, y_train)

    # Получаем предсказания
    y_pred = model.predict(X_test)

    # Вычисляем метрики
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average='weighted')
    recall = recall_score(y_test, y_pred, average='weighted')
    f1 = f1_score(y_test, y_pred, average='weighted')

    # Создаем сетку для границы решений (только для 2D)
    if params.n_features == 2:
        x_min, x_max = X[:, 0].min() - 0.5, X[:, 0].max() + 0.5
        y_min, y_max = X[:, 1].min() - 0.5, X[:, 1].max() + 0.5
        xx, yy = np.meshgrid(np.linspace(x_min, x_max, 100),
                           np.linspace(y_min, y_max, 100))

        Z = model.predict(np.c_[xx.ravel(), yy.ravel()])
        Z = Z.reshape(xx.shape)

        decision_boundary = []
        for i in range(len(xx)):
            for j in range(len(xx[i])):
                decision_boundary.append([float(xx[i, j]), float(yy[i, j]), int(Z[i, j])])
    else:
        decision_boundary = None

    return ClassificationResponse(
        x=X.tolist(),
        y=y.tolist(),
        x_train=X_train.tolist(),
        y_train=y_train.tolist(),
        x_test=X_test.tolist(),
        y_test=y_test.tolist(),
        y_pred=y_pred.tolist(),
        accuracy=float(accuracy),
        precision=float(precision),
        recall=float(recall),
        f1=float(f1),
        decision_boundary=decision_boundary
    )

@router.post("/kmeans-clustering", response_model=ClusteringResponse)
async def kmeans_clustering_simulator(
    params: ClusteringParams,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Симулятор K-means кластеризации
    """
    # Генерируем данные
    X, y_true = make_blobs(
        n_samples=params.n_samples,
        n_features=params.n_features,
        centers=params.n_clusters,
        cluster_std=params.cluster_std,
        random_state=params.random_state
    )

    # Обучаем модель
    kmeans = KMeans(n_clusters=params.n_clusters, random_state=params.random_state, n_init=10)
    labels = kmeans.fit_predict(X)
    centroids = kmeans.cluster_centers_

    # Вычисляем метрики
    from sklearn.metrics import silhouette_score
    silhouette = silhouette_score(X, labels)
    wcss = kmeans.inertia_

    return ClusteringResponse(
        x=X.tolist(),
        labels=labels.tolist(),
        centroids=centroids.tolist(),
        silhouette_score=float(silhouette),
        wcss=float(wcss)
    )

@router.get("/metrics-comparison")
async def metrics_comparison_simulator(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Сравнение метрик качества на разных датасетах
    """
    # Создаем различные сценарии
    scenarios = []

    for i in range(3):
        # Генерируем сбалансированные данные
        X_balanced, y_balanced = make_classification(
            n_samples=200, n_features=2, n_classes=2,
            n_informative=2, n_redundant=0, n_clusters_per_class=1,
            weights=[0.5, 0.5], random_state=42 + i
        )

        # Генерируем несбалансированные данные
        X_imbalanced, y_imbalanced = make_classification(
            n_samples=200, n_features=2, n_classes=2,
            n_informative=2, n_redundant=0, n_clusters_per_class=1,
            weights=[0.9, 0.1], random_state=42 + i
        )

        # Обучаем простую модель
        model = LogisticRegression(random_state=42 + i)

        # Оцениваем на сбалансированных данных
        model.fit(X_balanced[:150], y_balanced[:150])
        y_pred_balanced = model.predict(X_balanced[150:])
        y_true_balanced = y_balanced[150:]

        acc_balanced = accuracy_score(y_true_balanced, y_pred_balanced)
        prec_balanced = precision_score(y_true_balanced, y_pred_balanced, zero_division=0)
        rec_balanced = recall_score(y_true_balanced, y_pred_balanced, zero_division=0)
        f1_balanced = f1_score(y_true_balanced, y_pred_balanced, zero_division=0)

        # Оцениваем на несбалансированных данных
        model.fit(X_imbalanced[:150], y_imbalanced[:150])
        y_pred_imbalanced = model.predict(X_imbalanced[150:])
        y_true_imbalanced = y_imbalanced[150:]

        acc_imbalanced = accuracy_score(y_true_imbalanced, y_pred_imbalanced)
        prec_imbalanced = precision_score(y_true_imbalanced, y_pred_imbalanced, zero_division=0)
        rec_imbalanced = recall_score(y_true_imbalanced, y_pred_imbalanced, zero_division=0)
        f1_imbalanced = f1_score(y_true_imbalanced, y_pred_imbalanced, zero_division=0)

        scenarios.append({
            "scenario": f"Сценарий {i+1}",
            "balanced": {
                "accuracy": float(acc_balanced),
                "precision": float(prec_balanced),
                "recall": float(rec_balanced),
                "f1": float(f1_balanced)
            },
            "imbalanced": {
                "accuracy": float(acc_imbalanced),
                "precision": float(prec_imbalanced),
                "recall": float(rec_imbalanced),
                "f1": float(f1_imbalanced)
            }
        })

    return {"scenarios": scenarios}

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
from schemas import (
    LinearRegressionParams,
    LinearRegressionResponse,
    ClassificationParams,
    ClassificationResponse,
    ClusteringParams,
    ClusteringResponse,
    OverfittingParams,
    OverfittingResponse,
    CustomerSegmentationParams,
    CustomerSegmentationResponse,
    ClusterProfile,
)
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
    current_user: User = Depends(get_current_user),
    seed: int = None
):
    """
    Сравнение метрик качества на разных датасетах
    """
    # Создаем различные сценарии
    scenarios = []

    for i in range(3):
        rs = (seed if seed is not None else 42) + i
        # Генерируем сбалансированные данные
        X_balanced, y_balanced = make_classification(
            n_samples=200, n_features=2, n_classes=2,
            n_informative=2, n_redundant=0, n_clusters_per_class=1,
            weights=[0.5, 0.5], random_state=rs
        )

        # Генерируем несбалансированные данные
        X_imbalanced, y_imbalanced = make_classification(
            n_samples=200, n_features=2, n_classes=2,
            n_informative=2, n_redundant=0, n_clusters_per_class=1,
            weights=[0.9, 0.1], random_state=rs
        )

        # Обучаем простую модель
        model = LogisticRegression(random_state=rs)

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


@router.post("/overfitting", response_model=OverfittingResponse)
async def overfitting_simulator(
    params: OverfittingParams,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Симулятор переобучения: показывает train/val MSE при росте сложности модели (degree)
    и визуализирует предсказания выбранной сложности.
    """
    from sklearn.preprocessing import PolynomialFeatures
    from sklearn.pipeline import make_pipeline
    from sklearn.linear_model import Ridge

    rng = np.random.RandomState(params.random_state)
    n = max(30, int(params.n_samples))
    noise = float(max(0.0, params.noise))

    # Synthetic non-linear regression data
    x = rng.uniform(-3.0, 3.0, size=n)
    x = np.sort(x)
    y_true = np.sin(x) + 0.2 * x
    y = y_true + rng.normal(0.0, noise, size=n)

    x_train, x_val, y_train, y_val = train_test_split(
        x, y, test_size=float(params.test_size), random_state=params.random_state
    )

    max_degree = int(np.clip(params.max_degree, 2, 20))
    degrees = list(range(1, max_degree + 1))
    train_mse: list[float] = []
    val_mse: list[float] = []

    alpha = float(max(0.0, params.alpha))

    for d in degrees:
        model = make_pipeline(
            PolynomialFeatures(degree=d, include_bias=False),
            Ridge(alpha=alpha, random_state=params.random_state),
        )
        model.fit(x_train.reshape(-1, 1), y_train)
        y_pred_train = model.predict(x_train.reshape(-1, 1))
        y_pred_val = model.predict(x_val.reshape(-1, 1))
        train_mse.append(float(mean_squared_error(y_train, y_pred_train)))
        val_mse.append(float(mean_squared_error(y_val, y_pred_val)))

    selected_degree = int(np.clip(params.selected_degree, 1, max_degree))
    selected_model = make_pipeline(
        PolynomialFeatures(degree=selected_degree, include_bias=False),
        Ridge(alpha=alpha, random_state=params.random_state),
    )
    selected_model.fit(x_train.reshape(-1, 1), y_train)

    x_curve = np.linspace(-3.0, 3.0, 200)
    y_true_curve = np.sin(x_curve) + 0.2 * x_curve
    y_pred_curve = selected_model.predict(x_curve.reshape(-1, 1))

    return OverfittingResponse(
        degrees=degrees,
        train_mse=train_mse,
        val_mse=val_mse,
        x_train=x_train.tolist(),
        y_train=y_train.tolist(),
        x_val=x_val.tolist(),
        y_val=y_val.tolist(),
        x_curve=x_curve.tolist(),
        y_true_curve=y_true_curve.tolist(),
        y_pred_curve=y_pred_curve.tolist(),
        selected_degree=selected_degree,
    )


@router.post("/customer-segmentation", response_model=CustomerSegmentationResponse)
async def customer_segmentation_simulator(
    params: CustomerSegmentationParams,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Мини-проект: синтетический датасет клиентов + кластеризация + профили сегментов.
    """
    from sklearn.preprocessing import StandardScaler
    from sklearn.decomposition import PCA

    rng = np.random.RandomState(params.random_state)
    n = int(np.clip(params.n_customers, 100, 2000))
    k = int(np.clip(params.n_clusters, 2, 10))
    noise = float(max(0.0, params.noise))

    # Generate synthetic customer features:
    # age, total_spent, frequency, recency
    # Create k latent groups with different centers.
    centers = []
    for i in range(k):
        centers.append(
            [
                rng.uniform(18, 65),          # age
                rng.uniform(200, 5000),       # total_spent
                rng.uniform(1, 20),           # frequency
                rng.uniform(1, 180),          # recency (days)
            ]
        )
    centers = np.array(centers)

    labels = rng.randint(0, k, size=n)
    X = centers[labels] + rng.normal(0.0, noise, size=(n, 4)) * np.array([8.0, 800.0, 3.0, 35.0])

    # Fit KMeans on scaled data
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    kmeans = KMeans(n_clusters=k, random_state=params.random_state, n_init=10)
    pred_labels = kmeans.fit_predict(X_scaled)

    # 2D projection for visualization
    pca = PCA(n_components=2, random_state=params.random_state)
    X_2d = pca.fit_transform(X_scaled)
    centroids_2d = pca.transform(kmeans.cluster_centers_)

    profiles: list[ClusterProfile] = []
    for cluster in range(k):
        mask = pred_labels == cluster
        size = int(mask.sum())
        if size == 0:
            continue
        cluster_data = X[mask]
        profiles.append(
            ClusterProfile(
                cluster=int(cluster),
                size=size,
                avg_age=float(cluster_data[:, 0].mean()),
                avg_total_spent=float(cluster_data[:, 1].mean()),
                avg_frequency=float(cluster_data[:, 2].mean()),
                avg_recency=float(cluster_data[:, 3].mean()),
            )
        )

    # Sort for stable UI
    profiles.sort(key=lambda p: p.cluster)

    return CustomerSegmentationResponse(
        points_2d=X_2d.tolist(),
        labels=pred_labels.tolist(),
        centroids_2d=centroids_2d.tolist(),
        profiles=profiles,
    )

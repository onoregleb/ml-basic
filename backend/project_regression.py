from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd


@dataclass(frozen=True)
class RegressionProjectData:
    train: pd.DataFrame
    test: pd.DataFrame
    test_labels: pd.DataFrame  # columns: id, y


def generate_regression_project_data(user_id: int) -> RegressionProjectData:
    """
    Deterministically generate a regression dataset per user_id.

    train.csv: id, features..., y
    test.csv:  id, features... (no y)

    Notes:
    - Includes a categorical feature 'region' + some missing values to exercise preprocessing.
    """
    seed = int(user_id) * 1337 + 42
    rng = np.random.RandomState(seed)

    n_train = 800
    n_test = 200
    n_total = n_train + n_test

    # Numeric features
    x1 = rng.normal(0, 1, size=n_total)
    x2 = rng.normal(0, 1, size=n_total)
    x3 = rng.normal(0, 1, size=n_total)
    x4 = rng.normal(0, 1, size=n_total)
    x5 = rng.uniform(-2, 2, size=n_total)
    x6 = rng.lognormal(mean=0.0, sigma=0.6, size=n_total)

    # Categorical feature
    region = rng.choice(["A", "B", "C"], size=n_total, p=[0.5, 0.3, 0.2])

    # Non-linear-ish target with interactions + region effects
    region_effect = np.where(region == "A", 0.0, np.where(region == "B", 1.5, -1.0))
    noise = rng.normal(0, 0.8, size=n_total)
    y = (
        3.0 * x1
        - 2.0 * x2
        + 0.8 * x3
        + 1.2 * np.sin(x5)
        + 0.5 * np.log1p(x6)
        + 1.1 * x1 * x2
        + region_effect
        + noise
    )

    df = pd.DataFrame(
        {
            "id": np.arange(1, n_total + 1, dtype=int),
            "x1": x1,
            "x2": x2,
            "x3": x3,
            "x4": x4,
            "x5": x5,
            "x6": x6,
            "region": region,
            "y": y,
        }
    )

    # Inject missing values (same pattern per user_id)
    for col in ["x2", "x4", "x6"]:
        mask = rng.rand(n_total) < 0.06
        df.loc[mask, col] = np.nan
    # Some missing categories
    mask_cat = rng.rand(n_total) < 0.03
    df.loc[mask_cat, "region"] = None

    train = df.iloc[:n_train].copy()
    test_full = df.iloc[n_train:].copy()

    test = test_full.drop(columns=["y"]).copy()
    test_labels = test_full[["id", "y"]].copy()

    return RegressionProjectData(train=train, test=test, test_labels=test_labels)


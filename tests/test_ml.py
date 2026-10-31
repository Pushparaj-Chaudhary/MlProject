"""
Unit and Integration Tests for From-Scratch ML Components.
Tests:
- Data loader & schema validation
- LabelEncoder & MinMaxScaler
- Train/test splitting
- Gini impurity & Entropy functions
- Decision Tree split selection, training, prediction & decision path
- Euclidean distance calculation
- KNN training, voting, and neighbor retrieval
- Evaluation metrics (Accuracy, Confusion Matrix, Macro Precision/Recall/F1)
"""

import pytest
import numpy as np
from pathlib import Path

from ml.crop_recommendation import (
    DecisionTreeClassifierScratch,
    KNNClassifierScratch,
    load_crop_dataset,
    EXPECTED_FEATURES,
    LabelEncoder,
    MinMaxScaler,
    train_test_split_scratch,
    compute_accuracy,
    compute_confusion_matrix,
    compute_classification_metrics
)


def test_label_encoder():
    labels = ["rice", "maize", "rice", "cotton", "maize"]
    le = LabelEncoder()
    encoded = le.fit_transform(labels)
    assert len(encoded) == 5
    assert len(le.classes_) == 3
    decoded = le.inverse_transform(encoded)
    assert decoded == labels


def test_min_max_scaler():
    X = np.array([[10.0, 200.0], [20.0, 100.0], [30.0, 300.0]])
    scaler = MinMaxScaler()
    X_norm = scaler.fit_transform(X)
    assert np.all(X_norm >= 0.0)
    assert np.all(X_norm <= 1.0)
    # Check bounds
    assert np.isclose(X_norm[0, 0], 0.0)
    assert np.isclose(X_norm[2, 0], 1.0)
    # Inverse transform
    X_recovered = scaler.inverse_transform(X_norm)
    assert np.allclose(X, X_recovered)


def test_train_test_split_scratch():
    X = np.arange(100).reshape(50, 2)
    y = np.array([0] * 25 + [1] * 25)
    X_tr, X_te, y_tr, y_te = train_test_split_scratch(X, y, test_size=0.2, random_state=42, stratify=True)
    assert len(X_tr) == 40
    assert len(X_te) == 10
    assert np.sum(y_te == 0) == 5
    assert np.sum(y_te == 1) == 5


def test_gini_and_entropy_formulas():
    dt = DecisionTreeClassifierScratch(criterion="gini")
    # Pure node: gini should be 0
    y_pure = np.array([1, 1, 1, 1])
    assert dt._compute_gini(y_pure) == 0.0

    # 50-50 binary split: gini = 1 - (0.5^2 + 0.5^2) = 0.5
    y_half = np.array([0, 0, 1, 1])
    assert np.isclose(dt._compute_gini(y_half), 0.5)

    # Entropy of 50-50 binary split: - (0.5 * log2(0.5) * 2) = 1.0
    assert np.isclose(dt._compute_entropy(y_half), 1.0)


def test_decision_tree_scratch():
    # Simple linearly separable dataset
    X = np.array([
        [1.0, 2.0],
        [1.5, 1.8],
        [5.0, 8.0],
        [5.5, 8.5]
    ])
    y = np.array([0, 0, 1, 1])
    dt = DecisionTreeClassifierScratch(max_depth=3, feature_names=["f1", "f2"], class_names=["classA", "classB"])
    dt.fit(X, y)

    preds = dt.predict(X)
    assert np.array_equal(preds, y)

    # Test decision path
    explanation = dt.explain_prediction(X[0])
    assert "decision_path" in explanation
    assert explanation["predicted_crop"] == "classA"
    assert explanation["confidence"] == 1.0


def test_euclidean_distance_and_knn():
    knn = KNNClassifierScratch(k=3, feature_names=["f1", "f2"], class_names=["cropA", "cropB"])
    x1 = np.array([0.0, 0.0])
    x2 = np.array([3.0, 4.0])
    assert np.isclose(knn._euclidean_distance(x1, x2), 5.0)

    # Simple points
    X = np.array([
        [10.0, 10.0],
        [11.0, 10.5],
        [10.5, 9.5],
        [90.0, 90.0],
        [91.0, 89.0],
        [89.5, 90.5]
    ])
    y = np.array([0, 0, 0, 1, 1, 1])

    knn.fit(X, y)
    preds = knn.predict(X)
    assert np.array_equal(preds, y)

    explanation = knn.explain_prediction(np.array([10.2, 10.1]))
    assert explanation["predicted_crop"] == "cropA"
    assert explanation["confidence"] == 1.0
    assert len(explanation["nearest_neighbors"]) == 3


def test_metrics_from_scratch():
    y_true = np.array([0, 1, 2, 0, 1, 2])
    y_pred = np.array([0, 1, 1, 0, 1, 2])  # 5 out of 6 correct

    acc = compute_accuracy(y_true, y_pred)
    assert np.isclose(acc, 5 / 6)

    cm = compute_confusion_matrix(y_true, y_pred, num_classes=3)
    assert cm.shape == (3, 3)
    assert cm[0, 0] == 2
    assert cm[1, 1] == 2
    assert cm[2, 2] == 1
    assert cm[2, 1] == 1  # true 2 predicted as 1

    metrics = compute_classification_metrics(y_true, y_pred, num_classes=3, class_names=["A", "B", "C"])
    assert "accuracy" in metrics
    assert "macro_f1" in metrics
    assert "macro_precision" in metrics
    assert "macro_recall" in metrics


def test_dataset_loader_integrity():
    dataset_path = Path("dataset/Crop_recommendation.csv")
    if dataset_path.exists():
        df, report = load_crop_dataset(dataset_path)
        assert report["is_valid"] is True
        assert report["total_records"] == 2800
        assert len(report["unique_crops"]) == 28
        assert report["total_nulls"] == 0

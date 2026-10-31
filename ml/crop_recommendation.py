import os
import sys
import json
import math
from pathlib import Path
from typing import Dict, Any, List, Tuple, Optional
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix as sklearn_confusion_matrix
)

# Project root path resolution
PROJECT_ROOT = Path(__file__).resolve().parent
if PROJECT_ROOT.name == "ml":
    PROJECT_ROOT = PROJECT_ROOT.parent


def resolve_path(p: str | Path) -> Path:
    """Resolves path against current working directory or against project root."""
    path = Path(p)
    if path.is_absolute() and path.exists():
        return path
    if path.exists():
        return path.resolve()
    alt = PROJECT_ROOT / path
    if alt.exists():
        return alt.resolve()
    return path


# ==============================================================================
# 1. DATA LOADING
# ==============================================================================

FEATURES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
EXPECTED_FEATURES = FEATURES
TARGET = "label"
TARGET_COLUMN = TARGET


def find_dataset_path() -> Path:
    """Locates the primary crop dataset whether run from root or any subfolder."""
    candidates = [
        Path("dataset/Crop_recommendation.csv"),
        PROJECT_ROOT / "dataset" / "Crop_recommendation.csv",
        Path("../dataset/Crop_recommendation.csv")
    ]
    for p in candidates:
        if p.exists():
            return p.resolve()
    raise FileNotFoundError("Could not locate 'Crop_recommendation.csv'.")


def load_crop_dataset(filepath: str | Path = "dataset/Crop_recommendation.csv") -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """Loads dataset from CSV, performs schema integrity checks, and returns DataFrame & report."""
    path = resolve_path(filepath)
    if not path.exists():
        raise FileNotFoundError(f"Dataset file not found at: {path.resolve()}")

    df = pd.read_csv(path)
    df.columns = [c.strip() for c in df.columns]

    if "label" not in df.columns and "crop" in df.columns:
        df = df.rename(columns={"crop": "label"})

    missing_cols = [c for c in FEATURES + [TARGET] if c not in df.columns]
    if missing_cols:
        raise ValueError(f"Dataset is missing required columns: {missing_cols}")

    null_counts = df.isnull().sum().to_dict()
    total_nulls = sum(null_counts.values())
    duplicate_rows = int(df.duplicated().sum())

    range_violations = {}
    for feat, (min_val, max_val) in FEATURE_RANGES.items():
        invalid_count = int(((df[feat] < min_val) | (df[feat] > max_val)).sum())
        if invalid_count > 0:
            range_violations[feat] = invalid_count

    validation_report = {
        "is_valid": total_nulls == 0 and len(missing_cols) == 0,
        "total_records": len(df),
        "total_columns": len(df.columns),
        "features": FEATURES,
        "target": TARGET,
        "null_counts": null_counts,
        "total_nulls": total_nulls,
        "duplicate_rows": duplicate_rows,
        "range_violations": range_violations,
        "unique_crops": sorted(df[TARGET].unique().tolist()),
        "crop_counts": df[TARGET].value_counts().to_dict()
    }

    return df, validation_report


def load_dataset(filepath: str | Path = "dataset/Crop_recommendation.csv") -> pd.DataFrame:
    """Convenience helper returning the loaded DataFrame."""
    df, _ = load_crop_dataset(filepath)
    return df


def get_dataset_statistics(df: pd.DataFrame) -> Dict[str, Any]:
    """Computes descriptive statistics, distributions, and feature correlations."""
    stats = {}
    for feat in FEATURES:
        series = df[feat]
        stats[feat] = {
            "mean": round(float(series.mean()), 2),
            "std": round(float(series.std()), 2),
            "min": round(float(series.min()), 2),
            "q25": round(float(series.quantile(0.25)), 2),
            "median": round(float(series.median()), 2),
            "q75": round(float(series.quantile(0.75)), 2),
            "max": round(float(series.max()), 2),
        }

    corr_df = df[FEATURES].corr()
    corr_matrix = {col: {idx: round(float(corr_df.loc[idx, col]), 3) for idx in corr_df.index} for col in corr_df.columns}

    crop_avg_df = df.groupby(TARGET)[FEATURES].mean().round(2).reset_index()
    crop_averages = crop_avg_df.to_dict(orient="records")

    crop_summary = {}
    for crop_name, group in df.groupby(TARGET):
        crop_summary[str(crop_name)] = {
            feat: {
                "mean": round(float(group[feat].mean()), 2),
                "min": round(float(group[feat].min()), 2),
                "max": round(float(group[feat].max()), 2)
            }
            for feat in FEATURES
        }

    return {
        "feature_stats": stats,
        "correlation_matrix": corr_matrix,
        "crop_averages": crop_averages,
        "crop_profiles": crop_summary,
        "total_samples": len(df),
        "num_classes": int(df[TARGET].nunique()),
        "classes": sorted(df[TARGET].unique().tolist()),
        "class_distribution": df[TARGET].value_counts().to_dict()
    }


# ==============================================================================
# 2. DATA CLEANING & VALIDATION
# ==============================================================================

FEATURE_RANGES = {
    "N": (0, 200),             # Nitrogen ratio (kg/ha)
    "P": (0, 200),             # Phosphorus ratio (kg/ha)
    "K": (0, 300),             # Potassium ratio (kg/ha)
    "temperature": (-10, 60),  # Ambient air temperature (°C)
    "humidity": (0, 100),      # Relative atmospheric humidity (%)
    "ph": (0, 14),             # Soil pH level (0 - 14)
    "rainfall": (0, 500)       # Seasonal precipitation (mm)
}


def clean_and_validate_data(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """Performs strict missing-value, duplicate, and biological boundary audits."""
    initial_count = len(df)
    duplicate_count = int(df.duplicated().sum())
    df_cleaned = df.drop_duplicates().copy()

    null_counts = df_cleaned.isnull().sum().to_dict()
    total_nulls = int(sum(null_counts.values()))
    if total_nulls > 0:
        df_cleaned = df_cleaned.dropna()

    boundary_violations = {}
    for feat, (lower, upper) in FEATURE_RANGES.items():
        if feat in df_cleaned.columns:
            out_of_bounds = ((df_cleaned[feat] < lower) | (df_cleaned[feat] > upper)).sum()
            boundary_violations[feat] = int(out_of_bounds)

    audit = {
        "initial_record_count": initial_count,
        "duplicate_rows_removed": duplicate_count,
        "missing_values_found": total_nulls,
        "boundary_violations": boundary_violations,
        "final_clean_record_count": len(df_cleaned),
        "classes_count": int(df_cleaned[TARGET].nunique()),
        "classes": sorted(df_cleaned[TARGET].unique().tolist())
    }
    return df_cleaned, audit


# ==============================================================================
# 3. FEATURE SELECTION & PREPROCESSING
# ==============================================================================

class LabelEncoder:
    """Label encoder implemented from scratch mapping discrete classes to integers."""

    def __init__(self):
        self.classes_: List[str] = []
        self.class_to_idx: Dict[str, int] = {}
        self.idx_to_class: Dict[int, str] = {}

    def fit(self, y: List[str] | np.ndarray) -> "LabelEncoder":
        unique_classes = sorted(list(set(str(v) for v in y)))
        self.classes_ = unique_classes
        self.class_to_idx = {c: i for i, c in enumerate(unique_classes)}
        self.idx_to_class = {i: c for i, c in enumerate(unique_classes)}
        return self

    def transform(self, y: List[str] | np.ndarray) -> np.ndarray:
        return np.array([self.class_to_idx[str(v)] for v in y], dtype=np.int64)

    def fit_transform(self, y: List[str] | np.ndarray) -> np.ndarray:
        return self.fit(y).transform(y)

    def inverse_transform(self, y_indices: List[int] | np.ndarray) -> List[str]:
        return [self.idx_to_class[int(i)] for i in y_indices]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "classes": self.classes_,
            "class_to_idx": self.class_to_idx,
            "idx_to_class": {str(k): v for k, v in self.idx_to_class.items()}
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "LabelEncoder":
        le = cls()
        le.classes_ = data["classes"]
        le.class_to_idx = {k: int(v) for k, v in data["class_to_idx"].items()}
        le.idx_to_class = {int(k): v for k, v in data["idx_to_class"].items()}
        return le


class MinMaxScaler:
    """Min-Max normalization implemented from scratch scaling inputs into [0, 1]."""

    def __init__(self, feature_range: Tuple[float, float] = (0.0, 1.0)):
        self.feature_range = feature_range
        self.min_: Optional[np.ndarray] = None
        self.max_: Optional[np.ndarray] = None
        self.scale_: Optional[np.ndarray] = None

    def fit(self, X: np.ndarray) -> "MinMaxScaler":
        X = np.asarray(X, dtype=np.float64)
        self.min_ = np.min(X, axis=0)
        self.max_ = np.max(X, axis=0)
        diff = self.max_ - self.min_
        diff[diff == 0.0] = 1.0
        self.scale_ = (self.feature_range[1] - self.feature_range[0]) / diff
        return self

    def transform(self, X: np.ndarray) -> np.ndarray:
        X = np.asarray(X, dtype=np.float64)
        return (X - self.min_) * self.scale_ + self.feature_range[0]

    def fit_transform(self, X: np.ndarray) -> np.ndarray:
        return self.fit(X).transform(X)

    def inverse_transform(self, X_scaled: np.ndarray) -> np.ndarray:
        X_scaled = np.asarray(X_scaled, dtype=np.float64)
        return (X_scaled - self.feature_range[0]) / self.scale_ + self.min_

    def to_dict(self) -> Dict[str, Any]:
        return {
            "feature_range": list(self.feature_range),
            "min_": self.min_.tolist() if self.min_ is not None else [],
            "max_": self.max_.tolist() if self.max_ is not None else [],
            "scale_": self.scale_.tolist() if self.scale_ is not None else []
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "MinMaxScaler":
        scaler = cls(feature_range=tuple(data.get("feature_range", [0.0, 1.0])))
        scaler.min_ = np.array(data["min_"], dtype=np.float64)
        scaler.max_ = np.array(data["max_"], dtype=np.float64)
        scaler.scale_ = np.array(data["scale_"], dtype=np.float64)
        return scaler


def train_test_split_scratch(
    X: np.ndarray,
    y: np.ndarray,
    test_size: float = 0.2,
    random_state: int = 42,
    stratify: bool = True
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """Stratified or uniform train/test partitioner implemented from scratch."""
    rng = np.random.RandomState(random_state)
    n_samples = len(X)
    X = np.asarray(X)
    y = np.asarray(y)

    if not stratify:
        indices = np.arange(n_samples)
        rng.shuffle(indices)
        split_point = int(n_samples * (1.0 - test_size))
        train_idx, test_idx = indices[:split_point], indices[split_point:]
        return X[train_idx], X[test_idx], y[train_idx], y[test_idx]

    train_indices, test_indices = [], []
    for cls_val in np.unique(y):
        cls_indices = np.where(y == cls_val)[0]
        rng.shuffle(cls_indices)
        cls_split = int(len(cls_indices) * (1.0 - test_size))
        train_indices.extend(cls_indices[:cls_split])
        test_indices.extend(cls_indices[cls_split:])

    rng.shuffle(train_indices)
    rng.shuffle(test_indices)
    return X[train_indices], X[test_indices], y[train_indices], y[test_indices]


def preprocess_and_split(
    df: pd.DataFrame,
    test_size: float = 0.2,
    random_state: int = 42
) -> Dict[str, Any]:
    """Executes feature extraction, label encoding, normalization, and stratified split."""
    X_raw = df[FEATURES].values.astype(np.float64)
    y_raw = df[TARGET].values

    encoder = LabelEncoder()
    y_encoded = encoder.fit_transform(y_raw)

    X_train_raw, X_test_raw, y_train, y_test = train_test_split_scratch(
        X_raw, y_encoded, test_size=test_size, random_state=random_state, stratify=True
    )

    scaler = MinMaxScaler()
    X_train_scaled = scaler.fit_transform(X_train_raw)
    X_test_scaled = scaler.transform(X_test_raw)

    return {
        "X_train_raw": X_train_raw,
        "X_test_raw": X_test_raw,
        "X_train_scaled": X_train_scaled,
        "X_test_scaled": X_test_scaled,
        "y_train": y_train,
        "y_test": y_test,
        "scaler": scaler,
        "encoder": encoder,
        "feature_names": FEATURES,
        "class_names": encoder.classes_
    }


# ==============================================================================
# 4. CLASSIFICATION MODELS IMPLEMENTED FROM SCRATCH (NumPy)
# ==============================================================================

class Node:
    """Decision Tree Node representing a decision boundary or terminal prediction leaf."""

    def __init__(
        self,
        feature_idx: Optional[int] = None,
        threshold: Optional[float] = None,
        left: Optional["Node"] = None,
        right: Optional["Node"] = None,
        value: Optional[int] = None,
        probabilities: Optional[Dict[str, float]] = None,
        samples: int = 0,
        impurity: float = 0.0
    ):
        self.feature_idx = feature_idx
        self.threshold = threshold
        self.left = left
        self.right = right
        self.value = value
        self.probabilities = probabilities or {}
        self.samples = samples
        self.impurity = impurity

    @property
    def is_leaf(self) -> bool:
        return self.value is not None

    def to_dict(self) -> Dict[str, Any]:
        if self.is_leaf:
            return {
                "type": "leaf",
                "value": self.value,
                "probabilities": self.probabilities,
                "samples": self.samples,
                "impurity": round(self.impurity, 4)
            }
        return {
            "type": "split",
            "feature_idx": self.feature_idx,
            "threshold": round(float(self.threshold), 4),
            "impurity": round(self.impurity, 4),
            "samples": self.samples,
            "left": self.left.to_dict() if self.left else None,
            "right": self.right.to_dict() if self.right else None
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Node":
        if data["type"] == "leaf":
            return cls(
                value=data["value"],
                probabilities=data.get("probabilities", {}),
                samples=data.get("samples", 0),
                impurity=data.get("impurity", 0.0)
            )
        node = cls(
            feature_idx=data["feature_idx"],
            threshold=data["threshold"],
            impurity=data.get("impurity", 0.0),
            samples=data.get("samples", 0)
        )
        if data.get("left"):
            node.left = cls.from_dict(data["left"])
        if data.get("right"):
            node.right = cls.from_dict(data["right"])
        return node


class DecisionTreeClassifierScratch:
    """Decision Tree Classifier built from scratch with Gini/Entropy and full explainability."""

    def __init__(
        self,
        criterion: str = "gini",
        max_depth: int = 12,
        min_samples_split: int = 4,
        feature_names: Optional[List[str]] = None,
        class_names: Optional[List[str]] = None
    ):
        self.criterion = criterion
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.feature_names = feature_names or FEATURES
        self.class_names = class_names or []
        self.root: Optional[Node] = None
        self.num_classes_: int = 0
        self.feature_importances_: np.ndarray = np.zeros(len(self.feature_names))

    def _compute_gini(self, y: np.ndarray) -> float:
        if len(y) == 0:
            return 0.0
        _, counts = np.unique(y, return_counts=True)
        probs = counts / len(y)
        return float(1.0 - np.sum(probs ** 2))

    def _compute_entropy(self, y: np.ndarray) -> float:
        if len(y) == 0:
            return 0.0
        _, counts = np.unique(y, return_counts=True)
        probs = counts / len(y)
        return float(-np.sum([p * np.log2(p) for p in probs if p > 0]))

    def _compute_impurity(self, y: np.ndarray) -> float:
        return self._compute_gini(y) if self.criterion == "gini" else self._compute_entropy(y)

    def _best_split(self, X: np.ndarray, y: np.ndarray) -> Tuple[Optional[int], Optional[float], float]:
        best_feat, best_thresh = None, None
        best_gain = 0.0
        current_impurity = self._compute_impurity(y)
        n = len(y)

        for feat_idx in range(X.shape[1]):
            thresholds = np.unique(X[:, feat_idx])
            for thresh in thresholds:
                left_mask = X[:, feat_idx] <= thresh
                right_mask = ~left_mask
                if np.sum(left_mask) == 0 or np.sum(right_mask) == 0:
                    continue

                n_l, n_r = np.sum(left_mask), np.sum(right_mask)
                imp_l = self._compute_impurity(y[left_mask])
                imp_r = self._compute_impurity(y[right_mask])
                gain = current_impurity - ((n_l / n) * imp_l + (n_r / n) * imp_r)

                if gain > best_gain:
                    best_gain = gain
                    best_feat = feat_idx
                    best_thresh = float(thresh)

        return best_feat, best_thresh, best_gain

    def _build_tree(self, X: np.ndarray, y: np.ndarray, depth: int = 0) -> Node:
        n_samples = len(y)
        n_labels = len(np.unique(y))
        impurity = self._compute_impurity(y)

        if depth >= self.max_depth or n_labels <= 1 or n_samples < self.min_samples_split:
            classes, counts = np.unique(y, return_counts=True)
            majority_class = int(classes[np.argmax(counts)])
            probs = {}
            for c in range(self.num_classes_):
                c_name = self.class_names[c] if c < len(self.class_names) else str(c)
                cnt = counts[classes == c][0] if c in classes else 0
                probs[c_name] = round(float(cnt / n_samples), 4)
            return Node(value=majority_class, probabilities=probs, samples=n_samples, impurity=impurity)

        feat_idx, thresh, gain = self._best_split(X, y)
        if feat_idx is None or gain <= 1e-7:
            classes, counts = np.unique(y, return_counts=True)
            majority_class = int(classes[np.argmax(counts)])
            probs = {
                (self.class_names[c] if c < len(self.class_names) else str(c)): round(float(counts[classes == c][0] / n_samples), 4) if c in classes else 0.0
                for c in range(self.num_classes_)
            }
            return Node(value=majority_class, probabilities=probs, samples=n_samples, impurity=impurity)

        self.feature_importances_[feat_idx] += gain * (n_samples / self._total_samples)

        left_mask = X[:, feat_idx] <= thresh
        left_node = self._build_tree(X[left_mask], y[left_mask], depth + 1)
        right_node = self._build_tree(X[~left_mask], y[~left_mask], depth + 1)

        return Node(
            feature_idx=feat_idx,
            threshold=thresh,
            left=left_node,
            right=right_node,
            samples=n_samples,
            impurity=impurity
        )

    def fit(self, X: np.ndarray, y: np.ndarray) -> "DecisionTreeClassifierScratch":
        X = np.asarray(X, dtype=np.float64)
        y = np.asarray(y, dtype=np.int64)
        self.num_classes_ = len(np.unique(y)) if not self.class_names else len(self.class_names)
        self._total_samples = len(y)
        self.feature_importances_ = np.zeros(X.shape[1], dtype=np.float64)
        self.root = self._build_tree(X, y)
        total_imp = np.sum(self.feature_importances_)
        if total_imp > 0:
            self.feature_importances_ /= total_imp
        return self

    def _predict_one(self, x: np.ndarray, node: Node) -> int:
        if node.is_leaf:
            return node.value
        if x[node.feature_idx] <= node.threshold:
            return self._predict_one(x, node.left)
        return self._predict_one(x, node.right)

    def predict(self, X: np.ndarray) -> np.ndarray:
        X = np.asarray(X, dtype=np.float64)
        return np.array([self._predict_one(x, self.root) for x in X])

    def explain_prediction(self, x: np.ndarray) -> Dict[str, Any]:
        """Traces the exact conditional decision path traversed from root to leaf."""
        node = self.root
        path = []
        depth = 0
        while node and not node.is_leaf:
            val = float(x[node.feature_idx])
            cond_met = val <= node.threshold
            path.append({
                "feature": self.feature_names[node.feature_idx],
                "feature_index": node.feature_idx,
                "threshold": round(float(node.threshold), 2),
                "actual_value": round(val, 2),
                "condition": f"{self.feature_names[node.feature_idx]} <= {round(float(node.threshold), 2)}",
                "satisfied": bool(cond_met),
                "direction": "left (<=)" if cond_met else "right (>)",
                "depth": depth,
                "impurity": round(float(node.impurity), 4)
            })
            node = node.left if cond_met else node.right
            depth += 1

        pred_idx = node.value
        crop_name = self.class_names[pred_idx] if pred_idx < len(self.class_names) else str(pred_idx)
        conf = node.probabilities.get(crop_name, 1.0)

        return {
            "predicted_crop": crop_name,
            "predicted_class_index": pred_idx,
            "confidence": round(conf, 4),
            "confidence_percent": round(conf * 100, 2),
            "leaf_samples": node.samples,
            "leaf_impurity": round(float(node.impurity), 4),
            "decision_path": path,
            "class_probabilities": node.probabilities
        }

    def to_dict(self) -> Dict[str, Any]:
        return {
            "model_type": "DecisionTreeClassifierScratch",
            "criterion": self.criterion,
            "max_depth": self.max_depth,
            "min_samples_split": self.min_samples_split,
            "feature_names": self.feature_names,
            "class_names": self.class_names,
            "num_classes": self.num_classes_,
            "feature_importances": self.feature_importances_.tolist(),
            "tree": self.root.to_dict() if self.root else None
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "DecisionTreeClassifierScratch":
        model = cls(
            criterion=data.get("criterion", "gini"),
            max_depth=data.get("max_depth", 12),
            min_samples_split=data.get("min_samples_split", 4),
            feature_names=data.get("feature_names", FEATURES),
            class_names=data.get("class_names", [])
        )
        model.num_classes_ = data.get("num_classes", len(model.class_names))
        model.feature_importances_ = np.array(data.get("feature_importances", []), dtype=np.float64)
        if data.get("tree"):
            model.root = Node.from_dict(data["tree"])
        return model


class KNNClassifierScratch:
    """K-Nearest Neighbors Classifier built from scratch with Euclidean distance & neighbor explanations."""

    def __init__(
        self,
        k: int = 5,
        weights: str = "uniform",
        feature_names: Optional[List[str]] = None,
        class_names: Optional[List[str]] = None
    ):
        self.k = k
        self.weights = weights
        self.feature_names = feature_names or FEATURES
        self.class_names = class_names or []
        self.X_train_raw_: Optional[np.ndarray] = None
        self.X_train_norm_: Optional[np.ndarray] = None
        self.y_train_: Optional[np.ndarray] = None
        self.scaler: Optional[MinMaxScaler] = None
        self.num_classes_: int = 0

    def _euclidean_distance(self, x1: np.ndarray, x2: np.ndarray) -> float:
        return float(np.sqrt(np.sum((x1 - x2) ** 2)))

    def fit(self, X: np.ndarray, y: np.ndarray, scaler: Optional[MinMaxScaler] = None) -> "KNNClassifierScratch":
        X = np.asarray(X, dtype=np.float64)
        self.y_train_ = np.asarray(y, dtype=np.int64)
        self.X_train_raw_ = X
        self.scaler = scaler or MinMaxScaler().fit(X)
        self.X_train_norm_ = self.scaler.transform(X)
        self.num_classes_ = len(np.unique(self.y_train_)) if not self.class_names else len(self.class_names)
        return self

    def _get_neighbors(self, x_norm: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        distances = np.linalg.norm(self.X_train_norm_ - x_norm, axis=1)
        k_indices = np.argsort(distances)[:self.k]
        return k_indices, distances[k_indices]

    def predict_one(self, x_raw: np.ndarray) -> int:
        x_norm = self.scaler.transform(np.asarray(x_raw).reshape(1, -1))[0]
        k_indices, k_distances = self._get_neighbors(x_norm)
        k_labels = self.y_train_[k_indices]

        if self.weights == "uniform":
            classes, counts = np.unique(k_labels, return_counts=True)
            return int(classes[np.argmax(counts)])

        class_weights: Dict[int, float] = {}
        for lbl, dist in zip(k_labels, k_distances):
            w = 1.0 / (dist + 1e-6)
            class_weights[lbl] = class_weights.get(lbl, 0.0) + w
        return max(class_weights.items(), key=lambda it: it[1])[0]

    def predict(self, X: np.ndarray) -> np.ndarray:
        X = np.asarray(X, dtype=np.float64)
        return np.array([self.predict_one(x) for x in X])

    def explain_prediction(self, x_raw: np.ndarray, top_k_classes: int = 3) -> Dict[str, Any]:
        """Returns predicted class and transparent breakdown of the K nearest training instances."""
        x_norm = self.scaler.transform(np.asarray(x_raw).reshape(1, -1))[0]
        k_indices, k_distances = self._get_neighbors(x_norm)
        k_labels = self.y_train_[k_indices]

        neighbors = []
        for rank, (idx, dist) in enumerate(zip(k_indices, k_distances), start=1):
            lbl = int(self.y_train_[idx])
            neighbors.append({
                "rank": rank,
                "distance": round(float(dist), 4),
                "crop_label": self.class_names[lbl] if lbl < len(self.class_names) else str(lbl),
                "crop_index": lbl,
                "raw_features": {feat: round(float(v), 2) for feat, v in zip(self.feature_names, self.X_train_raw_[idx])}
            })

        classes, counts = np.unique(k_labels, return_counts=True)
        pred_idx = self.predict_one(x_raw)
        top_count = counts[classes == pred_idx][0] if pred_idx in classes else 0
        confidence = float(top_count / self.k)

        vote_distribution = []
        for lbl, count in zip(classes, counts):
            name = self.class_names[lbl] if lbl < len(self.class_names) else str(lbl)
            vote_distribution.append({
                "crop": name,
                "crop_index": int(lbl),
                "votes": int(count),
                "total_k": self.k,
                "probability": round(float(count / self.k), 4)
            })
        vote_distribution.sort(key=lambda item: item["votes"], reverse=True)

        crop_name = self.class_names[pred_idx] if pred_idx < len(self.class_names) else str(pred_idx)
        return {
            "k": self.k,
            "weights": self.weights,
            "predicted_crop": crop_name,
            "predicted_class_index": pred_idx,
            "confidence": round(confidence, 4),
            "confidence_percent": round(confidence * 100, 2),
            "confidence_explanation": f"{top_count} of the {self.k} nearest neighbors ({confidence * 100:.1f}%) belong to '{crop_name}'.",
            "top_candidates": vote_distribution[:top_k_classes],
            "nearest_neighbors": neighbors,
            "k_neighbors": neighbors
        }

    def to_dict(self) -> Dict[str, Any]:
        return {
            "model_type": "KNNClassifierScratch",
            "k": self.k,
            "weights": self.weights,
            "feature_names": self.feature_names,
            "class_names": self.class_names,
            "num_classes": self.num_classes_,
            "scaler": self.scaler.to_dict() if self.scaler else None,
            "X_train_raw": self.X_train_raw_.tolist() if self.X_train_raw_ is not None else [],
            "y_train": self.y_train_.tolist() if self.y_train_ is not None else []
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "KNNClassifierScratch":
        knn = cls(
            k=data.get("k", 5),
            weights=data.get("weights", "uniform"),
            feature_names=data.get("feature_names", FEATURES),
            class_names=data.get("class_names", [])
        )
        knn.num_classes_ = data.get("num_classes", len(knn.class_names))
        if data.get("scaler"):
            knn.scaler = MinMaxScaler.from_dict(data["scaler"])
        if data.get("X_train_raw") and data.get("y_train"):
            knn.X_train_raw_ = np.array(data["X_train_raw"], dtype=np.float64)
            knn.X_train_norm_ = knn.scaler.transform(knn.X_train_raw_) if knn.scaler else knn.X_train_raw_
            knn.y_train_ = np.array(data["y_train"], dtype=np.int64)
        return knn


# ==============================================================================
# 5. MODEL EVALUATION & PERSISTENCE HELPERS
# ==============================================================================

def save_json(data: Dict[str, Any], filepath: str | Path) -> None:
    path = Path(filepath)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def load_json(filepath: str | Path) -> Dict[str, Any]:
    path = resolve_path(filepath)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {path.resolve()}")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_decision_tree(model: DecisionTreeClassifierScratch, filepath: str | Path) -> None:
    save_json(model.to_dict(), filepath)


def load_decision_tree(filepath: str | Path) -> DecisionTreeClassifierScratch:
    data = load_json(filepath)
    return DecisionTreeClassifierScratch.from_dict(data)


def save_knn(model: KNNClassifierScratch, filepath: str | Path) -> None:
    save_json(model.to_dict(), filepath)


def load_knn(filepath: str | Path) -> KNNClassifierScratch:
    data = load_json(filepath)
    return KNNClassifierScratch.from_dict(data)


def compute_accuracy(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    return float(accuracy_score(y_true, y_pred))


def compute_confusion_matrix(y_true: np.ndarray, y_pred: np.ndarray, num_classes: int) -> np.ndarray:
    return sklearn_confusion_matrix(y_true, y_pred, labels=list(range(num_classes)))


def compute_classification_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    num_classes: int,
    class_names: Optional[List[str]] = None
) -> Dict[str, Any]:
    labels = list(range(num_classes))
    cm = sklearn_confusion_matrix(y_true, y_pred, labels=labels)
    acc = float(accuracy_score(y_true, y_pred))
    macro_prec = float(precision_score(y_true, y_pred, labels=labels, average="macro", zero_division=0))
    macro_rec = float(recall_score(y_true, y_pred, labels=labels, average="macro", zero_division=0))
    macro_f = float(f1_score(y_true, y_pred, labels=labels, average="macro", zero_division=0))

    per_class_prec = precision_score(y_true, y_pred, labels=labels, average=None, zero_division=0)
    per_class_rec = recall_score(y_true, y_pred, labels=labels, average=None, zero_division=0)
    per_class_f1 = f1_score(y_true, y_pred, labels=labels, average=None, zero_division=0)

    per_class_metrics = {}
    for c in range(num_classes):
        name = class_names[c] if class_names and c < len(class_names) else str(c)
        per_class_metrics[name] = {
            "precision": round(float(per_class_prec[c]), 4),
            "recall": round(float(per_class_rec[c]), 4),
            "f1_score": round(float(per_class_f1[c]), 4),
            "support": int(np.sum(cm[c, :]))
        }

    return {
        "accuracy": round(acc, 4),
        "macro_precision": round(macro_prec, 4),
        "macro_recall": round(macro_rec, 4),
        "macro_f1": round(macro_f, 4),
        "per_class": per_class_metrics,
        "confusion_matrix": cm.tolist()
    }


def stratified_k_fold_indices(y: np.ndarray, k: int = 5, random_state: int = 42) -> List[Tuple[np.ndarray, np.ndarray]]:
    skf = StratifiedKFold(n_splits=k, shuffle=True, random_state=random_state)
    return [(tr, te) for tr, te in skf.split(np.zeros(len(y)), y)]


def evaluate_models(
    dataset_path: str = "dataset/Crop_recommendation.csv",
    dt_model_path: str = "ml/saved_models/decision_tree.json",
    knn_model_path: str = "ml/saved_models/knn.json",
    output_dir: str = "ml/outputs"
) -> Dict[str, Any]:
    """Generates evaluation metrics and saves summary report."""
    out_dir = Path(output_dir)
    if not out_dir.is_absolute():
        out_dir = PROJECT_ROOT / out_dir
    out_dir.mkdir(parents=True, exist_ok=True)

    df, _ = load_crop_dataset(dataset_path)
    X = df[FEATURES].values.astype(np.float64)
    y_raw = df[TARGET].values

    encoder = LabelEncoder().fit(y_raw)
    y = encoder.transform(y_raw)
    class_names = encoder.classes_

    X_train, X_test, y_train, y_test = train_test_split_scratch(X, y, test_size=0.2, random_state=42, stratify=True)

    dt = load_decision_tree(dt_model_path)
    knn = load_knn(knn_model_path)

    dt_preds = dt.predict(X_test)
    knn_preds = knn.predict(X_test)

    dt_metrics = compute_classification_metrics(y_test, dt_preds, len(class_names), class_names)
    knn_metrics = compute_classification_metrics(y_test, knn_preds, len(class_names), class_names)

    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    dt_accs, knn_accs = [], []
    for tr, val in skf.split(X, y):
        dt_f = DecisionTreeClassifierScratch(criterion=dt.criterion, max_depth=dt.max_depth, min_samples_split=dt.min_samples_split, class_names=class_names)
        dt_f.fit(X[tr], y[tr])
        dt_accs.append(accuracy_score(y[val], dt_f.predict(X[val])))

        sc = MinMaxScaler().fit(X[tr])
        knn_f = KNNClassifierScratch(k=knn.k, class_names=class_names)
        knn_f.fit(X[tr], y[tr], scaler=sc)
        knn_accs.append(accuracy_score(y[val], knn_f.predict(X[val])))

    eval_results = {
        "test_samples": len(y_test),
        "num_classes": len(class_names),
        "class_names": class_names,
        "decision_tree": {
            "accuracy": dt_metrics["accuracy"],
            "macro_precision": dt_metrics["macro_precision"],
            "macro_recall": dt_metrics["macro_recall"],
            "macro_f1": dt_metrics["macro_f1"],
            "per_class": dt_metrics["per_class"],
            "confusion_matrix": dt_metrics["confusion_matrix"],
            "cross_validation": {
                "accuracy_mean": round(float(np.mean(dt_accs)), 4),
                "accuracy_std": round(float(np.std(dt_accs)), 4)
            }
        },
        "knn": {
            "accuracy": knn_metrics["accuracy"],
            "macro_precision": knn_metrics["macro_precision"],
            "macro_recall": knn_metrics["macro_recall"],
            "macro_f1": knn_metrics["macro_f1"],
            "per_class": knn_metrics["per_class"],
            "confusion_matrix": knn_metrics["confusion_matrix"],
            "cross_validation": {
                "accuracy_mean": round(float(np.mean(knn_accs)), 4),
                "accuracy_std": round(float(np.std(knn_accs)), 4)
            }
        }
    }

    save_json(eval_results, out_dir / "evaluation_results.json")
    return eval_results


def train_and_evaluate(data: Dict[str, Any]) -> Tuple[DecisionTreeClassifierScratch, KNNClassifierScratch]:
    """Fits both models, runs 5-fold CV, and serializes models to JSON."""
    X_train_raw, y_train = data["X_train_raw"], data["y_train"]
    X_test_raw, y_test = data["X_test_raw"], data["y_test"]
    class_names = data["class_names"]

    print("\n--- Training Model 1: Decision Tree (From Scratch) ---")
    dt = DecisionTreeClassifierScratch(max_depth=12, min_samples_split=4, class_names=class_names)
    dt.fit(X_train_raw, y_train)
    dt_preds = dt.predict(X_test_raw)
    dt_acc = accuracy_score(y_test, dt_preds)
    dt_f1 = f1_score(y_test, dt_preds, average="macro")
    print(f"Decision Tree Test Accuracy : {dt_acc * 100:.2f}%")
    print(f"Decision Tree Macro F1-Score: {dt_f1 * 100:.2f}%")

    print("\n--- Training Model 2: K-Nearest Neighbors (From Scratch, K=5) ---")
    knn = KNNClassifierScratch(k=5, class_names=class_names)
    knn.fit(X_train_raw, y_train, scaler=data["scaler"])
    knn_preds = knn.predict(X_test_raw)
    knn_acc = accuracy_score(y_test, knn_preds)
    knn_f1 = f1_score(y_test, knn_preds, average="macro")
    print(f"KNN (K=5) Test Accuracy     : {knn_acc * 100:.2f}%")
    print(f"KNN (K=5) Macro F1-Score    : {knn_f1 * 100:.2f}%")

    print("\n--- Running 5-Fold Stratified Cross-Validation ---")
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    dt_cv_accs, knn_cv_accs = [], []

    for fold, (train_idx, val_idx) in enumerate(skf.split(X_train_raw, y_train), start=1):
        dt_fold = DecisionTreeClassifierScratch(max_depth=12, min_samples_split=4, class_names=class_names)
        dt_fold.fit(X_train_raw[train_idx], y_train[train_idx])
        dt_cv_accs.append(accuracy_score(y_train[val_idx], dt_fold.predict(X_train_raw[val_idx])))

        fold_scaler = MinMaxScaler().fit(X_train_raw[train_idx])
        knn_fold = KNNClassifierScratch(k=5, class_names=class_names)
        knn_fold.fit(X_train_raw[train_idx], y_train[train_idx], scaler=fold_scaler)
        knn_cv_accs.append(accuracy_score(y_train[val_idx], knn_fold.predict(X_train_raw[val_idx])))

    print(f"5-Fold CV Decision Tree : {np.mean(dt_cv_accs) * 100:.2f}% (± {np.std(dt_cv_accs) * 100:.2f}%)")
    print(f"5-Fold CV KNN (K=5)     : {np.mean(knn_cv_accs) * 100:.2f}% (± {np.std(knn_cv_accs) * 100:.2f}%)")

    # Serialize trained models to JSON
    models_dir = PROJECT_ROOT / "ml" / "saved_models"
    models_dir.mkdir(parents=True, exist_ok=True)
    save_decision_tree(dt, models_dir / "decision_tree.json")
    save_knn(knn, models_dir / "knn.json")
    save_json(data["encoder"].to_dict(), models_dir / "label_encoder.json")
    save_json(data["scaler"].to_dict(), models_dir / "scaler.json")

    return dt, knn


# ==============================================================================
# 6. AGRICULTURAL ADVISORY MODULES
# ==============================================================================

FERTILIZER_DETAILS = {
    'Urea': {
        'grade': '46-0-0 (Pure Nitrogen)',
        'target_nutrient': 'Nitrogen (N)',
        'description': 'High-concentration nitrogen fertilizer. Promotes rapid vegetative growth, dark green foliage, and protein synthesis.',
        'application_tips': 'Apply in 2-3 split doses during active vegetative growth. Avoid broadcasting on dry soil under hot sun.',
        'color': '#16a34a'
    },
    'DAP': {
        'grade': '18-46-0 (Diammonium Phosphate)',
        'target_nutrient': 'Phosphorus (P) & Nitrogen (N)',
        'description': 'High-phosphorus fertilizer vital for root system development, early seedling vigor, and rapid tillering.',
        'application_tips': 'Best applied as basal dressing placed 3-5 cm below and away from seed at planting time.',
        'color': '#2563eb'
    },
    '14-35-14': {
        'grade': '14-35-14 (High-Phos NPK Complex)',
        'target_nutrient': 'High Phosphorus with starter N and K',
        'description': 'Designed for phosphorus-deficient soils needing supplemental potassium and nitrogen for early root balance.',
        'application_tips': 'Apply at sowing or initial land preparation. Thoroughly incorporate into root zone.',
        'color': '#0284c7'
    },
    '28-28': {
        'grade': '28-28-0 (Nitrophosphate)',
        'target_nutrient': 'Equal Nitrogen & Phosphorus',
        'description': 'Fast-acting dual-nutrient compound providing equal parts nitrogen and phosphorus for vigorous vegetative and root development.',
        'application_tips': 'Ideal for top dressing in irrigated fields and for crops with high phosphorus demand.',
        'color': '#9333ea'
    },
    '20-20': {
        'grade': '20-20-0 (Ammonium Phosphate Sulphate)',
        'target_nutrient': 'Balanced N & P with Sulphur',
        'description': 'Medium-grade balanced N-P complex commonly supplemented with 13% sulphur, excellent for oilseeds and pulses.',
        'application_tips': 'Apply during sowing or early vegetative phase. Helps improve oil content in oilseeds.',
        'color': '#ea580c'
    },
    '17-17-17': {
        'grade': '17-17-17 (Balanced 1:1:1 Complex)',
        'target_nutrient': 'Equal Nitrogen, Phosphorus & Potassium',
        'description': 'Comprehensive all-in-one multinutrient fertilizer providing balanced nutrition across all crop growth stages.',
        'application_tips': 'Suitable for all soil types. Split between basal application and early growth stages.',
        'color': '#0d9488'
    },
    '10-26-26': {
        'grade': '10-26-26 (High Potash & Phosphate Complex)',
        'target_nutrient': 'High Potassium (K) & Phosphorus (P)',
        'description': 'Formulated for potassium and phosphorus-demanding crops like potatoes, sugarcane, cotton, and fruits.',
        'application_tips': 'Apply during tillering, flowering, or fruit development stages to enhance starch and drought tolerance.',
        'color': '#d97706'
    }
}


class FertilizerAdvisor:
    """Fertilizer recommendation advisor matching soil nutrient deficiencies against fertilizer profiles."""

    def __init__(self, data_path: str | Path = "dataset/Fertilizer Prediction.csv"):
        self.data_path = resolve_path(data_path)
        self.df: Optional[pd.DataFrame] = None
        self._load_data()

    def _load_data(self):
        if self.data_path.exists():
            try:
                self.df = pd.read_csv(self.data_path)
                self.df.columns = [c.strip() for c in self.df.columns]
            except Exception:
                self.df = None

    def recommend(self, n: float, p: float, k: float, temp: float = 28.0, humidity: float = 60.0, crop: Optional[str] = None) -> Dict[str, Any]:
        diagnosis = []
        if n < 40:
            diagnosis.append("Nitrogen deficient: Chlorosis in older leaves and stunted vegetative development.")
        elif n > 120:
            diagnosis.append("Nitrogen excessive: Excessive vegetative leaf flush, delayed flowering and prone to lodging.")

        if p < 25:
            diagnosis.append("Phosphorus deficient: Poor root establishment, purpling of leaves, and delayed maturity.")
        elif p > 80:
            diagnosis.append("Phosphorus high: May interfere with Zinc and Iron micronutrient uptake.")

        if k < 30:
            diagnosis.append("Potassium deficient: Leaf tip scorching, reduced disease resistance, and weak stems.")

        if self.df is not None and not self.df.empty:
            features = ['Nitrogen', 'Phosphorous', 'Potassium', 'Temparature', 'Humidity']
            if all(f in self.df.columns for f in features) and 'Fertilizer Name' in self.df.columns:
                centroids = self.df.groupby('Fertilizer Name')[features].mean()
                query = np.array([n, p, k, temp, humidity], dtype=float)
                dists = np.linalg.norm(centroids.values - query, axis=1)
                best_fert = centroids.index[np.argmin(dists)]
            else:
                best_fert = '17-17-17'
        else:
            if n < 30 and p >= 20:
                best_fert = 'Urea'
            elif p < 25:
                best_fert = 'DAP'
            elif k < 25:
                best_fert = '10-26-26'
            else:
                best_fert = '17-17-17'

        details = FERTILIZER_DETAILS.get(best_fert, FERTILIZER_DETAILS['17-17-17'])
        return {
            "recommended_fertilizer": best_fert,
            "grade": details["grade"],
            "target_nutrient": details["target_nutrient"],
            "description": details["description"],
            "application_tips": details["application_tips"],
            "color": details["color"],
            "diagnosis": diagnosis,
            "soil_health_index": max(45, min(95, int(100 - abs(n - 70) * 0.3 - abs(p - 45) * 0.4 - abs(k - 50) * 0.3)))
        }


WATER_CROP_ALIASES = {
    'banana': 'BANANA', 'rice': 'RICE', 'maize': 'MAIZE', 'cotton': 'COTTON',
    'watermelon': 'MELON', 'muskmelon': 'MELON', 'kidneybeans': 'BEAN',
    'mothbeans': 'BEAN', 'mungbean': 'BEAN', 'blackgram': 'BEAN',
    'lentil': 'BEAN', 'chickpea': 'BEAN', 'pigeonpeas': 'BEAN',
    'orange': 'CITRUS', 'apple': 'CITRUS', 'mango': 'BANANA',
    'papaya': 'BANANA', 'coconut': 'BANANA', 'jute': 'COTTON', 'coffee': 'BEAN'
}

IRRIGATION_TECHNIQUES = {
    'rice': {'method': 'Puddle Basin / Continuous Submergence', 'efficiency': '60-70%', 'timing': 'Maintain 2-5 cm standing water until 10 days before harvest'},
    'maize': {'method': 'Furrow or Center Pivot Sprinkler', 'efficiency': '75-85%', 'timing': 'Critical irrigation at tasseling and silking stages'},
    'cotton': {'method': 'Drip Irrigation or Alternate Furrow', 'efficiency': '85-90%', 'timing': 'Peak water demand during flowering and boll development'},
    'banana': {'method': 'Drip Irrigation with Fertigation', 'efficiency': '90-95%', 'timing': 'Daily low-volume application to maintain moist root zone'},
    'grapes': {'method': 'Precision Drip with Regulated Deficit', 'efficiency': '92-96%', 'timing': 'Controlled deficit post-veraison to concentrate sugars'},
    'watermelon': {'method': 'Subsurface Drip Irrigation', 'efficiency': '88-94%', 'timing': 'Reduce watering 7-10 days before maturity to prevent cracking'},
    'chickpea': {'method': 'Sprinkler / Light Furrow', 'efficiency': '80-85%', 'timing': 'One pre-sowing irrigation and one at early pod development'},
    'coffee': {'method': 'Overhead Micro-Sprinkler', 'efficiency': '85-90%', 'timing': 'Blossom shower induction irrigation in dry spring months'}
}


class IrrigationAdvisor:
    """Calculates daily crop water demand (mm/day), irrigation volume (Liters/ha), and delivery system."""

    def __init__(self, data_path: str | Path = "dataset/DATASET - Sheet1.csv"):
        self.data_path = resolve_path(data_path)
        self.df: Optional[pd.DataFrame] = None
        self._load_data()

    def _load_data(self):
        if self.data_path.exists():
            try:
                self.df = pd.read_csv(self.data_path)
                self.df.columns = [c.strip().upper() for c in self.df.columns]
                if 'WATER REQUIREMENT' in self.df.columns:
                    self.df = self.df[self.df['WATER REQUIREMENT'] <= 50.0]
            except Exception:
                self.df = None

    def calculate_water_requirement(self, crop: str, temperature: float, humidity: float, rainfall: float) -> Dict[str, Any]:
        crop_clean = crop.strip().lower()
        alias = WATER_CROP_ALIASES.get(crop_clean, 'MAIZE')

        base_rate = 6.5
        if self.df is not None and not self.df.empty and 'CROP TYPE' in self.df.columns:
            sub = self.df[self.df['CROP TYPE'] == alias]
            if not sub.empty:
                base_rate = float(sub['WATER REQUIREMENT'].mean())

        temp_factor = 1.0 + max(-0.3, min(0.6, (temperature - 25.0) * 0.025))
        humidity_factor = 1.0 - max(-0.2, min(0.3, (humidity - 60.0) * 0.008))
        daily_effective_rain = (rainfall / 120.0) * 0.75
        daily_mm = max(1.5, round((base_rate * temp_factor * humidity_factor) - (daily_effective_rain * 0.4), 2))
        liters_per_ha_day = int(daily_mm * 10000)

        tech = IRRIGATION_TECHNIQUES.get(crop_clean, {
            'method': 'Drip / Micro-Sprinkler System',
            'efficiency': '80-90%',
            'timing': 'Irrigate during morning or late afternoon to minimize evapotranspiration'
        })

        status_str = "High Water Requirement" if daily_mm > 6.0 else "Moderate Water Requirement" if daily_mm >= 3.5 else "Low / Drought Resilient"

        return {
            "crop": crop,
            "daily_water_mm": daily_mm,
            "liters_per_hectare_day": liters_per_ha_day,
            "recommended_system": tech['method'],
            "water_use_efficiency": tech['efficiency'],
            "recommended_frequency": "Every 2-3 days" if daily_mm > 5.0 else "Every 4-5 days" if daily_mm > 3.0 else "Weekly or Rainfed",
            "irrigation_status": status_str,
            "irrigation_note": tech['timing'],
            "critical_timing": f"Critical moisture stress window for {crop.capitalize()}: Flowering & pod/grain filling.",
            "evapotranspiration_index": round(temp_factor * humidity_factor, 2)
        }


FAO_CROP_ALIASES = {
    'rice': 'Rice, paddy', 'maize': 'Maize', 'kidneybeans': 'Soybeans',
    'mothbeans': 'Soybeans', 'mungbean': 'Soybeans', 'blackgram': 'Soybeans',
    'lentil': 'Soybeans', 'chickpea': 'Soybeans', 'pigeonpeas': 'Soybeans',
    'banana': 'Plantains and others', 'cotton': 'Maize', 'apple': 'Maize',
    'grapes': 'Maize', 'watermelon': 'Sweet potatoes', 'muskmelon': 'Sweet potatoes',
    'mango': 'Plantains and others', 'orange': 'Plantains and others',
    'papaya': 'Plantains and others', 'coconut': 'Plantains and others',
    'jute': 'Maize', 'coffee': 'Maize'
}


class YieldPredictor:
    """Projects expected crop yield (tonnes/ha) benchmarked against India and global FAO averages."""

    def __init__(
        self,
        yield_path: str | Path = "dataset/yield_df.csv",
        cropdata_path: str | Path = "dataset/cropdata_updated.csv"
    ):
        self.yield_path = resolve_path(yield_path)
        self.cropdata_path = resolve_path(cropdata_path)
        self.df_yield: Optional[pd.DataFrame] = None
        self.df_cropdata: Optional[pd.DataFrame] = None
        self._load_datasets()

    def _load_datasets(self):
        if self.yield_path.exists():
            try:
                self.df_yield = pd.read_csv(self.yield_path)
            except Exception:
                pass
        if self.cropdata_path.exists():
            try:
                self.df_cropdata = pd.read_csv(self.cropdata_path)
            except Exception:
                pass

    def project_yield(self, crop: str, temperature: float, rainfall: float, humidity: float) -> Dict[str, Any]:
        crop_clean = crop.strip().lower()
        fao_item = FAO_CROP_ALIASES.get(crop_clean, 'Maize')

        base_yield_tonnes = 3.2
        india_avg_yield = 2.8
        global_avg_yield = 3.6

        if self.df_yield is not None and not self.df_yield.empty:
            item_df = self.df_yield[self.df_yield['Item'] == fao_item]
            if not item_df.empty:
                global_avg_yield = round(float(item_df['hg/ha_yield'].mean() / 10000.0), 2)
                india_df = item_df[item_df['Area'] == 'India']
                if not india_df.empty:
                    india_avg_yield = round(float(india_df['hg/ha_yield'].mean() / 10000.0), 2)
                else:
                    india_avg_yield = round(global_avg_yield * 0.85, 2)
                base_yield_tonnes = india_avg_yield

        temp_delta = abs(temperature - 26.5)
        temp_modifier = max(0.65, 1.0 - (temp_delta * 0.025))
        rain_modifier = 1.0
        if rainfall < 60.0:
            rain_modifier = max(0.6, rainfall / 60.0)
        elif rainfall > 280.0:
            rain_modifier = max(0.75, 1.0 - ((rainfall - 280.0) * 0.001))

        projected = round(base_yield_tonnes * temp_modifier * rain_modifier, 2)
        variance_pct = round(((projected - india_avg_yield) / (india_avg_yield + 1e-6)) * 100, 1)

        seedling_score = int(max(40, min(98, 85 - (temp_delta * 2.5) + (10 if 60 <= humidity <= 85 else -10))))
        seedling_status = "Optimal Establishment" if seedling_score >= 80 else "Moderate Establishment" if seedling_score >= 60 else "Vulnerable to Stress"

        return {
            "crop": crop,
            "projected_yield_tonnes_ha": projected,
            "projected_yield_quintals_ha": round(projected * 10, 1),
            "india_average_yield_tonnes": india_avg_yield,
            "global_average_yield_tonnes": global_avg_yield,
            "yield_variance_vs_india_pct": variance_pct,
            "fao_benchmark_crop": fao_item,
            "seedling_viability_score": seedling_score,
            "seedling_viability_status": seedling_status,
            "estimated_soil_moisture_index": int(min(100, max(20, (humidity * 0.5) + (rainfall * 0.15)))),
            "seedling_management_advice": "Ensure adequate soil saturation during nursery emergence; avoid waterlogging."
        }


# Global advisor singletons
fertilizer_advisor = FertilizerAdvisor()
irrigation_advisor = IrrigationAdvisor()
yield_predictor = YieldPredictor()


# ==============================================================================
# 7. REAL-TIME PREDICTION ENGINE & EXPLANATION OUTPUT
# ==============================================================================

class CropPredictor:
    """Predictor service holding in-memory models for real-time dual-model inference."""

    def __init__(
        self,
        dt_path: str | Path = "ml/saved_models/decision_tree.json",
        knn_path: str | Path = "ml/saved_models/knn.json",
        encoder_path: str | Path = "ml/saved_models/label_encoder.json"
    ):
        self.dt_path = resolve_path(dt_path)
        self.knn_path = resolve_path(knn_path)
        self.encoder_path = resolve_path(encoder_path)

        self.dt_model: Optional[DecisionTreeClassifierScratch] = None
        self.knn_model: Optional[KNNClassifierScratch] = None
        self.label_encoder_data: Optional[Dict[str, Any]] = None
        self.is_loaded = False
        self._load_models()

    def _load_models(self) -> None:
        if self.dt_path.exists() and self.knn_path.exists():
            self.dt_model = load_decision_tree(self.dt_path)
            self.knn_model = load_knn(self.knn_path)
            if self.encoder_path.exists():
                self.label_encoder_data = load_json(self.encoder_path)
            self.is_loaded = True

    def reload(self) -> None:
        self._load_models()

    def predict(
        self,
        N: float,
        P: float,
        K: float,
        temperature: float,
        humidity: float,
        ph: float,
        rainfall: float,
        top_n: int = 3
    ) -> Dict[str, Any]:
        """Runs dual inference using Decision Tree and KNN from scratch and aggregates explanations."""
        if not self.is_loaded or self.dt_model is None or self.knn_model is None:
            raise RuntimeError("Models are not trained or loaded yet. Run training pipeline first.")

        input_vector = np.array([N, P, K, temperature, humidity, ph, rainfall], dtype=np.float64)

        # 1. Decision Tree Prediction and Decision Path
        dt_explanation = self.dt_model.explain_prediction(input_vector)
        dt_crop = dt_explanation["predicted_crop"]
        dt_conf = dt_explanation["confidence"]
        dt_path = dt_explanation["decision_path"]

        # 2. KNN Prediction and Nearest Neighbors Breakdown
        knn_explanation = self.knn_model.explain_prediction(input_vector, top_k_classes=top_n)
        knn_crop = knn_explanation["predicted_crop"]
        knn_conf = knn_explanation["confidence"]
        knn_candidates = knn_explanation["top_candidates"]
        knn_neighbors = knn_explanation["nearest_neighbors"]

        # 3. Model Consensus Check
        models_agree = (dt_crop.strip().lower() == knn_crop.strip().lower())
        agreement_text = (
            "Models agree on the recommendation."
            if models_agree
            else "Models produce different predictions based on distinct inductive biases."
        )

        # 4. Top Predictions Aggregation
        dt_probs = dt_explanation["class_probabilities"]
        all_crops = set(list(dt_probs.keys()) + [c["crop"] for c in knn_candidates])
        combined_scores = []
        for crop in all_crops:
            p_dt = dt_probs.get(crop, 0.0)
            p_knn = next((c["probability"] for c in knn_candidates if c["crop"] == crop), 0.0)
            avg_prob = (p_dt + p_knn) / 2.0
            combined_scores.append({
                "crop": crop,
                "combined_confidence": round(avg_prob, 4),
                "dt_confidence": round(p_dt, 4),
                "knn_confidence": round(p_knn, 4)
            })
        combined_scores.sort(key=lambda item: item["combined_confidence"], reverse=True)
        top_predictions = combined_scores[:top_n]

        recommended_crop = dt_crop if models_agree or dt_conf >= knn_conf else knn_crop

        input_summary = {
            "soil_nutrients": {
                "nitrogen": {"value": N, "unit": "kg/ha", "status": "Normal" if 20 <= N <= 120 else "Extreme"},
                "phosphorus": {"value": P, "unit": "kg/ha", "status": "Normal" if 10 <= P <= 100 else "Extreme"},
                "potassium": {"value": K, "unit": "kg/ha", "status": "Normal" if 10 <= K <= 150 else "Extreme"},
            },
            "environmental_conditions": {
                "temperature": {"value": temperature, "unit": "°C", "climate": "Warm" if temperature > 25 else "Moderate"},
                "humidity": {"value": humidity, "unit": "%", "level": "High" if humidity > 70 else "Medium" if humidity > 40 else "Low"},
                "soil_ph": {"value": ph, "unit": "pH", "nature": "Neutral" if 6.0 <= ph <= 7.5 else "Acidic" if ph < 6.0 else "Alkaline"},
                "rainfall": {"value": rainfall, "unit": "mm", "precipitation": "Heavy" if rainfall > 150 else "Moderate" if rainfall > 60 else "Arid"}
            }
        }

        confidence_explanation = (
            f"Decision Tree confidence ({dt_conf * 100:.1f}%) reflects leaf node purity across training samples. "
            f"KNN confidence ({knn_conf * 100:.1f}%) reflects the proportion of the K={self.knn_model.k} closest training points."
        )

        fertilizer_rec = fertilizer_advisor.recommend(
            n=N, p=P, k=K, temp=temperature, humidity=humidity, crop=recommended_crop
        )
        irrigation_rec = irrigation_advisor.calculate_water_requirement(
            crop=recommended_crop,
            temperature=temperature,
            humidity=humidity,
            rainfall=rainfall
        )
        yield_rec = yield_predictor.project_yield(
            crop=recommended_crop,
            temperature=temperature,
            rainfall=rainfall,
            humidity=humidity
        )

        return {
            "recommended_crop": recommended_crop,
            "models_agree": models_agree,
            "agreement_message": agreement_text,
            "decision_tree": {
                "predicted_crop": dt_crop,
                "confidence": dt_conf,
                "confidence_percent": round(dt_conf * 100, 2),
                "leaf_samples": dt_explanation["leaf_samples"],
                "decision_path": dt_path
            },
            "knn": {
                "predicted_crop": knn_crop,
                "confidence": knn_conf,
                "confidence_percent": round(knn_conf * 100, 2),
                "k": self.knn_model.k,
                "confidence_explanation": knn_explanation["confidence_explanation"],
                "nearest_neighbors": knn_neighbors[:5]
            },
            "top_predictions": top_predictions,
            "confidence_explanation": confidence_explanation,
            "input_summary": input_summary,
            "fertilizer_recommendation": fertilizer_rec,
            "irrigation_advisory": irrigation_rec,
            "yield_projection": yield_rec
        }


# Global predictor singleton
_crop_predictor_instance: Optional[CropPredictor] = None


def get_crop_predictor() -> CropPredictor:
    """Returns the globally cached CropPredictor instance."""
    global _crop_predictor_instance
    if _crop_predictor_instance is None:
        _crop_predictor_instance = CropPredictor()
    return _crop_predictor_instance


def demonstrate_prediction(dt: DecisionTreeClassifierScratch, knn: KNNClassifierScratch) -> None:
    """Executes dual inference on a realistic sample and displays transparent explanations."""
    print("\n" + "=" * 80)
    print("STEP 6: REAL-TIME DUAL MODEL INFERENCE DEMONSTRATION")
    print("=" * 80)

    sample_input = {
        "N": 90.0,
        "P": 42.0,
        "K": 43.0,
        "temperature": 25.6,
        "humidity": 80.0,
        "ph": 6.5,
        "rainfall": 202.4
    }
    input_vector = np.array([sample_input[feat] for feat in FEATURES])

    print("Input Soil & Environmental Conditions:")
    for feat, val in sample_input.items():
        print(f"  - {feat.capitalize():12}: {val}")

    dt_exp = dt.explain_prediction(input_vector)
    print("\n[MODEL 1: DECISION TREE RESULT]")
    print(f"  Recommended Crop : {dt_exp['predicted_crop'].upper()}")
    print(f"  Confidence       : {dt_exp['confidence'] * 100:.1f}%")
    print("  Decision Path Rules Traversed:")
    for step in dt_exp["decision_path"][:4]:
        status = "PASSED" if step["satisfied"] else "FAILED"
        print(f"    --> {step['condition']:<22} | Actual = {step['actual_value']:<6} [{status}] -> branch {step['direction']}")

    knn_exp = knn.explain_prediction(input_vector)
    print("\n[MODEL 2: K-NEAREST NEIGHBORS RESULT]")
    print(f"  Recommended Crop : {knn_exp['predicted_crop'].upper()}")
    print(f"  Confidence       : {knn_exp['confidence'] * 100:.1f}%")
    print(f"  Top 3 Nearest Historical Farm Instances:")
    neighbors = knn_exp.get("nearest_neighbors", knn_exp.get("k_neighbors", []))
    for neighbor in neighbors[:3]:
        print(f"    Rank #{neighbor['rank']}: Crop = {neighbor['crop_label'].upper():<10} | Euclidean Distance = {neighbor['distance']:.4f}")

    agree = (dt_exp["predicted_crop"].lower() == knn_exp["predicted_crop"].lower())
    print("\n[DUAL MODEL CONSENSUS CHECK]")
    if agree:
        print(f"  STATUS: CONSENSUS REACHED! Both models independently recommend '{dt_exp['predicted_crop'].upper()}'.")
    else:
        print("  STATUS: DIVERGENCE! Models surfaced different candidates based on distinct inductive biases.")

    print("\n[AGRONOMIC ADVISORY EXTENSION]")
    fert = fertilizer_advisor.recommend(90.0, 42.0, 43.0, crop=dt_exp['predicted_crop'])
    print(f"  Fertilizer Recommendation: {fert['recommended_fertilizer']} ({fert['grade']})")
    irrig = irrigation_advisor.calculate_water_requirement(dt_exp['predicted_crop'], 25.6, 80.0, 202.4)
    print(f"  Water Requirement        : {irrig['daily_water_mm']} mm/day ({irrig['recommended_system']})")
    yld = yield_predictor.project_yield(dt_exp['predicted_crop'], 25.6, 202.4, 80.0)
    print(f"  Projected Yield          : {yld['projected_yield_tonnes_ha']} tonnes/ha (India Avg: {yld['india_average_yield_tonnes']})")
    print("=" * 80)


# ==============================================================================
# 8. MAIN PIPELINE EXECUTION
# ==============================================================================

def main():
    print("=" * 80)
    print("CROP INTELLIGENCE — END-TO-END MACHINE LEARNING DEMONSTRATION")
    print("=" * 80)

    # 1. Load Dataset
    print("\n[1/6] Loading Dataset...")
    csv_file = find_dataset_path()
    df_raw = load_dataset(csv_file)
    print(f"  Loaded {len(df_raw)} records from {csv_file.name}")

    # 2. Data Cleaning & Validation
    print("\n[2/6] Cleaning & Validating Data...")
    df_clean, audit = clean_and_validate_data(df_raw)
    print(f"  Missing Values: {audit['missing_values_found']} | Duplicates: {audit['duplicate_rows_removed']}")
    print(f"  Verified Clean Dataset: {len(df_clean)} records across {audit['classes_count']} unique crop varieties.")

    # 3. Feature Selection & Preprocessing
    print("\n[3/6] Preprocessing & Stratified 80/20 Train-Test Split...")
    data_dict = preprocess_and_split(df_clean, test_size=0.2, random_state=42)
    print(f"  Training Set: {len(data_dict['X_train_raw'])} samples | Test Set: {len(data_dict['X_test_raw'])} samples")
    print(f"  Features ({len(FEATURES)}): {', '.join(FEATURES)}")

    # 4 & 5. Model Training, Persistence & 5-Fold Cross-Validation
    print("\n[4/6 & 5/6] Training Models From Scratch & Cross-Validation...")
    dt_model, knn_model = train_and_evaluate(data_dict)

    # 6. Real-time Prediction Output & Advisory Demonstration
    demonstrate_prediction(dt_model, knn_model)


if __name__ == "__main__":
    main()

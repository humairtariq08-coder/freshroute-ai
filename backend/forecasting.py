"""Small, reproducible forecasting baselines with walk-forward evaluation."""
from statistics import mean


def moving_average(values, window=3):
    return mean(values[-window:])


def exponential_smoothing(values, alpha=0.4):
    level = values[0]
    for value in values[1:]:
        level = alpha * value + (1 - alpha) * level
    return level


def evaluate(history):
    values = [float(row["demand"]) for row in history]
    methods = {"moving_average": moving_average, "exponential_smoothing": exponential_smoothing}
    results = {}
    for name, method in methods.items():
        errors = []
        for split in range(3, len(values)):
            errors.append(abs(values[split] - method(values[:split])))
        results[name] = {"forecast_kg": round(method(values), 1), "mae_kg": round(mean(errors), 1) if errors else None,
                         "test_points": len(errors)}
    selected = min(results, key=lambda name: results[name]["mae_kg"] if results[name]["mae_kg"] is not None else float("inf"))
    return {"methods": results, "selected_method": selected, "forecast_kg": results[selected]["forecast_kg"],
            "evaluation": "expanding-window one-step-ahead MAE", "evaluated": bool(results[selected]["test_points"])}

import pandas as pd
from sklearn.model_selection import train_test_split
from xgboost import XGBRegressor
import joblib

# -----------------------------
# 1️⃣ Load data
# -----------------------------
df = pd.read_csv('fleet_routes_neurofleetx.csv')
print("✅ Data loaded:", len(df))

# -----------------------------
# 2️⃣ Convert traffic_level to numeric
# -----------------------------
traffic_map = {'Low': 0.2, 'Medium': 0.5, 'High': 0.8}
df['traffic_level'] = df['traffic_level'].map(traffic_map)

# -----------------------------
# 3️⃣ Split features & target
# -----------------------------
feature_cols = ['distance_km', 'avg_speed', 'traffic_level', 'battery_level', 'fuel_level']
X = df[feature_cols]
y = df['historical_eta_minutes']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# -----------------------------
# 4️⃣ Train XGBoost Regressor
# -----------------------------
model = XGBRegressor(
    n_estimators=300,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.9,
    colsample_bytree=0.8,
    random_state=42
)

print("🚀 Training ETA prediction model...")
model.fit(X_train, y_train)

# -----------------------------
# 5️⃣ Evaluate model
# -----------------------------
score = model.score(X_test, y_test)
print(f"📈 Model R² Score: {score:.3f}")

# -----------------------------
# 6️⃣ Save trained model
# -----------------------------
joblib.dump(model, 'eta_model_neurofleetx.pkl')
print("💾 Model saved as 'eta_model_neurofleetx.pkl'")

import pandas as pd
import numpy as np

# -----------------------------
# 1️⃣ Set random seed for reproducibility
# -----------------------------
np.random.seed(100)

# -----------------------------
# 2️⃣ Generate synthetic data
# -----------------------------
num_samples = 2500  # More samples for better ML

# Features
distance_km = np.random.uniform(5, 120, num_samples).round(2)
avg_speed = np.random.uniform(20, 120, num_samples).round(2)
traffic_level = np.random.choice(['Low', 'Medium', 'High'], num_samples, p=[0.5, 0.3, 0.2])
battery_level = np.random.uniform(10, 100, num_samples).round(2)
fuel_level = np.random.uniform(0, 100, num_samples).round(2)

# -----------------------------
# 3️⃣ Create target ETA
# -----------------------------
# ETA increases with distance and traffic, decreases with speed
historical_eta_minutes = (
    (distance_km / avg_speed) * 60 +  # base ETA
    np.random.normal(0, 5, num_samples) +  # noise
    np.where(traffic_level == 'High', 20,
             np.where(traffic_level == 'Medium', 10, 0))  # traffic penalty
)
historical_eta_minutes = np.maximum(0, historical_eta_minutes).round(2)

# -----------------------------
# 4️⃣ Create DataFrame
# -----------------------------
df = pd.DataFrame({
    'distance_km': distance_km,
    'avg_speed': avg_speed,
    'traffic_level': traffic_level,
    'battery_level': battery_level,
    'fuel_level': fuel_level,
    'historical_eta_minutes': historical_eta_minutes
})

# -----------------------------
# 5️⃣ Save CSV for training
# -----------------------------
file_path = 'fleet_routes_neurofleetx.csv'
df.to_csv(file_path, index=False)
print(f"✅ Dataset saved to '{file_path}'")
print(df.head())

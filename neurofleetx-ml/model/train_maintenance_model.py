import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingClassifier
import joblib

# Set random seed
np.random.seed(42)

# Generate synthetic vehicle health data
num_samples = 2500

# Vehicle health parameters
vehicle_ids = np.random.randint(1, 100, num_samples)
mileage = np.random.uniform(0, 150000, num_samples).round(0)
engine_temp = np.random.uniform(70, 120, num_samples).round(1)
tire_pressure = np.random.uniform(25, 40, num_samples).round(1)
battery_health = np.random.uniform(40, 100, num_samples).round(1)
oil_level = np.random.uniform(20, 100, num_samples).round(1)
brake_wear = np.random.uniform(0, 100, num_samples).round(1)
days_since_last_maintenance = np.random.randint(0, 365, num_samples)

# Target: Maintenance needed (0 = Healthy, 1 = Due, 2 = Critical)
maintenance_status = np.zeros(num_samples, dtype=int)

for i in range(num_samples):
    risk_score = 0
    
    # High mileage increases risk
    if mileage[i] > 100000:
        risk_score += 2
    elif mileage[i] > 50000:
        risk_score += 1
    
    # High engine temp
    if engine_temp[i] > 105:
        risk_score += 2
    elif engine_temp[i] > 95:
        risk_score += 1
    
    # Low tire pressure
    if tire_pressure[i] < 30:
        risk_score += 1
    
    # Low battery health
    if battery_health[i] < 60:
        risk_score += 2
    elif battery_health[i] < 80:
        risk_score += 1
    
    # Low oil level
    if oil_level[i] < 40:
        risk_score += 2
    elif oil_level[i] < 60:
        risk_score += 1
    
    # High brake wear
    if brake_wear[i] > 70:
        risk_score += 2
    elif brake_wear[i] > 50:
        risk_score += 1
    
    # Long time since maintenance
    if days_since_last_maintenance[i] > 180:
        risk_score += 2
    elif days_since_last_maintenance[i] > 90:
        risk_score += 1
    
    # Determine status
    if risk_score >= 6:
        maintenance_status[i] = 2  # Critical
    elif risk_score >= 3:
        maintenance_status[i] = 1  # Due
    else:
        maintenance_status[i] = 0  # Healthy

# Create DataFrame
df = pd.DataFrame({
    'vehicle_id': vehicle_ids,
    'mileage': mileage,
    'engine_temp': engine_temp,
    'tire_pressure': tire_pressure,
    'battery_health': battery_health,
    'oil_level': oil_level,
    'brake_wear': brake_wear,
    'days_since_last_maintenance': days_since_last_maintenance,
    'maintenance_status': maintenance_status
})

# Save dataset
df.to_csv('vehicle_health_neurofleetx.csv', index=False)
print(f"✅ Vehicle health dataset created: {len(df)} samples")

# Features and target
feature_cols = ['mileage', 'engine_temp', 'tire_pressure', 'battery_health', 
                'oil_level', 'brake_wear', 'days_since_last_maintenance']
X = df[feature_cols]
y = df['maintenance_status']

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train Gradient Boosting Classifier
model = GradientBoostingClassifier(
    n_estimators=200,
    max_depth=5,
    learning_rate=0.1,
    random_state=42
)

print("🚀 Training maintenance prediction model...")
model.fit(X_train, y_train)

# Evaluate
score = model.score(X_test, y_test)
print(f"📈 Model Accuracy: {score:.3f}")

# Save model
joblib.dump(model, 'maintenance_prediction_model.pkl')
print("💾 Model saved as 'maintenance_prediction_model.pkl'")

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from xgboost import XGBRegressor
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
import joblib
from datetime import datetime

print("="*60)
print("🚀 NeuroFleetX ML Training Pipeline")
print("="*60)

# ==========================================
# 1️⃣ GENERATE & TRAIN ETA MODEL
# ==========================================
print("\n📊 [1/3] ETA Prediction Model")
print("-" * 60)

np.random.seed(100)
num_samples = 2500

# Generate ETA data
distance_km = np.random.uniform(5, 120, num_samples).round(2)
avg_speed = np.random.uniform(20, 120, num_samples).round(2)
traffic_level_str = np.random.choice(['Low', 'Medium', 'High'], num_samples, p=[0.5, 0.3, 0.2])
battery_level = np.random.uniform(10, 100, num_samples).round(2)
fuel_level = np.random.uniform(0, 100, num_samples).round(2)

# Create target ETA
historical_eta_minutes = (
    (distance_km / avg_speed) * 60 +
    np.random.normal(0, 5, num_samples) +
    np.where(traffic_level_str == 'High', 20,
             np.where(traffic_level_str == 'Medium', 10, 0))
)
historical_eta_minutes = np.maximum(0, historical_eta_minutes).round(2)

# Create DataFrame
df_eta = pd.DataFrame({
    'distance_km': distance_km,
    'avg_speed': avg_speed,
    'traffic_level': traffic_level_str,
    'battery_level': battery_level,
    'fuel_level': fuel_level,
    'historical_eta_minutes': historical_eta_minutes
})

# Save CSV
df_eta.to_csv('fleet_routes_neurofleetx.csv', index=False)
print(f"✅ Dataset generated: {len(df_eta)} samples")

# Convert traffic to numeric
traffic_map = {'Low': 0.2, 'Medium': 0.5, 'High': 0.8}
df_eta['traffic_level'] = df_eta['traffic_level'].map(traffic_map)

# Train model
feature_cols_eta = ['distance_km', 'avg_speed', 'traffic_level', 'battery_level', 'fuel_level']
X_eta = df_eta[feature_cols_eta]
y_eta = df_eta['historical_eta_minutes']

X_train_eta, X_test_eta, y_train_eta, y_test_eta = train_test_split(
    X_eta, y_eta, test_size=0.2, random_state=42
)

eta_model = XGBRegressor(
    n_estimators=300,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.9,
    colsample_bytree=0.8,
    random_state=42
)

print("🚀 Training XGBoost ETA model...")
eta_model.fit(X_train_eta, y_train_eta)

eta_score = eta_model.score(X_test_eta, y_test_eta)
print(f"📈 ETA Model R² Score: {eta_score:.3f}")

joblib.dump(eta_model, 'eta_model_neurofleetx.pkl')
print("💾 ETA model saved ✓")

# ==========================================
# 2️⃣ GENERATE & TRAIN MAINTENANCE MODEL
# ==========================================
print("\n📊 [2/3] Maintenance Prediction Model")
print("-" * 60)

np.random.seed(42)
num_samples = 2500

# Generate maintenance data
vehicle_ids = np.random.randint(1, 100, num_samples)
mileage = np.random.uniform(0, 150000, num_samples).round(0)
engine_temp = np.random.uniform(70, 120, num_samples).round(1)
tire_pressure = np.random.uniform(25, 40, num_samples).round(1)
battery_health = np.random.uniform(40, 100, num_samples).round(1)
oil_level = np.random.uniform(20, 100, num_samples).round(1)
brake_wear = np.random.uniform(0, 100, num_samples).round(1)
days_since_last_maintenance = np.random.randint(0, 365, num_samples)

# Create target: Maintenance status
maintenance_status = np.zeros(num_samples, dtype=int)

for i in range(num_samples):
    risk_score = 0
    
    # High mileage
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
df_maintenance = pd.DataFrame({
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

# Save CSV
df_maintenance.to_csv('vehicle_health_neurofleetx.csv', index=False)
print(f"✅ Dataset generated: {len(df_maintenance)} samples")

# Train model
feature_cols_maint = ['mileage', 'engine_temp', 'tire_pressure', 'battery_health', 
                      'oil_level', 'brake_wear', 'days_since_last_maintenance']
X_maint = df_maintenance[feature_cols_maint]
y_maint = df_maintenance['maintenance_status']

X_train_maint, X_test_maint, y_train_maint, y_test_maint = train_test_split(
    X_maint, y_maint, test_size=0.2, random_state=42
)

maintenance_model = GradientBoostingClassifier(
    n_estimators=200,
    max_depth=5,
    learning_rate=0.1,
    random_state=42
)

print("🚀 Training Gradient Boosting Maintenance model...")
maintenance_model.fit(X_train_maint, y_train_maint)

maint_score = maintenance_model.score(X_test_maint, y_test_maint)
print(f"📈 Maintenance Model Accuracy: {maint_score:.3f}")

joblib.dump(maintenance_model, 'maintenance_prediction_model.pkl')
print("💾 Maintenance model saved ✓")

# ==========================================
# 3️⃣ GENERATE & TRAIN RECOMMENDATION MODEL
# ==========================================
print("\n📊 [3/3] Vehicle Recommendation Model")
print("-" * 60)

np.random.seed(42)
num_samples = 3000

# Generate booking data
customer_ids = np.random.randint(1, 100, num_samples)
vehicle_types = np.random.choice(['Car', 'Van', 'Truck', 'EV', 'Bike'], num_samples)
seats_needed = np.random.choice([2, 4, 5, 7, 8], num_samples)
is_ev_preferred = np.random.choice([0, 1], num_samples, p=[0.6, 0.4])
distance_km = np.random.uniform(5, 200, num_samples).round(2)
booking_hour = np.random.randint(0, 24, num_samples)
day_of_week = np.random.randint(0, 7, num_samples)
price_range = np.random.choice(['Budget', 'Standard', 'Premium'], num_samples)

# Map price range
price_map = {'Budget': 0, 'Standard': 1, 'Premium': 2}
price_numeric = np.array([price_map[p] for p in price_range])

# Generate vehicle IDs based on preferences
vehicle_id = np.zeros(num_samples, dtype=int)
for i in range(num_samples):
    if vehicle_types[i] == 'EV' and is_ev_preferred[i] == 1:
        vehicle_id[i] = np.random.randint(1, 10)
    elif vehicle_types[i] == 'Van':
        vehicle_id[i] = np.random.randint(10, 20)
    elif vehicle_types[i] == 'Truck':
        vehicle_id[i] = np.random.randint(20, 30)
    elif vehicle_types[i] == 'Bike':
        vehicle_id[i] = np.random.randint(30, 40)
    else:
        vehicle_id[i] = np.random.randint(40, 50)

# Create DataFrame
df_booking = pd.DataFrame({
    'customer_id': customer_ids,
    'vehicle_type': vehicle_types,
    'seats_needed': seats_needed,
    'is_ev_preferred': is_ev_preferred,
    'distance_km': distance_km,
    'booking_hour': booking_hour,
    'day_of_week': day_of_week,
    'price_range': price_numeric,
    'vehicle_id': vehicle_id
})

# Save CSV
df_booking.to_csv('booking_history_neurofleetx.csv', index=False)
print(f"✅ Dataset generated: {len(df_booking)} samples")

# Convert categorical to numeric
type_map = {'Car': 0, 'Van': 1, 'Truck': 2, 'EV': 3, 'Bike': 4}
df_booking['vehicle_type_numeric'] = df_booking['vehicle_type'].map(type_map)

# Train model
feature_cols_booking = ['vehicle_type_numeric', 'seats_needed', 'is_ev_preferred', 
                        'distance_km', 'booking_hour', 'day_of_week', 'price_range']
X_booking = df_booking[feature_cols_booking]
y_booking = df_booking['vehicle_id']

X_train_booking, X_test_booking, y_train_booking, y_test_booking = train_test_split(
    X_booking, y_booking, test_size=0.2, random_state=42
)

recommendation_model = RandomForestClassifier(
    n_estimators=200,
    max_depth=15,
    min_samples_split=5,
    random_state=42
)

print("🚀 Training Random Forest Recommendation model...")
recommendation_model.fit(X_train_booking, y_train_booking)

rec_score = recommendation_model.score(X_test_booking, y_test_booking)
print(f"📈 Recommendation Model Accuracy: {rec_score:.3f}")

joblib.dump(recommendation_model, 'vehicle_recommendation_model.pkl')
print("💾 Recommendation model saved ✓")

# ==========================================
# 🎉 SUMMARY
# ==========================================
print("\n" + "="*60)
print("✅ ALL MODELS TRAINED SUCCESSFULLY!")
print("="*60)
print("\n📊 Model Performance Summary:")
print(f"   1️⃣  ETA Model           → R² Score: {eta_score:.3f}")
print(f"   2️⃣  Maintenance Model   → Accuracy: {maint_score:.3f}")
print(f"   3️⃣  Recommendation Model → Accuracy: {rec_score:.3f}")

print("\n💾 Files Created:")
print("   ✓ eta_model_neurofleetx.pkl")
print("   ✓ maintenance_prediction_model.pkl")
print("   ✓ vehicle_recommendation_model.pkl")

print("\n📁 Data Files Created:")
print("   ✓ fleet_routes_neurofleetx.csv")
print("   ✓ vehicle_health_neurofleetx.csv")
print("   ✓ booking_history_neurofleetx.csv")

print("\n🚀 Next Steps:")
print("   1. Run: python app.py")
print("   2. Server will start on http://localhost:5001")
print("   3. Test endpoints with Postman")
print("\n" + "="*60)

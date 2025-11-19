import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import joblib

# Set random seed
np.random.seed(42)

# Generate synthetic booking history data
num_samples = 3000

# Customer preferences
customer_ids = np.random.randint(1, 100, num_samples)
vehicle_types = np.random.choice(['Car', 'Van', 'Truck', 'EV', 'Bike'], num_samples)
seats_needed = np.random.choice([2, 4, 5, 7, 8], num_samples)
is_ev_preferred = np.random.choice([0, 1], num_samples, p=[0.6, 0.4])
distance_km = np.random.uniform(5, 200, num_samples).round(2)
booking_hour = np.random.randint(0, 24, num_samples)
day_of_week = np.random.randint(0, 7, num_samples)
price_range = np.random.choice(['Budget', 'Standard', 'Premium'], num_samples)

# Map price range to numeric
price_map = {'Budget': 0, 'Standard': 1, 'Premium': 2}
price_numeric = np.array([price_map[p] for p in price_range])

# Target: Vehicle ID that was booked (1-50)
# Generate based on preferences with some logic
vehicle_id = np.zeros(num_samples, dtype=int)
for i in range(num_samples):
    if vehicle_types[i] == 'EV' and is_ev_preferred[i] == 1:
        vehicle_id[i] = np.random.randint(1, 10)  # EVs 1-9
    elif vehicle_types[i] == 'Van':
        vehicle_id[i] = np.random.randint(10, 20)  # Vans 10-19
    elif vehicle_types[i] == 'Truck':
        vehicle_id[i] = np.random.randint(20, 30)  # Trucks 20-29
    elif vehicle_types[i] == 'Bike':
        vehicle_id[i] = np.random.randint(30, 40)  # Bikes 30-39
    else:
        vehicle_id[i] = np.random.randint(40, 50)  # Cars 40-49

# Create DataFrame
df = pd.DataFrame({
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

# Save dataset
df.to_csv('booking_history_neurofleetx.csv', index=False)
print(f"✅ Booking history dataset created: {len(df)} samples")

# Convert categorical to numeric
type_map = {'Car': 0, 'Van': 1, 'Truck': 2, 'EV': 3, 'Bike': 4}
df['vehicle_type_numeric'] = df['vehicle_type'].map(type_map)

# Features and target
feature_cols = ['vehicle_type_numeric', 'seats_needed', 'is_ev_preferred', 
                'distance_km', 'booking_hour', 'day_of_week', 'price_range']
X = df[feature_cols]
y = df['vehicle_id']

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train Random Forest Classifier
model = RandomForestClassifier(
    n_estimators=200,
    max_depth=15,
    min_samples_split=5,
    random_state=42
)

print("🚀 Training vehicle recommendation model...")
model.fit(X_train, y_train)

# Evaluate
score = model.score(X_test, y_test)
print(f"📈 Model Accuracy: {score:.3f}")

# Save model
joblib.dump(model, 'vehicle_recommendation_model.pkl')
print("💾 Model saved as 'vehicle_recommendation_model.pkl'")

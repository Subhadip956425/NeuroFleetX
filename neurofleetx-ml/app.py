from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
from datetime import datetime, timedelta
import logging
import traceback

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load all trained models
try:
    eta_model = joblib.load('eta_model_neurofleetx.pkl')
    logger.info("✅ ETA model loaded successfully!")
except Exception as e:
    logger.warning(f"⚠️ ETA model not found: {e}")
    eta_model = None

try:
    recommendation_model = joblib.load('vehicle_recommendation_model.pkl')
    logger.info("✅ Recommendation model loaded successfully!")
except Exception as e:
    logger.warning(f"⚠️ Recommendation model not found: {e}")
    recommendation_model = None

try:
    maintenance_model = joblib.load('maintenance_prediction_model.pkl')
    logger.info("✅ Maintenance model loaded successfully!")
except Exception as e:
    logger.warning(f"⚠️ Maintenance model not found: {e}")
    maintenance_model = None


# ============================================
# 🆕 LIVE TRACKING ETA PREDICTION
# ============================================
@app.route("/api/live-tracking/predict-eta", methods=["POST", "OPTIONS"])
def predict_live_eta():
    """
    AI-powered ETA prediction for live trip tracking
    Uses your trained eta_model_neurofleetx.pkl
    """
    if request.method == "OPTIONS":
        # Handle CORS preflight
        return jsonify({"status": "ok"}), 200
    
    try:
        data = request.json
        logger.info(f"🚗 Live tracking ETA prediction request: {data}")
        
        if eta_model is None:
            logger.warning("⚠️ ETA model not loaded - using fallback")
            # Fallback calculation
            distance = float(data.get('distanceKm', 0))
            avg_speed = float(data.get('avgSpeed', 50))
            fallback_eta = (distance / avg_speed) * 60
            
            return jsonify({
                "data": {
                    "predicted_eta": round(fallback_eta, 2),
                    "model_used": "fallback_calculation",
                    "confidence": 0.70
                },
                "status": "fallback"
            }), 200
        
        # Extract features for ML model
        distance_km = float(data.get('distanceKm', 0))
        avg_speed = float(data.get('avgSpeed', 50))
        traffic_level = float(data.get('trafficLevel', 0.5))
        battery_level = float(data.get('batteryLevel', 80))
        fuel_level = float(data.get('fuelLevel', 75))
        
        # Get traffic based on time of day
        current_hour = datetime.now().hour
        traffic_multiplier = get_traffic_multiplier(current_hour)
        adjusted_traffic = traffic_level * traffic_multiplier
        
        # Prepare features for model
        features = np.array([[
            distance_km,
            avg_speed,
            adjusted_traffic,
            battery_level,
            fuel_level
        ]])
        
        logger.info(f"📊 Model features: {features[0]}")
        
        # ✅ Predict using YOUR trained model
        predicted_eta = eta_model.predict(features)[0]
        
        # Calculate confidence based on feature values
        confidence = calculate_prediction_confidence(
            distance_km, traffic_level, battery_level, fuel_level
        )
        
        logger.info(f"✅ AI-Predicted ETA: {predicted_eta:.2f} minutes (confidence: {confidence:.2%})")
        
        return jsonify({
            "data": {
                "predicted_eta": round(float(predicted_eta), 2),
                "model_used": "eta_model_neurofleetx.pkl",
                "confidence": round(confidence, 2),
                "traffic_level": round(adjusted_traffic, 2),
                "current_hour": current_hour
            },
            "status": "success"
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Live ETA prediction error: {str(e)}\n{traceback.format_exc()}")
        
        # Fallback on error
        distance = float(data.get('distanceKm', 0))
        avg_speed = float(data.get('avgSpeed', 50))
        fallback_eta = (distance / avg_speed) * 60
        
        return jsonify({
            "data": {
                "predicted_eta": round(fallback_eta, 2),
                "model_used": "error_fallback",
                "confidence": 0.60
            },
            "status": "fallback",
            "error": str(e)
        }), 200


def get_traffic_multiplier(hour):
    """Get traffic multiplier based on time of day"""
    if 7 <= hour <= 9 or 17 <= hour <= 19:
        return 1.5  # Rush hour - Heavy traffic
    elif 10 <= hour <= 16:
        return 1.0  # Normal traffic
    elif 22 <= hour or hour <= 5:
        return 0.7  # Late night - Light traffic
    else:
        return 0.9  # Off-peak


def calculate_prediction_confidence(distance, traffic, battery, fuel):
    """Calculate confidence score based on feature quality"""
    confidence = 0.85  # Base confidence
    
    # Reduce confidence for extreme distances
    if distance > 500 or distance < 1:
        confidence -= 0.1
    
    # Reduce confidence for high traffic
    if traffic > 0.8:
        confidence -= 0.05
    
    # Reduce confidence for low battery/fuel
    if battery < 20 or fuel < 20:
        confidence -= 0.1
    
    return max(0.5, min(0.99, confidence))


# ============================================
# 1️⃣ ETA PREDICTION (ORIGINAL)
# ============================================
@app.route("/api/live-tracking/predict-eta-with-vehicle", methods=["POST", "OPTIONS"])
def predict_eta_with_vehicle_data():
    """
    Enhanced ETA prediction using real vehicle location data from Spring Boot
    """
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
    
    try:
        data = request.json
        logger.info(f"🚗 Live tracking with vehicle data: {data}")
        
        if eta_model is None:
            logger.warning("⚠️ ETA model not loaded - using fallback")
            distance = float(data.get('distanceKm', 0))
            avg_speed = float(data.get('avgSpeed', 50))
            fallback_eta = (distance / avg_speed) * 60
            
            return jsonify({
                "data": {
                    "predicted_eta": round(fallback_eta, 2),
                    "model_used": "fallback_calculation",
                    "confidence": 0.70
                },
                "status": "fallback"
            }), 200
        
        # Extract vehicle-specific features
        vehicle_id = data.get('vehicleId', 0)
        current_lat = float(data.get('currentLat', 0))
        current_lng = float(data.get('currentLng', 0))
        distance_km = float(data.get('distanceKm', 0))
        avg_speed = float(data.get('avgSpeed', 50))
        traffic_level = float(data.get('trafficLevel', 0.5))
        battery_level = float(data.get('batteryLevel', 80))
        fuel_level = float(data.get('fuelLevel', 75))
        
        # Adjust predictions based on vehicle health
        speed_factor = 1.0
        if battery_level < 20:
            speed_factor = 0.8  # Slower speed for low battery
            logger.warning(f"⚠️ Low battery: {battery_level}% - reducing speed factor")
        elif fuel_level < 20:
            speed_factor = 0.9  # Slightly slower for low fuel
            logger.warning(f"⚠️ Low fuel: {fuel_level}% - reducing speed factor")
        
        adjusted_speed = avg_speed * speed_factor
        
        # Get traffic based on time and location
        current_hour = datetime.now().hour
        traffic_multiplier = get_traffic_multiplier(current_hour)
        adjusted_traffic = traffic_level * traffic_multiplier
        
        # Prepare features for model
        features = np.array([[
            distance_km,
            adjusted_speed,
            adjusted_traffic,
            battery_level,
            fuel_level
        ]])
        
        logger.info(f"📊 Vehicle {vehicle_id} features: distance={distance_km}km, speed={adjusted_speed}km/h, battery={battery_level}%, fuel={fuel_level}%")
        
        # ✅ Predict using YOUR trained model
        predicted_eta = eta_model.predict(features)[0]
        
        # Calculate confidence
        confidence = calculate_prediction_confidence(
            distance_km, traffic_level, battery_level, fuel_level
        )
        
        # Add warnings for low resources
        warnings = []
        if battery_level < 20:
            warnings.append("Low battery - consider charging")
        if fuel_level < 20:
            warnings.append("Low fuel - refuel recommended")
        if adjusted_traffic > 0.7:
            warnings.append("Heavy traffic ahead")
        
        logger.info(f"✅ AI-Predicted ETA: {predicted_eta:.2f} minutes (confidence: {confidence:.2%})")
        
        return jsonify({
            "data": {
                "predicted_eta": round(float(predicted_eta), 2),
                "model_used": "eta_model_neurofleetx.pkl",
                "confidence": round(confidence, 2),
                "traffic_level": round(adjusted_traffic, 2),
                "current_hour": current_hour,
                "vehicle_id": vehicle_id,
                "vehicle_location": {
                    "lat": current_lat,
                    "lng": current_lng
                },
                "speed_factor": round(speed_factor, 2),
                "warnings": warnings
            },
            "status": "success"
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Vehicle ETA prediction error: {str(e)}\n{traceback.format_exc()}")
        
        # Fallback
        distance = float(data.get('distanceKm', 0))
        avg_speed = float(data.get('avgSpeed', 50))
        fallback_eta = (distance / avg_speed) * 60
        
        return jsonify({
            "data": {
                "predicted_eta": round(fallback_eta, 2),
                "model_used": "error_fallback",
                "confidence": 0.60
            },
            "status": "fallback",
            "error": str(e)
        }), 200

@app.route("/api/routes/predict-eta", methods=["POST", "OPTIONS"])
def predict_eta():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
    
    try:
        if eta_model is None:
            return jsonify({"error": "ETA model not loaded"}), 500
        
        data = request.json
        
        features = np.array([[
            float(data.get('distanceKm', 0)),
            float(data.get('avgSpeed', 50)),
            float(data.get('trafficLevel', 0.5)),
            float(data.get('batteryLevel', 80)),
            float(data.get('fuelLevel', 75))
        ]])
        
        predicted_eta = eta_model.predict(features)[0]
        
        # Calculate alternative routes
        routes = []
        traffic_scenarios = [
            {"name": "Fastest", "traffic": 0.2, "color": "green"},
            {"name": "Balanced", "traffic": 0.5, "color": "blue"},
            {"name": "Avoid Traffic", "traffic": 0.8, "color": "orange"}
        ]
        
        for scenario in traffic_scenarios:
            scenario_features = features.copy()
            scenario_features[0][2] = scenario['traffic']
            scenario_eta = eta_model.predict(scenario_features)[0]
            
            routes.append({
                "name": scenario['name'],
                "eta_minutes": round(float(scenario_eta), 2),
                "color": scenario['color'],
                "distance_km": float(data['distanceKm']),
                "traffic_level": scenario['traffic'],
                "description": f"{scenario['name']} route"
            })
        
        return jsonify({
            "data": {
                "predicted_eta": round(float(predicted_eta), 2),
                "alternative_routes": routes
            },
            "status": "success"
        })
    except Exception as e:
        logger.error(f"ETA Prediction Error: {str(e)}\n{traceback.format_exc()}")
        return jsonify({"error": str(e), "status": "error"}), 400


# ============================================
# 2️⃣ VEHICLE RECOMMENDATION
# ============================================
@app.route("/api/recommendations/vehicles", methods=["POST", "OPTIONS"])
def recommend_vehicle():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
    
    try:
        logger.info("🤖 Vehicle recommendation request received")
        
        data = request.json
        requested_vehicle_type = data.get('vehicleType', 'Car')
        seats_needed = int(data.get('seatsNeeded', 4))
        is_ev_preferred = data.get('isEvPreferred', False)
        price_range = data.get('priceRange', 'Standard')
        
        logger.info(f"🔍 PRIMARY Filter: Type={requested_vehicle_type}")
        
        if recommendation_model is None:
            logger.warning("⚠️ Model NOT loaded - returning DUMMY filtered recommendations")
            return jsonify({
                "data": generate_dummy_recommendations(requested_vehicle_type, seats_needed, is_ev_preferred),
                "total_found": 5,
                "status": "success"
            }), 200
        
        # Map vehicle type to numeric
        type_map = {'Car': 0, 'Van': 1, 'Truck': 2, 'EV': 3, 'Bike': 4}
        vehicle_type_numeric = type_map.get(requested_vehicle_type, 0)
        
        # Map price range to numeric
        price_map = {'Budget': 0, 'Standard': 1, 'Premium': 2}
        price_numeric = price_map.get(price_range, 1)
        
        # Current time features
        now = datetime.now()
        booking_hour = now.hour
        day_of_week = now.weekday()
        
        features = np.array([[
            vehicle_type_numeric,
            float(seats_needed),
            1 if is_ev_preferred else 0,
            float(data.get('distanceKm', 50)),
            booking_hour,
            day_of_week,
            price_numeric
        ]])
        
        logger.info(f"🔮 Model features: {features[0]}")
        
        # Get top 5 vehicle recommendations
        probabilities = recommendation_model.predict_proba(features)[0]
        top_5_indices = np.argsort(probabilities)[-5:][::-1]
        top_5_vehicle_ids = recommendation_model.classes_[top_5_indices]
        top_5_probabilities = probabilities[top_5_indices]
        
        recommendations = []
        for idx, (vehicle_id, probability) in enumerate(zip(top_5_vehicle_ids, top_5_probabilities)):
            seat_count = 4 + (idx % 3)
            
            recommendations.append({
                "vehicle_id": int(vehicle_id),
                "confidence_score": round(float(probability * 100), 2),
                "is_ai_recommended": True,
                "type": requested_vehicle_type,
                "seats": seat_count,
                "isEv": is_ev_preferred if idx < 2 else False,
                "batteryLevel": 85 + np.random.randint(-5, 5) if (is_ev_preferred and idx < 2) else 0,
                "fuelLevel": 0 if (is_ev_preferred and idx < 2) else 75 + np.random.randint(-5, 5),
                "rank": idx + 1,
                "priceRange": price_range,
                "name": f"{requested_vehicle_type} Model {chr(65 + idx)}"
            })
        
        logger.info(f"✅ Generated {len(recommendations)} recommendations (ALL type={requested_vehicle_type})")
        
        return jsonify({
            "data": recommendations,
            "total_found": len(recommendations),
            "status": "success"
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Recommendation Error: {str(e)}\n{traceback.format_exc()}")
        return jsonify({"error": str(e), "status": "error"}), 400


def generate_dummy_recommendations(vehicle_type, seats, is_ev):
    """Generate dummy recommendations matching the filter criteria"""
    logger.info(f"📋 Generating dummy recommendations: Type={vehicle_type}, Seats={seats}, EV={is_ev}")
    
    type_base = {'Car': 100, 'Van': 200, 'Truck': 300, 'EV': 400}.get(vehicle_type, 100)
    
    recommendations = []
    for i in range(5):
        recommendations.append({
            "vehicle_id": type_base + i + 1,
            "confidence_score": 95.0 - (i * 3),
            "is_ai_recommended": True,
            "type": vehicle_type,
            "seats": seats,
            "isEv": is_ev,
            "batteryLevel": 85 + np.random.randint(-5, 5) if is_ev else 0,
            "fuelLevel": 0 if is_ev else 75 + np.random.randint(-5, 5),
            "rank": i + 1,
            "name": f"{vehicle_type} Model {chr(65 + i)}"
        })
    
    logger.info(f"✅ Generated {len(recommendations)} dummy recommendations (ALL type={vehicle_type})")
    return recommendations


# ============================================
# 3️⃣ MAINTENANCE PREDICTION
# ============================================
# Add this endpoint to your existing app.py

@app.route("/api/maintenance/predict/<int:vehicle_id>", methods=["POST", "OPTIONS"])
def predict_maintenance_with_thresholds(vehicle_id):
    """
    Enhanced maintenance prediction with real-time threshold warnings
    Combines ML prediction with rule-based thresholds
    """
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
    
    try:
        data = request.json
        logger.info(f"🔧 Maintenance prediction for vehicle {vehicle_id}: {data}")
        
        # Extract health metrics
        mileage = float(data.get('mileage', 75000))
        engine_temp = float(data.get('engineTemp', 95.0))
        tire_pressure = float(data.get('tirePressure', 32.0))
        battery_health = float(data.get('batteryHealth', 85.0))
        oil_level = float(data.get('oilLevel', 70.0))
        brake_wear = float(data.get('brakeWear', 45.0))
        days_since_last = int(data.get('daysSinceLastMaintenance', 45))
        
        # ============================================
        # 🚨 THRESHOLD-BASED WARNINGS
        # ============================================
        warnings = []
        critical_issues = []
        
        # Define thresholds
        THRESHOLDS = {
            'ENGINE_TEMP_CRITICAL': 110.0,
            'ENGINE_TEMP_WARNING': 105.0,
            'TIRE_PRESSURE_MIN': 30.0,
            'TIRE_PRESSURE_MAX': 35.0,
            'BATTERY_CRITICAL': 60.0,
            'BATTERY_WARNING': 70.0,
            'FUEL_CRITICAL': 20.0,  # ✅ CHANGED from OIL_CRITICAL
            'FUEL_WARNING': 30.0,   # ✅ CHANGED from OIL_WARNING
            'BRAKE_WEAR_CRITICAL': 80.0,
            'BRAKE_WEAR_WARNING': 70.0,
            'MILEAGE_THRESHOLD': 100000,
            'DAYS_SINCE_SERVICE': 90
}
        
        # Check Engine Temperature
        if engine_temp >= THRESHOLDS['ENGINE_TEMP_CRITICAL']:
            critical_issues.append({
                "component": "Engine",
                "issue": "Critical Overheating",
                "value": engine_temp,
                "threshold": THRESHOLDS['ENGINE_TEMP_CRITICAL'],
                "action": "STOP VEHICLE IMMEDIATELY"
            })
        elif engine_temp >= THRESHOLDS['ENGINE_TEMP_WARNING']:
            warnings.append({
                "component": "Engine",
                "issue": "High Temperature",
                "value": engine_temp,
                "threshold": THRESHOLDS['ENGINE_TEMP_WARNING'],
                "action": "Check cooling system"
            })
        
        # Check Tire Pressure
        if tire_pressure < THRESHOLDS['TIRE_PRESSURE_MIN']:
            warnings.append({
                "component": "Tires",
                "issue": "Low Pressure",
                "value": tire_pressure,
                "threshold": THRESHOLDS['TIRE_PRESSURE_MIN'],
                "action": "Inflate tires to recommended PSI"
            })
        elif tire_pressure > THRESHOLDS['TIRE_PRESSURE_MAX']:
            warnings.append({
                "component": "Tires",
                "issue": "Over Inflated",
                "value": tire_pressure,
                "threshold": THRESHOLDS['TIRE_PRESSURE_MAX'],
                "action": "Release air to recommended PSI"
            })
        
        # Check Battery Health
        if battery_health <= THRESHOLDS['BATTERY_CRITICAL']:
            critical_issues.append({
                "component": "Battery",
                "issue": "Critical Battery Health",
                "value": battery_health,
                "threshold": THRESHOLDS['BATTERY_CRITICAL'],
                "action": "Replace battery immediately"
            })
        elif battery_health <= THRESHOLDS['BATTERY_WARNING']:
            warnings.append({
                "component": "Battery",
                "issue": "Low Battery Health",
                "value": battery_health,
                "threshold": THRESHOLDS['BATTERY_WARNING'],
                "action": "Schedule battery replacement"
            })
        
        # Check Oil Level
        if oil_level <= THRESHOLDS['FUEL_WARNING']:
            critical_issues.append({
                "component": "Fuel",
                "issue": "Critical Fuel Level",
                "value": oil_level,
                "threshold": THRESHOLDS['FUEL_CRITICAL'],
                "action": "Refuel immediately"
            })
        elif oil_level <= THRESHOLDS['FUEL_WARNING']:
            warnings.append({
                "component": "Fuel",
                "issue": "Low Fuel Level",
                "value": oil_level,
                "threshold": THRESHOLDS['FUEL_WARNING'],
                "action": "Refuel soon"
            })
        
        # Check Brake Wear
        if brake_wear >= THRESHOLDS['BRAKE_WEAR_CRITICAL']:
            critical_issues.append({
                "component": "Brakes",
                "issue": "Critical Brake Wear",
                "value": brake_wear,
                "threshold": THRESHOLDS['BRAKE_WEAR_CRITICAL'],
                "action": "Replace brake pads immediately"
            })
        elif brake_wear >= THRESHOLDS['BRAKE_WEAR_WARNING']:
            warnings.append({
                "component": "Brakes",
                "issue": "High Brake Wear",
                "value": brake_wear,
                "threshold": THRESHOLDS['BRAKE_WEAR_WARNING'],
                "action": "Schedule brake inspection"
            })
        
        # Check Mileage
        if mileage >= THRESHOLDS['MILEAGE_THRESHOLD']:
            warnings.append({
                "component": "General",
                "issue": "High Mileage",
                "value": mileage,
                "threshold": THRESHOLDS['MILEAGE_THRESHOLD'],
                "action": "Schedule comprehensive inspection"
            })
        
        # Check Days Since Last Maintenance
        if days_since_last >= THRESHOLDS['DAYS_SINCE_SERVICE']:
            warnings.append({
                "component": "Service",
                "issue": "Overdue Maintenance",
                "value": days_since_last,
                "threshold": THRESHOLDS['DAYS_SINCE_SERVICE'],
                "action": "Schedule service immediately"
            })
        
        # ============================================
        # 🤖 ML-BASED PREDICTION
        # ============================================
        if maintenance_model is not None:
            features = np.array([[
                mileage,
                engine_temp,
                tire_pressure,
                battery_health,
                oil_level,
                brake_wear,
                days_since_last
            ]])
            
            # Predict maintenance status
            status_code = maintenance_model.predict(features)[0]
            probabilities = maintenance_model.predict_proba(features)[0]
            
            status_map = {0: 'Healthy', 1: 'Due', 2: 'Critical'}
            ml_status = status_map[status_code]
            ml_confidence = float(probabilities[status_code] * 100)
            
            logger.info(f"🤖 ML Prediction: {ml_status} (confidence: {ml_confidence:.2f}%)")
        else:
            # Fallback if model not loaded
            ml_status = "Critical" if critical_issues else ("Due" if warnings else "Healthy")
            ml_confidence = 80.0
            logger.warning("⚠️ ML model not loaded - using threshold-based status")
        
        # ============================================
        # 📅 PREDICT NEXT MAINTENANCE DATE
        # ============================================
        if ml_status == 'Healthy' and not critical_issues:
            # Based on days since last maintenance
            days_until = max(0, THRESHOLDS['DAYS_SINCE_SERVICE'] - days_since_last)
            days_until = int(days_until) if days_until > 0 else 30  # Default 30 days
        elif ml_status == 'Due' or warnings:
            days_until = 14  # 2 weeks
        else:  # Critical
            days_until = 3  # URGENT - 3 days
        
        next_maintenance_date = (datetime.now() + timedelta(days=days_until)).strftime('%Y-%m-%d')
        
        # ============================================
        # 📊 CALCULATE HEALTH SCORE
        # ============================================
        health_score = 100.0
        health_score -= len(critical_issues) * 25  # -25 per critical issue
        health_score -= len(warnings) * 10  # -10 per warning
        health_score = max(0, min(100, health_score))
        
        # ============================================
        # 📦 COMBINE RESULTS
        # ============================================
        # Overall status (threshold overrides ML if critical)
        if critical_issues:
            final_status = "Critical"
            status_code = 2
        elif warnings and ml_status != "Healthy":
            final_status = "Due"
            status_code = 1
        else:
            final_status = ml_status
            status_code = 0 if ml_status == "Healthy" else (1 if ml_status == "Due" else 2)
        
        response_data = {
            "vehicleId": vehicle_id,
            "status": final_status,
            "status_code": status_code,
            "ml_status": ml_status,
            "ml_confidence": round(ml_confidence, 2),
            "health_score": round(health_score, 2),
            "days_until_maintenance": days_until,
            "next_maintenance_date": next_maintenance_date,
            "critical_issues": critical_issues,
            "warnings": warnings,
            "thresholds_checked": True,
            "metrics": {
                "mileage": mileage,
                "engineTemp": engine_temp,
                "tirePressure": tire_pressure,
                "batteryHealth": battery_health,
                "oilLevel": oil_level,
                "brakeWear": brake_wear,
                "daysSinceLastMaintenance": days_since_last
            },
            "recommendations": generate_maintenance_recommendations(
                critical_issues, warnings, days_until, health_score
            )
        }
        
        logger.info(f"✅ Maintenance prediction complete: {final_status} ({health_score:.1f}% health)")
        
        return jsonify({
            "data": response_data,
            "status": "success"
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Maintenance prediction error: {str(e)}\n{traceback.format_exc()}")
        return jsonify({
            "error": str(e),
            "status": "error"
        }), 500


def generate_maintenance_recommendations(critical_issues, warnings, days_until, health_score):
    """Generate actionable maintenance recommendations"""
    recommendations = []
    
    if critical_issues:
        recommendations.append({
            "priority": "URGENT",
            "message": f"{len(critical_issues)} critical issue(s) detected - Service required immediately",
            "icon": "🚨"
        })
    
    if warnings:
        recommendations.append({
            "priority": "HIGH",
            "message": f"{len(warnings)} warning(s) - Schedule maintenance within {days_until} days",
            "icon": "⚠️"
        })
    
    if health_score < 60:
        recommendations.append({
            "priority": "MEDIUM",
            "message": "Low health score - Comprehensive inspection recommended",
            "icon": "🔍"
        })
    elif health_score >= 85:
        recommendations.append({
            "priority": "LOW",
            "message": "Vehicle in good condition - Continue regular monitoring",
            "icon": "✅"
        })
    
    if not recommendations:
        recommendations.append({
            "priority": "INFO",
            "message": "All systems normal - Next service recommended within 30 days",
            "icon": "ℹ️"
        })
    
    return recommendations

    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
    
    try:
        if maintenance_model is None:
            return jsonify({"error": "Maintenance model not loaded"}), 500
        
        # Mock vehicle data
        mock_data = {
            'mileage': 75000 + np.random.randint(-10000, 10000),
            'engineTemp': 98.5 + np.random.uniform(-2, 2),
            'tirePressure': 32.0 + np.random.uniform(-1, 1),
            'batteryHealth': 85.0 + np.random.uniform(-5, 5),
            'oilLevel': 70.0 + np.random.uniform(-10, 10),
            'brakeWear': 45.0 + np.random.uniform(-10, 10),
            'daysSinceLastMaintenance': 45 + np.random.randint(-10, 20)
        }
        
        features = np.array([[
            mock_data['mileage'],
            mock_data['engineTemp'],
            mock_data['tirePressure'],
            mock_data['batteryHealth'],
            mock_data['oilLevel'],
            mock_data['brakeWear'],
            mock_data['daysSinceLastMaintenance']
        ]])
        
        status_code = maintenance_model.predict(features)[0]
        probabilities = maintenance_model.predict_proba(features)[0]
        
        status_map = {0: 'Healthy', 1: 'Due', 2: 'Critical'}
        status = status_map[status_code]
        
        # Days until maintenance
        if status_code == 0:
            days_until = np.random.randint(60, 120)
        elif status_code == 1:
            days_until = np.random.randint(7, 30)
        else:
            days_until = 0
        
        next_maintenance_date = (datetime.now() + timedelta(days=int(days_until))).strftime('%Y-%m-%d')
        
        return jsonify({
            "data": {
                "vehicleId": vehicle_id,
                "status": status,
                "status_code": int(status_code),
                "confidence": round(float(probabilities[status_code] * 100), 2),
                "days_until_maintenance": int(days_until),
                "next_maintenance_date": next_maintenance_date,
                "health_score": round(float(100 - (status_code * 30 + (1 - probabilities[status_code]) * 20)), 2)
            },
            "status": "success"
        })
    except Exception as e:
        logger.error(f"Maintenance Check Error: {str(e)}\n{traceback.format_exc()}")
        return jsonify({"error": str(e), "status": "error"}), 400


# ============================================
# 4️⃣ CRITICAL VEHICLES
# ============================================
@app.route("/api/recommendations/maintenance/critical-vehicles", methods=["GET", "OPTIONS"])
def get_critical_vehicles():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
    
    try:
        critical_vehicles = [
            {
                "vehicleId": 5,
                "status": "Critical",
                "daysUntilMaintenance": 2,
                "confidence": 95.5,
                "message": "Immediate maintenance required"
            },
            {
                "vehicleId": 12,
                "status": "Critical",
                "daysUntilMaintenance": 1,
                "confidence": 92.3,
                "message": "Critical maintenance needed"
            }
        ]
        
        return jsonify({
            "data": critical_vehicles,
            "total": len(critical_vehicles),
            "status": "success"
        })
    except Exception as e:
        logger.error(f"Critical Vehicles Error: {str(e)}")
        return jsonify({"error": str(e), "status": "error"}), 400


# ============================================
# 5️⃣ FLEET MAINTENANCE ANALYTICS
# ============================================
@app.route("/api/recommendations/maintenance/fleet-analytics", methods=["GET", "OPTIONS"])
def get_fleet_analytics():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
    
    try:
        analytics = {
            "total_vehicles": 50,
            "healthy": 35,
            "due": 10,
            "critical": 5,
            "average_health_score": 82.5,
            "last_updated": datetime.now().isoformat()
        }
        
        return jsonify({
            "data": analytics,
            "status": "success"
        })
    except Exception as e:
        logger.error(f"Fleet Analytics Error: {str(e)}")
        return jsonify({"error": str(e), "status": "error"}), 400


# ============================================
# 6️⃣ HEALTH CHECK
# ============================================
@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "models_loaded": {
            "eta": eta_model is not None,
            "recommendation": recommendation_model is not None,
            "maintenance": maintenance_model is not None
        },
        "timestamp": datetime.now().isoformat()
    })


# ============================================
# Error handlers
# ============================================
@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found", "status": "error"}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error", "status": "error"}), 500


# if __name__ == "__main__":
#     logger.info("\n" + "="*70)
#     logger.info("🚀 NeuroFleetX ML Server Starting...")
#     logger.info("="*70)
#     logger.info("📍 Server: http://localhost:5001")
#     logger.info("📍 Health Check: http://localhost:5001/api/health")
#     logger.info("\n✅ API Endpoints:")
#     logger.info("   🆕 POST /api/live-tracking/predict-eta")
#     logger.info("   1️⃣  POST /api/routes/predict-eta")
#     logger.info("   2️⃣  POST /api/recommendations/vehicles")
#     logger.info("   3️⃣  GET /api/recommendations/maintenance/<vehicle_id>")
#     logger.info("   4️⃣  GET /api/recommendations/maintenance/critical-vehicles")
#     logger.info("   5️⃣  GET /api/recommendations/maintenance/fleet-analytics")
#     logger.info("="*70 + "\n")
    
#     app.run(host="0.0.0.0", port=5001, debug=False)

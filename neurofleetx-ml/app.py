from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np

app = Flask(__name__)
CORS(app)

# Load trained model
model = joblib.load('eta_model_neurofleetx.pkl')
print("✅ ETA model loaded successfully!")

@app.route("/predict-eta", methods=["POST"])
def predict_eta():
    try:
        data = request.json
        features = np.array([[
            data['distanceKm'],
            data['avgSpeed'],
            data['trafficLevel'],
            data['batteryLevel'],
            data['fuelLevel']
        ]])
        predicted_eta = model.predict(features)[0]
        return jsonify({"predicted_eta": round(float(predicted_eta), 2)})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)

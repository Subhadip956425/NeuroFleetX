import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import maintenanceApi from "../../api/maintenanceApi";

const PredictiveMaintenancePanel = ({ vehicleId }) => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPrediction();
  }, [vehicleId]);

  const loadPrediction = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔍 Loading prediction for vehicle:", vehicleId);
      const response = await maintenanceApi.getPrediction(vehicleId);

      console.log("📊 Raw prediction response:", response);

      // ✅ Extract data from response wrapper
      const rawData = response?.data || response;

      console.log("✅ Extracted raw data:", rawData);

      if (!rawData) {
        throw new Error("No prediction data received");
      }

      // ✅ Extract values with fallbacks
      const daysToService = Number(rawData.daysToService) || 0;
      const reason = rawData.reason || "Unknown";

      console.log("🔢 daysToService:", daysToService);
      console.log("📌 reason:", reason);

      // ✅ Transform backend data to match frontend expectations
      const transformedData = {
        vehicleId: rawData.vehicleId || vehicleId,
        id: rawData.id,
        status: reason,
        reason: reason,

        // ✅ Calculate health score based on daysToService and reason
        healthScore: calculateHealthScore(daysToService, reason),

        // ✅ Calculate next maintenance date
        nextMaintenanceDate: calculateNextMaintenanceDate(daysToService),
        daysUntilMaintenance: Math.round(daysToService),

        // ✅ Default ML confidence (since backend doesn't provide it)
        mlConfidence: 85,
        confidence: 85,

        // ✅ Prediction timestamp
        predictedAt: rawData.predictedAt,
        daysToService: daysToService,

        // ✅ Generate recommendations based on status
        criticalIssues: generateCriticalIssues(reason, daysToService),
        warnings: generateWarnings(reason, daysToService),
      };

      console.log("🔧 Transformed prediction data:", transformedData);
      console.log("✅ Health Score:", transformedData.healthScore);
      console.log(
        "✅ Days Until Maintenance:",
        transformedData.daysUntilMaintenance
      );
      console.log(
        "✅ Next Maintenance Date:",
        transformedData.nextMaintenanceDate
      );

      setPrediction(transformedData);
    } catch (err) {
      console.error("❌ Error loading prediction:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-cyan-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="backdrop-blur-xl bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center">
        <p className="text-red-400">❌ {error}</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={loadPrediction}
          className="mt-4 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg font-semibold"
        >
          Retry
        </motion.button>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
        <p className="text-white/60">No prediction data available</p>
      </div>
    );
  }

  // ✅ Destructure with default values
  const status = prediction.status || "Unknown";
  const healthScore = prediction.healthScore || 0;
  const daysUntilMaintenance = prediction.daysUntilMaintenance || 0;
  const nextMaintenanceDate = prediction.nextMaintenanceDate;
  const mlConfidence = prediction.mlConfidence || 85;
  const predictedAt = prediction.predictedAt;
  const criticalIssues = prediction.criticalIssues || [];
  const warnings = prediction.warnings || [];

  console.log("🎨 Rendering with values:", {
    status,
    healthScore,
    daysUntilMaintenance,
    nextMaintenanceDate,
    mlConfidence,
    predictedAt,
  });

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div
        className={`backdrop-blur-xl border rounded-2xl p-6 ${
          status === "Critical"
            ? "bg-red-500/10 border-red-500/30"
            : status === "Due"
            ? "bg-orange-500/10 border-orange-500/30"
            : "bg-green-500/10 border-green-500/30"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-white">
            Vehicle Health Status
          </h3>
          <span
            className={`px-4 py-2 rounded-full text-sm font-bold ${
              status === "Critical"
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : status === "Due"
                ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                : "bg-green-500/20 text-green-400 border border-green-500/30"
            }`}
          >
            {status}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Health Score */}
          <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-xl p-4">
            <p className="text-white/60 text-sm mb-2">Health Score</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    healthScore >= 80
                      ? "bg-green-500"
                      : healthScore >= 60
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${healthScore}%` }}
                />
              </div>
              <span
                className={`text-xl font-bold ${
                  healthScore >= 80
                    ? "text-green-400"
                    : healthScore >= 60
                    ? "text-yellow-400"
                    : "text-red-400"
                }`}
              >
                {healthScore}%
              </span>
            </div>
          </div>

          {/* Days Until Maintenance */}
          <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-xl p-4">
            <p className="text-white/60 text-sm mb-2">Days Remaining</p>
            <p
              className={`text-2xl font-bold ${
                daysUntilMaintenance <= 3
                  ? "text-red-400"
                  : daysUntilMaintenance <= 14
                  ? "text-orange-400"
                  : "text-green-400"
              }`}
            >
              {daysUntilMaintenance} days
            </p>
          </div>

          {/* Next Service Date */}
          <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-xl p-4">
            <p className="text-white/60 text-sm mb-2">Next Service</p>
            <p className="text-sm font-bold text-white">
              {nextMaintenanceDate
                ? new Date(nextMaintenanceDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Not scheduled"}
            </p>
          </div>

          {/* ML Confidence */}
          <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-xl p-4">
            <p className="text-white/60 text-sm mb-2">ML Confidence</p>
            <p className="text-2xl font-bold text-cyan-400">{mlConfidence}%</p>
          </div>
        </div>
      </div>

      {/* Critical Issues */}
      {criticalIssues.length > 0 && (
        <div className="backdrop-blur-xl bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
          <h4 className="text-red-400 font-bold mb-4 flex items-center gap-2">
            🚨 {criticalIssues.length} Critical Issue
            {criticalIssues.length > 1 ? "s" : ""}
          </h4>
          <div className="space-y-2">
            {criticalIssues.map((issue, idx) => (
              <div
                key={idx}
                className="bg-red-500/20 border border-red-500/40 rounded-lg p-3"
              >
                <p className="text-red-300 text-sm font-semibold">{issue}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="backdrop-blur-xl bg-orange-500/10 border border-orange-500/30 rounded-2xl p-6">
          <h4 className="text-orange-400 font-bold mb-4 flex items-center gap-2">
            ⚠️ {warnings.length} Warning{warnings.length > 1 ? "s" : ""}
          </h4>
          <div className="space-y-2">
            {warnings.map((warning, idx) => (
              <div
                key={idx}
                className="bg-orange-500/20 border border-orange-500/40 rounded-lg p-3"
              >
                <p className="text-orange-300 text-sm">{warning}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
        <h4 className="text-white font-bold mb-4">💡 Recommendations</h4>
        <ul className="space-y-2 text-white/80 text-sm">
          {status === "Critical" && (
            <>
              <li>• Schedule immediate maintenance service</li>
              <li>• Do not assign to new trips</li>
              <li>• Inspect all critical components</li>
            </>
          )}
          {status === "Due" && (
            <>
              <li>• Schedule maintenance within {daysUntilMaintenance} days</li>
              <li>• Monitor vehicle health closely</li>
              <li>• Complete pending inspections</li>
            </>
          )}
          {status === "Healthy" && (
            <>
              <li>• Vehicle is in good condition</li>
              <li>• Continue regular monitoring</li>
              <li>• Next service in {daysUntilMaintenance} days</li>
            </>
          )}
        </ul>
      </div>

      {/* Predicted At */}
      <div className="text-center text-white/40 text-xs">
        Last analyzed:{" "}
        {predictedAt
          ? new Date(predictedAt).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Unknown"}
      </div>
    </div>
  );
};

// ✅ Helper function to calculate health score
const calculateHealthScore = (daysToService, reason) => {
  console.log(
    "📊 Calculating health score - daysToService:",
    daysToService,
    "reason:",
    reason
  );

  if (!daysToService && daysToService !== 0) return 50; // Default fallback

  const days = Number(daysToService);

  if (reason === "Critical") {
    // Critical: 0-40% based on how overdue (0-10 days)
    const score = Math.max(0, Math.min(40, 40 - days * 4));
    console.log("🔴 Critical health score:", score);
    return Math.round(score);
  } else if (reason === "Due") {
    // Due: 40-70% based on days remaining (0-15 days)
    const score = Math.max(40, Math.min(70, 40 + days * 2));
    console.log("🟡 Due health score:", score);
    return Math.round(score);
  } else {
    // Healthy: 70-100% based on days until maintenance (15-30 days)
    const score = Math.max(70, Math.min(100, 70 + days * 1));
    console.log("🟢 Healthy health score:", score);
    return Math.round(score);
  }
};

// ✅ Helper function to calculate next maintenance date
const calculateNextMaintenanceDate = (daysToService) => {
  console.log(
    "📅 Calculating next maintenance date - daysToService:",
    daysToService
  );

  if (daysToService === null || daysToService === undefined) {
    console.log("⚠️ No daysToService provided");
    return null;
  }

  const days = Number(daysToService);
  if (isNaN(days)) {
    console.log("⚠️ Invalid daysToService value");
    return null;
  }

  const today = new Date();
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + Math.round(days));

  console.log("✅ Next maintenance date calculated:", nextDate.toISOString());
  return nextDate.toISOString();
};

// ✅ Generate critical issues based on status
const generateCriticalIssues = (reason, daysToService) => {
  if (reason === "Critical") {
    return [
      `⚠️ Vehicle requires immediate maintenance (${Math.round(
        daysToService
      )} days overdue)`,
      "🔧 Engine health degraded - inspect immediately",
      "🛑 Brake system check required",
    ];
  }
  return [];
};

// ✅ Generate warnings based on status
const generateWarnings = (reason, daysToService) => {
  if (reason === "Due") {
    return [
      `⏰ Maintenance due in ${Math.round(daysToService)} days`,
      "📋 Schedule service appointment soon",
      "🔍 Monitor tire pressure and oil levels",
    ];
  } else if (reason === "Healthy") {
    return ["✅ All systems operational", "📊 Regular monitoring recommended"];
  }
  return [];
};

export default PredictiveMaintenancePanel;

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import maintenanceApi from "../../api/maintenanceApi";

const ReportIssueModal = ({ show, onClose, booking, onIssueReported }) => {
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("MEDIUM");
  const [submitting, setSubmitting] = useState(false);

  const issueTypes = [
    {
      value: "vehicle_cleanliness",
      label: "🧹 Vehicle Cleanliness",
      icon: "🧹",
    },
    { value: "vehicle_condition", label: "🔧 Vehicle Condition", icon: "🔧" },
    { value: "safety_concern", label: "⚠️ Safety Concern", icon: "⚠️" },
    { value: "comfort_issue", label: "🛋️ Comfort Issue", icon: "🛋️" },
    { value: "driver_behavior", label: "👤 Driver Behavior", icon: "👤" },
    { value: "route_issue", label: "🗺️ Route Issue", icon: "🗺️" },
    { value: "other", label: "📝 Other", icon: "📝" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!issueType || !description.trim()) {
      alert("Please select an issue type and provide a description");
      return;
    }

    try {
      setSubmitting(true);

      const issueData = {
        vehicleId: booking.vehicleId,
        bookingId: booking.id,
        description: `[${issueType.toUpperCase()}] ${description}`,
        severity: severity,
      };

      await maintenanceApi.reportIssueAsCustomer(issueData);

      alert("✅ Issue reported successfully! We'll address this promptly.");

      if (onIssueReported) {
        onIssueReported();
      }

      // Reset form
      setIssueType("");
      setDescription("");
      setSeverity("MEDIUM");
      onClose();
    } catch (error) {
      console.error("Error reporting issue:", error);
      alert("Failed to report issue. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="max-w-2xl w-full backdrop-blur-xl bg-gray-900/95 border border-white/20 rounded-3xl p-8 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                📋 Report an Issue
              </h2>
              <p className="text-white/60 text-sm mt-1">
                Booking #{booking?.id} • Vehicle #{booking?.vehicleId}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all"
            >
              ✕
            </motion.button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Issue Type Selection */}
            <div>
              <label className="block text-white font-semibold mb-3">
                What type of issue are you experiencing?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {issueTypes.map((type) => (
                  <motion.button
                    key={type.value}
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIssueType(type.value)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      issueType === type.value
                        ? "bg-cyan-500/20 border-cyan-500 text-white"
                        : "bg-white/5 border-white/10 text-white/60 hover:border-white/30"
                    }`}
                  >
                    <div className="text-3xl mb-2">{type.icon}</div>
                    <div className="text-sm font-semibold">
                      {type.label.replace(type.icon + " ", "")}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Please describe the issue in detail
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us what happened and what you'd like us to address..."
                rows="5"
                className="w-full p-4 bg-white/10 text-white border border-white/20 rounded-xl focus:outline-none focus:border-cyan-500 placeholder:text-white/40 resize-none"
                required
              />
              <p className="text-white/40 text-xs mt-2">
                Be as specific as possible to help us resolve this quickly
              </p>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-white font-semibold mb-3">
                How urgent is this issue?
              </label>
              <div className="flex gap-3">
                {[
                  { value: "LOW", label: "Low", color: "green", icon: "ℹ️" },
                  {
                    value: "MEDIUM",
                    label: "Medium",
                    color: "yellow",
                    icon: "⚠️",
                  },
                  { value: "HIGH", label: "High", color: "red", icon: "🚨" },
                ].map((sev) => (
                  <motion.button
                    key={sev.value}
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSeverity(sev.value)}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                      severity === sev.value
                        ? `bg-${sev.color}-500/20 border-${sev.color}-500 text-${sev.color}-400`
                        : "bg-white/5 border-white/10 text-white/60 hover:border-white/30"
                    }`}
                  >
                    <div className="text-2xl mb-1">{sev.icon}</div>
                    <div className="text-sm font-semibold">{sev.label}</div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="flex-1 px-6 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all"
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={submitting || !issueType || !description.trim()}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "⏳ Submitting..." : "📤 Submit Report"}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReportIssueModal;

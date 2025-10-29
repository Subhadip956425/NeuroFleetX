import React, { useState } from "react";
import { motion } from "framer-motion";
import routeApi from "../../api/routeApi";

export default function RouteForm({ onCreated }) {
  const [form, setForm] = useState({
    origin: "",
    destination: "",
    distanceKm: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.origin || !form.destination) {
      alert("Please fill origin and destination");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        origin: form.origin,
        destination: form.destination,
        distanceKm: form.distanceKm ? Number(form.distanceKm) : undefined,
      };
      const res = await routeApi.createRoute(payload);
      onCreated(res.data || res);
      setForm({ origin: "", destination: "", distanceKm: "" });
      alert("Route created successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to create route");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
    >
      <h3 className="text-xl font-bold text-white mb-6">Create New Route</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-white/80 text-sm mb-2">
            Origin (lat,lng or address)
          </label>
          <input
            type="text"
            value={form.origin}
            onChange={(e) => setForm({ ...form, origin: e.target.value })}
            placeholder="28.6139, 77.2090"
            className="w-full p-3 bg-white/10 text-white border border-white/20 rounded-xl focus:outline-none focus:border-emerald-500 placeholder-white/40"
          />
        </div>

        <div>
          <label className="block text-white/80 text-sm mb-2">
            Destination (lat,lng or address)
          </label>
          <input
            type="text"
            value={form.destination}
            onChange={(e) => setForm({ ...form, destination: e.target.value })}
            placeholder="28.7041, 77.1025"
            className="w-full p-3 bg-white/10 text-white border border-white/20 rounded-xl focus:outline-none focus:border-emerald-500 placeholder-white/40"
          />
        </div>

        <div>
          <label className="block text-white/80 text-sm mb-2">
            Distance (km) - Optional
          </label>
          <input
            type="number"
            step="0.1"
            value={form.distanceKm}
            onChange={(e) => setForm({ ...form, distanceKm: e.target.value })}
            placeholder="10.5"
            className="w-full p-3 bg-white/10 text-white border border-white/20 rounded-xl focus:outline-none focus:border-emerald-500 placeholder-white/40"
          />
        </div>

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Creating...
            </span>
          ) : (
            "🎯 Create Route"
          )}
        </motion.button>
      </form>
    </motion.div>
  );
}

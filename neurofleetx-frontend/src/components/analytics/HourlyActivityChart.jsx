import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { motion } from "framer-motion";
import analyticsApi from "../../api/analyticsApi";

const HourlyActivityChart = () => {
  const [activityData, setActivityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    loadActivityData();
  }, [selectedDate]);

  const loadActivityData = async () => {
    try {
      setLoading(true);
      const res = await analyticsApi.getHourlyActivity(selectedDate);
      console.log("📊 Hourly activity data:", res.data);
      setActivityData(res.data);
    } catch (err) {
      console.error("Error loading hourly activity:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-12 flex items-center justify-center">
        <div className="text-white text-xl">Loading chart...</div>
      </div>
    );
  }

  if (!activityData) {
    return null;
  }

  const chartData = {
    labels: activityData.map((d) => `${d.hour}:00`),
    datasets: [
      {
        label: "Bookings per Hour",
        data: activityData.map((d) => d.bookings),
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: "rgba(255, 255, 255, 0.8)",
          font: { size: 14, weight: "bold" },
        },
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: "rgba(255, 255, 255, 0.6)",
          font: { size: 12 },
        },
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
      },
      x: {
        ticks: {
          color: "rgba(255, 255, 255, 0.6)",
          font: { size: 11 },
        },
        grid: {
          color: "rgba(255, 255, 255, 0.05)",
        },
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-2xl font-black text-white">
            📈 Hourly Rental Activity
          </h3>
          <p className="text-white/60 text-sm mt-1">
            Bookings distribution throughout the day
          </p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 bg-white/10 text-white border border-white/20 rounded-xl focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Chart */}
      <div style={{ height: "400px" }}>
        <Bar data={chartData} options={chartOptions} />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
        <div className="text-center">
          <p className="text-white/60 text-sm mb-1">Total Bookings</p>
          <p className="text-2xl font-black text-white">
            {activityData.reduce((sum, d) => sum + d.bookings, 0)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-white/60 text-sm mb-1">Peak Hour</p>
          <p className="text-2xl font-black text-white">
            {
              activityData.reduce((max, d) =>
                d.bookings > max.bookings ? d : max
              ).hour
            }
            :00
          </p>
        </div>
        <div className="text-center">
          <p className="text-white/60 text-sm mb-1">Avg per Hour</p>
          <p className="text-2xl font-black text-white">
            {(
              activityData.reduce((sum, d) => sum + d.bookings, 0) / 24
            ).toFixed(1)}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default HourlyActivityChart;

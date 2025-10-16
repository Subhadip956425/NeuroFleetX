import React, { useEffect, useState } from "react";
import { useGlobalState } from "../context/GlobalState";
import { motion } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const VehicleDashboardKPIs = () => {
  const { state } = useGlobalState();
  const [kpiData, setKpiData] = useState(null);

  // Calculate KPIs from vehicles in global state
  useEffect(() => {
    console.log("📊 Calculating KPIs from vehicles:", state.vehicles);

    if (!state.vehicles || state.vehicles.length === 0) {
      console.warn("⚠️ No vehicles available for analytics");
      return;
    }

    const vehicles = state.vehicles;

    // Calculate real-time statistics
    const totalVehicles = vehicles.length;
    const activeVehicles = vehicles.filter((v) => v.status === "In Use").length;
    const availableVehicles = vehicles.filter(
      (v) => v.status === "Available"
    ).length;
    const maintenanceVehicles = vehicles.filter(
      (v) => v.status === "Needs Maintenance"
    ).length;

    // Calculate averages
    const avgBattery =
      totalVehicles > 0
        ? (
            vehicles.reduce((sum, v) => sum + (v.batteryLevel || 0), 0) /
            totalVehicles
          ).toFixed(1)
        : 0;

    const avgFuel =
      totalVehicles > 0
        ? (
            vehicles.reduce((sum, v) => sum + (v.fuelLevel || 0), 0) /
            totalVehicles
          ).toFixed(1)
        : 0;

    const avgSpeed =
      totalVehicles > 0
        ? (
            vehicles.reduce((sum, v) => sum + (v.speed || 0), 0) / totalVehicles
          ).toFixed(1)
        : 0;

    // Calculate efficiency score (based on battery and fuel levels)
    const efficiencyScore =
      totalVehicles > 0
        ? (
            ((parseFloat(avgBattery) + parseFloat(avgFuel)) / 200) *
            100
          ).toFixed(1)
        : 0;

    // Status distribution for pie chart
    const statusDistribution = {
      available: availableVehicles,
      inUse: activeVehicles,
      maintenance: maintenanceVehicles,
    };

    // Vehicle types distribution
    const typeDistribution = vehicles.reduce((acc, vehicle) => {
      const type = vehicle.type || "Unknown";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Battery levels distribution
    const batteryRanges = {
      low: vehicles.filter((v) => v.batteryLevel < 30).length,
      medium: vehicles.filter(
        (v) => v.batteryLevel >= 30 && v.batteryLevel < 70
      ).length,
      high: vehicles.filter((v) => v.batteryLevel >= 70).length,
    };

    // Fuel levels distribution
    const fuelRanges = {
      low: vehicles.filter((v) => v.fuelLevel < 30).length,
      medium: vehicles.filter((v) => v.fuelLevel >= 30 && v.fuelLevel < 70)
        .length,
      high: vehicles.filter((v) => v.fuelLevel >= 70).length,
    };

    const calculatedData = {
      summary: {
        totalVehicles,
        activeVehicles,
        availableVehicles,
        maintenanceVehicles,
        avgBattery,
        avgFuel,
        avgSpeed,
        efficiencyScore,
      },
      statusDistribution,
      typeDistribution,
      batteryRanges,
      fuelRanges,
    };

    console.log("✅ KPI data calculated:", calculatedData);
    setKpiData(calculatedData);
  }, [state.vehicles]); // Re-calculate when vehicles change

  if (!kpiData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-xl">Loading analytics...</div>
      </div>
    );
  }

  // Chart configurations
  const statusChartData = {
    labels: ["Available", "In Use", "Maintenance"],
    datasets: [
      {
        label: "Vehicle Status",
        data: [
          kpiData.statusDistribution.available,
          kpiData.statusDistribution.inUse,
          kpiData.statusDistribution.maintenance,
        ],
        backgroundColor: [
          "rgba(16, 185, 129, 0.8)",
          "rgba(59, 130, 246, 0.8)",
          "rgba(239, 68, 68, 0.8)",
        ],
        borderColor: [
          "rgba(16, 185, 129, 1)",
          "rgba(59, 130, 246, 1)",
          "rgba(239, 68, 68, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const batteryChartData = {
    labels: ["Low (<30%)", "Medium (30-70%)", "High (>70%)"],
    datasets: [
      {
        label: "Battery Levels",
        data: [
          kpiData.batteryRanges.low,
          kpiData.batteryRanges.medium,
          kpiData.batteryRanges.high,
        ],
        backgroundColor: [
          "rgba(239, 68, 68, 0.8)",
          "rgba(251, 191, 36, 0.8)",
          "rgba(16, 185, 129, 0.8)",
        ],
        borderColor: [
          "rgba(239, 68, 68, 1)",
          "rgba(251, 191, 36, 1)",
          "rgba(16, 185, 129, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const fuelChartData = {
    labels: ["Low (<30%)", "Medium (30-70%)", "High (>70%)"],
    datasets: [
      {
        label: "Fuel Levels",
        data: [
          kpiData.fuelRanges.low,
          kpiData.fuelRanges.medium,
          kpiData.fuelRanges.high,
        ],
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 2,
      },
    ],
  };

  const typeChartData = {
    labels: Object.keys(kpiData.typeDistribution),
    datasets: [
      {
        label: "Vehicle Types",
        data: Object.values(kpiData.typeDistribution),
        backgroundColor: "rgba(147, 51, 234, 0.8)",
        borderColor: "rgba(147, 51, 234, 1)",
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "rgba(255, 255, 255, 0.8)",
          font: { size: 12 },
        },
      },
    },
    scales: {
      y: {
        ticks: { color: "rgba(255, 255, 255, 0.6)" },
        grid: { color: "rgba(255, 255, 255, 0.1)" },
      },
      x: {
        ticks: { color: "rgba(255, 255, 255, 0.6)" },
        grid: { color: "rgba(255, 255, 255, 0.1)" },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "rgba(255, 255, 255, 0.8)",
          font: { size: 12 },
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "Total Vehicles",
            value: kpiData.summary.totalVehicles,
            icon: "🚗",
            color: "from-blue-500 to-cyan-500",
          },
          {
            title: "Active Now",
            value: kpiData.summary.activeVehicles,
            icon: "✅",
            color: "from-green-500 to-emerald-500",
          },
          {
            title: "Avg Battery",
            value: `${kpiData.summary.avgBattery}%`,
            icon: "🔋",
            color: "from-yellow-500 to-orange-500",
          },
          {
            title: "Efficiency",
            value: `${kpiData.summary.efficiencyScore}%`,
            icon: "⚡",
            color: "from-purple-500 to-pink-500",
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">{stat.icon}</span>
              <div
                className={`w-12 h-12 rounded-full bg-gradient-to-br ${stat.color} opacity-20`}
              />
            </div>
            <h3 className="text-3xl font-black text-white mb-1">
              {stat.value}
            </h3>
            <p className="text-white/60 text-sm font-semibold">{stat.title}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4">Vehicle Status</h3>
          <div style={{ height: "300px" }}>
            <Doughnut data={statusChartData} options={pieOptions} />
          </div>
        </motion.div>

        {/* Battery Levels */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4">Battery Levels</h3>
          <div style={{ height: "300px" }}>
            <Doughnut data={batteryChartData} options={pieOptions} />
          </div>
        </motion.div>

        {/* Fuel Levels */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4">
            Fuel Distribution
          </h3>
          <div style={{ height: "300px" }}>
            <Bar data={fuelChartData} options={chartOptions} />
          </div>
        </motion.div>

        {/* Vehicle Types */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4">Vehicle Types</h3>
          <div style={{ height: "300px" }}>
            <Bar data={typeChartData} options={chartOptions} />
          </div>
        </motion.div>
      </div>

      {/* Additional Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
      >
        <h3 className="text-xl font-bold text-white mb-4">Fleet Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-white/60 text-sm mb-1">Available</p>
            <p className="text-2xl font-bold text-green-400">
              {kpiData.summary.availableVehicles}
            </p>
          </div>
          <div className="text-center">
            <p className="text-white/60 text-sm mb-1">Maintenance</p>
            <p className="text-2xl font-bold text-red-400">
              {kpiData.summary.maintenanceVehicles}
            </p>
          </div>
          <div className="text-center">
            <p className="text-white/60 text-sm mb-1">Avg Speed</p>
            <p className="text-2xl font-bold text-blue-400">
              {kpiData.summary.avgSpeed} km/h
            </p>
          </div>
          <div className="text-center">
            <p className="text-white/60 text-sm mb-1">Avg Fuel</p>
            <p className="text-2xl font-bold text-orange-400">
              {kpiData.summary.avgFuel}%
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VehicleDashboardKPIs;

import React, { useState } from "react";
import { motion } from "framer-motion";
import analyticsApi from "../../api/analyticsApi";

const ExportReports = () => {
  const [reportType, setReportType] = useState("fleet-summary");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  const reportTypes = [
    { value: "fleet-summary", label: "Fleet Summary" },
    { value: "bookings", label: "Booking History" },
    { value: "revenue", label: "Revenue Report" },
    { value: "maintenance", label: "Maintenance Records" },
    { value: "utilization", label: "Vehicle Utilization" },
  ];

  const handleExport = async (format) => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates");
      return;
    }

    try {
      setLoading(true);
      console.log(`📥 Exporting ${reportType} as ${format}...`);

      let response;
      if (format === "csv") {
        response = await analyticsApi.exportCSV(reportType, startDate, endDate);
      } else {
        response = await analyticsApi.exportPDF(reportType, startDate, endDate);
      }

      // Create download link
      const blob = new Blob([response.data], {
        type: format === "csv" ? "text/csv" : "application/pdf",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${reportType}-${startDate}-${endDate}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log("✅ Export successful");
    } catch (err) {
      console.error("Error exporting report:", err);
      alert(
        "Failed to export report: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6"
    >
      {/* Header */}
      <div>
        <h3 className="text-2xl font-black text-white">📊 Export Reports</h3>
        <p className="text-white/60 text-sm mt-1">
          Download detailed reports in CSV or PDF format
        </p>
      </div>

      {/* Report Type Selection */}
      <div className="space-y-2">
        <label className="text-white/80 text-sm font-semibold">
          Report Type
        </label>
        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          className="w-full px-4 py-3 bg-white/10 text-white border border-white/20 rounded-xl focus:outline-none focus:border-cyan-500"
        >
          {reportTypes.map((type) => (
            <option key={type.value} value={type.value} className="bg-gray-900">
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-white/80 text-sm font-semibold">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-3 bg-white/10 text-white border border-white/20 rounded-xl focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div className="space-y-2">
          <label className="text-white/80 text-sm font-semibold">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-4 py-3 bg-white/10 text-white border border-white/20 rounded-xl focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Export Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleExport("csv")}
          disabled={loading}
          className="px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? "⏳ Exporting..." : "📄 Export as CSV"}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleExport("pdf")}
          disabled={loading}
          className="px-6 py-4 bg-gradient-to-r from-red-500 to-pink-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? "⏳ Exporting..." : "📑 Export as PDF"}
        </motion.button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">ℹ️</span>
          <div>
            <h4 className="text-white font-bold mb-1">Export Information</h4>
            <ul className="text-white/70 text-sm space-y-1">
              <li>
                • CSV format is ideal for data analysis in Excel or Google
                Sheets
              </li>
              <li>• PDF format provides a formatted, printable report</li>
              <li>• Reports include data for the selected date range only</li>
              <li>• Large exports may take a few seconds to generate</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ExportReports;

import React, { useState } from "react";
import { motion } from "framer-motion";
import maintenanceApi from "../../api/maintenanceApi";

const AlertsTable = ({ tickets = [], onTicketUpdated }) => {
  const [loading, setLoading] = useState(null);

  const handleResolveTicket = async (ticketId) => {
    try {
      setLoading(ticketId);
      console.log("🔧 Resolving ticket:", ticketId);

      const response = await maintenanceApi.resolveTicket(ticketId);
      console.log("✅ Ticket resolved:", response);

      // Notify parent component
      if (onTicketUpdated) {
        onTicketUpdated({ ...response, status: "RESOLVED" });
      }

      alert("Ticket resolved successfully!");
    } catch (error) {
      console.error("❌ Error resolving ticket:", error);
      alert("Failed to resolve ticket: " + error.message);
    } finally {
      setLoading(null);
    }
  };

  // ✅ ALWAYS filter out AUTO-generated tickets - only show MANUAL tickets
  const manualTickets = tickets.filter((ticket) => {
    const desc = ticket.description || "";
    // Only include tickets that DON'T start with "AUTO:"
    return !desc.startsWith("AUTO:");
  });

  if (!manualTickets || manualTickets.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">✅</div>
        <p className="text-white/60">No manual tickets</p>
        <p className="text-white/40 text-sm mt-2">
          All manual maintenance tickets resolved
        </p>
      </div>
    );
  }

  // Sort tickets by severity
  const sortedTickets = [...manualTickets].sort((a, b) => {
    const severityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
  });

  return (
    <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
      {sortedTickets.slice(0, 10).map((ticket, index) => (
        <motion.div
          key={ticket.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`backdrop-blur-sm border rounded-xl p-4 hover:border-white/30 transition-all ${
            ticket.severity === "HIGH"
              ? "bg-red-500/10 border-red-500/30"
              : ticket.severity === "MEDIUM"
              ? "bg-yellow-500/10 border-yellow-500/30"
              : "bg-blue-500/10 border-blue-500/30"
          }`}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-white font-bold text-sm line-clamp-1">
                  {ticket.issue || ticket.description || "Maintenance Issue"}
                </h4>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    ticket.severity === "HIGH"
                      ? "bg-red-500/20 text-red-400"
                      : ticket.severity === "MEDIUM"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-blue-500/20 text-blue-400"
                  }`}
                >
                  {ticket.severity || "MEDIUM"}
                </span>
              </div>
              <p className="text-white/60 text-xs">
                Ticket #{ticket.id} • Vehicle #{ticket.vehicleId}
              </p>
            </div>
          </div>

          {/* Description */}
          {ticket.description && (
            <p className="text-white/70 text-xs mb-3 line-clamp-2">
              {ticket.description}
            </p>
          )}

          {/* Status and Date */}
          <div className="flex items-center justify-between mb-3 text-xs text-white/50">
            <span>
              {ticket.createdAt
                ? new Date(ticket.createdAt).toLocaleDateString()
                : "Unknown date"}
            </span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                ticket.status === "OPEN"
                  ? "bg-yellow-500/20 text-yellow-400"
                  : ticket.status === "IN_PROGRESS"
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-green-500/20 text-green-400"
              }`}
            >
              {ticket.status || "OPEN"}
            </span>
          </div>

          {/* Action Button */}
          {ticket.status === "OPEN" && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleResolveTicket(ticket.id)}
              disabled={loading === ticket.id}
              className={`w-full px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                loading === ticket.id
                  ? "bg-white/10 text-white/50 cursor-not-allowed"
                  : "bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
              }`}
            >
              {loading === ticket.id ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-green-400"></div>
                  Resolving...
                </span>
              ) : (
                "✓ Mark as Resolved"
              )}
            </motion.button>
          )}

          {ticket.status === "IN_PROGRESS" && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleResolveTicket(ticket.id)}
              disabled={loading === ticket.id}
              className={`w-full px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                loading === ticket.id
                  ? "bg-white/10 text-white/50 cursor-not-allowed"
                  : "bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30"
              }`}
            >
              {loading === ticket.id ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-blue-400"></div>
                  Completing...
                </span>
              ) : (
                "✓ Complete"
              )}
            </motion.button>
          )}
        </motion.div>
      ))}

      {/* Show more indicator */}
      {manualTickets.length > 10 && (
        <div className="text-center pt-2">
          <p className="text-white/40 text-xs">
            +{manualTickets.length - 10} more tickets
          </p>
        </div>
      )}

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
};

export default AlertsTable;

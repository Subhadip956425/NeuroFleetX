import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import maintenanceApi from "../../api/maintenanceApi";
import { useGlobalState, actionTypes } from "../../context/GlobalState";

const AlertsTable = ({ tickets = [], onTicketUpdated }) => {
  const { dispatch } = useGlobalState();

  const handleResolve = async (ticketId) => {
    if (!window.confirm("Mark this ticket as resolved?")) return;

    try {
      const res = await maintenanceApi.resolveTicket(ticketId);
      const resolvedTicket = res.data || res;

      // ✅ Immediately remove the resolved ticket from local list
      if (onTicketUpdated) {
        onTicketUpdated({ ...resolvedTicket, status: "RESOLVED" });
      }

      // ✅ Update global state
      dispatch({
        type: actionTypes.UPDATE_TICKET,
        payload: { ...resolvedTicket, status: "RESOLVED" },
      });

      alert("Ticket resolved successfully!");
    } catch (err) {
      console.error("Error resolving ticket:", err);
      alert("Failed to resolve ticket");
    }
  };

  // Filter only open tickets
  const openTickets = tickets
    .filter((t) => t.status === "OPEN" || !t.status)
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA; // Descending order (newest first)
    });

  if (openTickets.length === 0) {
    return (
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Active Alerts</h3>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">✅</div>
          <p className="text-white/60 text-sm">No active alerts</p>
          <p className="text-white/40 text-xs mt-1">All systems operational</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">Active Alerts</h3>
        <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-semibold">
          {openTickets.length} Open
        </span>
      </div>

      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {openTickets.map((ticket, index) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100, transition: { duration: 0.3 } }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ x: 5 }}
              layout
              className={`backdrop-blur-sm bg-white/5 border rounded-xl p-4 transition-all ${
                ticket.severity === "HIGH"
                  ? "border-red-500/50 hover:border-red-500/80"
                  : ticket.severity === "MEDIUM"
                  ? "border-yellow-500/50 hover:border-yellow-500/80"
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-bold text-sm">
                      🚗 Vehicle #{ticket.vehicleId}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        ticket.severity === "HIGH"
                          ? "bg-red-500/20 text-red-400"
                          : ticket.severity === "MEDIUM"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      {ticket.severity || "LOW"}
                    </span>
                  </div>
                  <p className="text-white/60 text-xs">Ticket #{ticket.id}</p>
                </div>
              </div>

              {/* Issue Description */}
              <div className="mb-3">
                <p className="text-white/80 text-sm mb-1">
                  <span className="text-white/40">Issue: </span>
                  {ticket.issue || ticket.description || "No description"}
                </p>
                {ticket.notes && (
                  <p className="text-white/60 text-xs mt-1">
                    <span className="text-white/40">Notes: </span>
                    {ticket.notes}
                  </p>
                )}
              </div>

              {/* Metadata */}
              <div className="flex items-center justify-between text-xs text-white/40 mb-3 pb-3 border-b border-white/10">
                <span>
                  📅{" "}
                  {new Date(
                    ticket.createdAt || Date.now()
                  ).toLocaleDateString()}
                </span>
                {ticket.reportedBy && (
                  <span>
                    👤{" "}
                    {typeof ticket.reportedBy === "object"
                      ? ticket.reportedBy.fullName ||
                        ticket.reportedBy.email ||
                        "User"
                      : ticket.reportedBy}
                  </span>
                )}
              </div>

              {/* Action Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleResolve(ticket.id)}
                className="w-full px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all text-sm"
              >
                ✅ Mark Resolved
              </motion.button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

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

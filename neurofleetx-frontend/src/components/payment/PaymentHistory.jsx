import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import paymentApi from "../../api/paymentApi";

const PaymentHistory = ({ customerId }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaymentHistory();
  }, [customerId]);

  const loadPaymentHistory = async () => {
    try {
      setLoading(true);
      const response = await paymentApi.getPaymentHistory(customerId);
      setPayments(response.data || []);
      console.log("💰 Payment history loaded:", response.data);
    } catch (error) {
      console.error("❌ Error loading payment history:", error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      COMPLETED: {
        bg: "bg-green-500/20",
        text: "text-green-400",
        border: "border-green-500/30",
      },
      PENDING: {
        bg: "bg-yellow-500/20",
        text: "text-yellow-400",
        border: "border-yellow-500/30",
      },
      FAILED: {
        bg: "bg-red-500/20",
        text: "text-red-400",
        border: "border-red-500/30",
      },
      REFUNDED: {
        bg: "bg-blue-500/20",
        text: "text-blue-400",
        border: "border-blue-500/30",
      },
    };
    return colors[status] || colors.PENDING;
  };

  const getStatusIcon = (status) => {
    const icons = {
      COMPLETED: "✅",
      PENDING: "⏳",
      FAILED: "❌",
      REFUNDED: "↩️",
    };
    return icons[status] || "📄";
  };

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-500 mx-auto mb-4"></div>
        <p className="text-white/60">Loading payment history...</p>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
        <div className="text-6xl mb-4">💳</div>
        <h3 className="text-2xl font-bold text-white mb-2">No Payments Yet</h3>
        <p className="text-white/60">Your payment history will appear here</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-black text-white flex items-center gap-3">
            <span className="text-3xl">💰</span>
            Payment History
          </h3>
          <p className="text-white/60 text-sm mt-1">
            {payments.length} {payments.length === 1 ? "payment" : "payments"}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={loadPaymentHistory}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg"
        >
          🔄 Refresh
        </motion.button>
      </div>

      {/* Payment Cards */}
      <div className="space-y-4 max-h-[600px] overflow-y-auto">
        {payments.map((payment, index) => {
          const statusStyle = getStatusColor(payment.status);

          return (
            <motion.div
              key={payment.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.01, y: -2 }}
              className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all"
            >
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex-1">
                  {/* Status Badge */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">
                      {getStatusIcon(payment.status)}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}
                    >
                      {payment.status}
                    </span>
                    <span className="text-white/40 text-xs">#{payment.id}</span>
                  </div>

                  {/* Payment Details */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-sm">Booking ID:</span>
                      <span className="text-white font-semibold">
                        #{payment.booking?.id || payment.bookingId}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-sm">Amount:</span>
                      <span className="text-xl font-black text-cyan-400">
                        ₹{payment.amount?.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-sm">
                        Payment Date:
                      </span>
                      <span className="text-white/80 text-sm">
                        {new Date(payment.createdAt).toLocaleDateString(
                          "en-IN",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                    </div>
                    {payment.razorpayPaymentId && (
                      <div className="flex items-center justify-between">
                        <span className="text-white/60 text-sm">
                          Transaction ID:
                        </span>
                        <span className="text-white/60 text-xs font-mono">
                          {payment.razorpayPaymentId}
                        </span>
                      </div>
                    )}
                    {payment.description && (
                      <p className="text-white/60 text-sm mt-2">
                        {payment.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl text-sm font-semibold hover:bg-blue-500/30 transition-all"
                  >
                    📄 Receipt
                  </motion.button>
                  {payment.status === "COMPLETED" && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-xl text-sm font-semibold hover:bg-green-500/30 transition-all"
                    >
                      ✅ Paid
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-white/60 text-xs mb-1">Total Payments</p>
            <p className="text-2xl font-black text-white">{payments.length}</p>
          </div>
          <div className="text-center">
            <p className="text-white/60 text-xs mb-1">Completed</p>
            <p className="text-2xl font-black text-green-400">
              {payments.filter((p) => p.status === "COMPLETED").length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-white/60 text-xs mb-1">Pending</p>
            <p className="text-2xl font-black text-yellow-400">
              {payments.filter((p) => p.status === "PENDING").length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-white/60 text-xs mb-1">Total Spent</p>
            <p className="text-2xl font-black text-cyan-400">
              ₹
              {payments
                .filter((p) => p.status === "COMPLETED")
                .reduce((sum, p) => sum + (p.amount || 0), 0)
                .toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PaymentHistory;

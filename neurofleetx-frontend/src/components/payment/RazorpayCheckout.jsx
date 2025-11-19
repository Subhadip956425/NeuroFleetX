import React, { useState } from "react";
import { motion } from "framer-motion";
import paymentApi from "../../api/paymentApi";

const RazorpayCheckout = ({ booking, onSuccess, onClose }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handlePayment = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      console.log("💳 Creating Razorpay order for booking:", booking.id);

      // 1. Create Razorpay order
      const orderResponse = await paymentApi.createPaymentOrder(booking.id);
      const orderData = orderResponse.data;

      console.log("✅ Order created:", orderData);

      // 2. Configure Razorpay options
      const options = {
        key: orderData.key,
        amount: orderData.amount * 100, // Amount in paise
        currency: orderData.currency,
        name: orderData.name,
        description: orderData.description,
        order_id: orderData.orderId,
        handler: async function (response) {
          console.log("💰 Payment successful:", response);

          try {
            // 3. Verify payment on backend
            const verifyResponse = await paymentApi.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            console.log("✅ Payment verified:", verifyResponse.data);

            // 4. Call success callback
            if (onSuccess) {
              onSuccess(verifyResponse.data);
            }
          } catch (verifyError) {
            console.error("❌ Payment verification failed:", verifyError);
            setError("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: "Customer Name",
          email: "customer@example.com",
          contact: "9999999999",
        },
        theme: {
          color: "#06b6d4", // Cyan color matching NeuroFleetX theme
        },
        modal: {
          ondismiss: function () {
            console.log("❌ Payment cancelled");
            setIsProcessing(false);
          },
        },
      };

      // 3. Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error("❌ Error creating payment:", err);
      setError(err.response?.data?.error || err.message || "Payment failed");
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6"
    >
      <div className="text-center mb-6">
        <div className="text-5xl mb-4">💳</div>
        <h3 className="text-2xl font-bold text-white mb-2">Payment Details</h3>
        <p className="text-white/60">Complete your booking payment</p>
      </div>

      {/* Booking Summary */}
      <div className="bg-white/5 rounded-xl p-4 mb-6 space-y-3">
        <div className="flex justify-between text-white/80">
          <span>Booking ID:</span>
          <span className="font-bold">#{booking.id}</span>
        </div>
        <div className="flex justify-between text-white/80">
          <span>Vehicle Type:</span>
          <span className="font-bold">{booking.vehicleType}</span>
        </div>
        <div className="flex justify-between text-white/80">
          <span>Pickup:</span>
          <span className="font-bold text-sm">{booking.pickupLocation}</span>
        </div>
        <div className="flex justify-between text-white/80">
          <span>Dropoff:</span>
          <span className="font-bold text-sm">{booking.dropoffLocation}</span>
        </div>
        <div className="border-t border-white/10 pt-3 flex justify-between">
          <span className="text-lg font-bold text-white">Total Amount:</span>
          <span className="text-2xl font-black text-cyan-400">
            ₹{booking.price?.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-4"
        >
          <p className="text-red-400 text-sm font-semibold">{error}</p>
        </motion.div>
      )}

      {/* Payment Buttons */}
      <div className="flex gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          disabled={isProcessing}
          className="flex-1 px-6 py-3 bg-white/10 border border-white/20 text-white font-bold rounded-xl hover:bg-white/20 transition-all disabled:opacity-50"
        >
          Cancel
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePayment}
          disabled={isProcessing}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Processing...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>💳</span>
              Pay ₹{booking.price?.toFixed(2)}
            </span>
          )}
        </motion.button>
      </div>

      {/* Payment Methods Info */}
      <div className="mt-6 text-center">
        <p className="text-white/40 text-xs mb-2">We accept</p>
        <div className="flex justify-center gap-3 flex-wrap">
          {["UPI", "Cards", "NetBanking", "Wallets"].map((method) => (
            <span
              key={method}
              className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-white/60 text-xs font-semibold"
            >
              {method}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default RazorpayCheckout;

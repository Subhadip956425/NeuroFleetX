import axiosInstance from "./axiosInstance";

const paymentApi = {
  // Create Razorpay order
  createPaymentOrder: (bookingId) =>
    axiosInstance.post("/payments/create-order", { bookingId }),

  // Verify payment
  verifyPayment: (paymentData) =>
    axiosInstance.post("/payments/verify", paymentData),

  // Get payment for booking
  getPaymentByBooking: (bookingId) =>
    axiosInstance.get(`/payments/booking/${bookingId}`),

  // Get customer payment history
  getPaymentHistory: (customerId) =>
    axiosInstance.get(`/payments/customer/${customerId}/history`),

  // Get revenue statistics (Admin only)
  getRevenueStatistics: () => axiosInstance.get("/payments/revenue/statistics"),
};

export default paymentApi;

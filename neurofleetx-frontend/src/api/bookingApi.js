// Purpose: Booking related REST calls
import axiosInstance from "./axiosInstance";

const API = "/bookings";
const RECOMMEND = "/recommend/vehicles";

const bookingApi = {
  createBooking: (payload) => axiosInstance.post(`${API}/create`, payload),
  cancelBooking: (bookingId, requesterId) =>
    axiosInstance.delete(`${API}/cancel/${bookingId}`, {
      params: { requesterId },
    }),
  confirmBooking: (bookingId, managerId) =>
    axiosInstance.post(`${API}/confirm/${bookingId}`, null, {
      params: { managerId },
    }),
  getCustomerBookings: (customerId) =>
    axiosInstance.get(`${API}/customer/${customerId}`),
  getAllBookings: () => axiosInstance.get(`${API}/all`),
  getRecommendations: (params) => axiosInstance.get(RECOMMEND, { params }),

  // Manager
  getAllBookings: () => axiosInstance.get("/manager/bookings/all"), // ✅ Changed from /api/bookings/manager/all

  managerRejectBooking: (bookingId, data) =>
    axiosInstance.put(`/manager/bookings/${bookingId}/reject`, data),

  // Driver endpoints
  // Get pending bookings for driver (based on assigned vehicle type)
  getDriverAssignedBookings: (driverId) => {
    return axiosInstance.get(`/bookings/driver/${driverId}/pending`);
  },

  driverAcceptBooking: (bookingId, driverId) =>
    axiosInstance.put(`/driver/bookings/${bookingId}/accept`, { driverId }),

  driverRejectBooking: (bookingId, data) =>
    axiosInstance.put(`/driver/bookings/${bookingId}/reject`, data),

  // Get confirmed bookings for driver
  getDriverConfirmedBookings: (driverId) =>
    axiosInstance.get(`/driver/${driverId}/bookings/confirmed`),
};

export default bookingApi;

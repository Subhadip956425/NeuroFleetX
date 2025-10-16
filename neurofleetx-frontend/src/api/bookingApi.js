import axios from "./axiosInstance"; // ensure you already have axiosInstance.js configured

const bookingApi = {
  getMyBookings: () => axios.get("customer/bookings/me"),
  createBooking: (data) => axios.post("customer/bookings", data),
  cancelBooking: (id) => axios.put(`customer/bookings/${id}/cancel`),
  getAllBookings: () => axios.get("customer/bookings"), // admin/manager
  getBookingById: (id) => axios.get(`customer/bookings/${id}`),
};

export default bookingApi;

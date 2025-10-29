import axios from "axios";
import axiosInstance from "./axiosInstance";

const API_URL = "http://localhost:8080/api/vehicles";

export const fetchVehicles = async (userRole) => {
  const token = localStorage.getItem("jwtToken"); // make sure it's correct
  const config = {
    headers: { Authorization: `Bearer ${token}` },
  };

  // Role-aware endpoint
  const url = userRole === "CUSTOMER" ? `${API_URL}/available` : API_URL;

  const res = await axios.get(url, config);
  return res.data;
};

export const fetchDriverVehicle = async () => {
  const response = await axiosInstance.get("/driver/my-vehicle");
  return response.data;
};

const vehicleApi = {
  fetchVehicles,
  fetchDriverVehicle,
};
export default vehicleApi;

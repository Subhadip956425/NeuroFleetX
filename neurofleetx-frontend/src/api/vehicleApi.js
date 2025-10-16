import axios from "axios";

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

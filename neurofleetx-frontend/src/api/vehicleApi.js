import axios from "axios";

const API_URL = "http://localhost:8080/api/vehicles";

export const fetchVehicles = async () => {
  const res = await axios.get(API_URL, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  return res.data;
};

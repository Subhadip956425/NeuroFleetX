// Purpose: Vehicle related REST calls
import axiosInstance from "./axiosInstance";

const API_URL = "/vehicles";

/**
 * Fetch all vehicles (for admin/manager)
 * or available vehicles (for customer)
 */
export const fetchVehicles = async (userRole) => {
  try {
    console.log(`📡 Fetching vehicles for role: ${userRole}`);

    // Role-aware endpoint
    const url = userRole === "CUSTOMER" ? `${API_URL}/available` : API_URL;

    const res = await axiosInstance.get(url);
    console.log(`✅ Fetched ${res.data?.length || 0} vehicles`);
    return res.data;
  } catch (error) {
    console.error("❌ Error fetching vehicles:", error);
    throw error;
  }
};

/**
 * Fetch driver's assigned vehicle
 */
// File: src/api/vehicleApi.js

export const fetchDriverVehicle = async () => {
  try {
    console.log("📡 Fetching driver's assigned vehicle...");
    // ✅ Changed endpoint - no driverId needed, JWT identifies the driver
    const response = await axiosInstance.get("/driver/my-vehicle");
    console.log("✅ Driver vehicle fetched:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching driver vehicle:", error);
    throw error;
  }
};

/**
 * Create a new vehicle (admin/manager)
 */
export const createVehicle = async (vehicleData) => {
  try {
    console.log("📤 Creating vehicle:", vehicleData);
    const response = await axiosInstance.post(API_URL, vehicleData);
    console.log("✅ Vehicle created:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error creating vehicle:", error);
    throw error;
  }
};

/**
 * Update an existing vehicle (admin/manager)
 */
export const updateVehicle = async (vehicleId, vehicleData) => {
  try {
    console.log(`📤 Updating vehicle ${vehicleId}:`, vehicleData);
    const response = await axiosInstance.put(
      `${API_URL}/${vehicleId}`,
      vehicleData
    );
    console.log("✅ Vehicle updated:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error updating vehicle:", error);
    throw error;
  }
};

/**
 * Delete a vehicle (admin/manager)
 */
export const deleteVehicle = async (vehicleId) => {
  try {
    console.log(`🗑️ Deleting vehicle ${vehicleId}`);
    const response = await axiosInstance.delete(`${API_URL}/${vehicleId}`);
    console.log("✅ Vehicle deleted");
    return response.data;
  } catch (error) {
    console.error("❌ Error deleting vehicle:", error);
    throw error;
  }
};

/**
 * Get vehicle by ID
 */
export const getVehicleById = async (vehicleId) => {
  try {
    const response = await axiosInstance.get(`${API_URL}/${vehicleId}`);
    console.log(`✅ Vehicle ${vehicleId} fetched`);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching vehicle:", error);
    throw error;
  }
};

/**
 * Assign driver to vehicle (MANAGER)
 * POST /api/vehicles/{vehicleId}/assign/{driverId}
 */
/**
 * Assign driver to vehicle (MANAGER)
 * ✅ FIXED: Use correct /manager path
 * POST /api/manager/vehicles/{vehicleId}/assign/{driverId}
 */
export const assignDriver = async (vehicleId, driverId) => {
  try {
    console.log(`👤 Assigning driver ${driverId} to vehicle ${vehicleId}`);
    // ✅ Changed from /vehicles to /manager/vehicles
    const response = await axiosInstance.post(
      `/manager/vehicles/${vehicleId}/assign/${driverId}`
    );
    console.log("✅ Driver assigned:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error assigning driver:", error);
    throw error;
  }
};

/**
 * Unassign driver from vehicle (MANAGER)
 * ✅ FIXED: Use correct /manager path
 * POST /api/manager/vehicles/{vehicleId}/unassign
 */
export const unassignDriver = async (vehicleId) => {
  try {
    console.log(`🚫 Unassigning driver from vehicle ${vehicleId}`);
    // ✅ Changed from /vehicles to /manager/vehicles
    const response = await axiosInstance.post(
      `/manager/vehicles/${vehicleId}/unassign`
    );
    console.log("✅ Driver unassigned:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error unassigning driver:", error);
    throw error;
  }
};

/**
 * Get vehicle's telemetry/status
 */
export const getVehicleTelemetry = async (vehicleId) => {
  try {
    const response = await axiosInstance.get(
      `${API_URL}/${vehicleId}/telemetry`
    );
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching telemetry:", error);
    throw error;
  }
};

/**
 * Get vehicle's location in real-time
 */
export const getVehicleLocation = async (vehicleId) => {
  try {
    const response = await axiosInstance.get(
      `${API_URL}/${vehicleId}/location`
    );
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching location:", error);
    throw error;
  }
};

// ✅ Export all functions as default
const vehicleApi = {
  fetchVehicles,
  fetchDriverVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleById,
  assignDriver, // ✅ NEW
  unassignDriver, // ✅ NEW
  getVehicleTelemetry,
  getVehicleLocation,
};

export default vehicleApi;

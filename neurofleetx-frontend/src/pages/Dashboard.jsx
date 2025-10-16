import React, { useEffect } from "react";
import { useGlobalState } from "../context/GlobalState.jsx";
import { useNavigate } from "react-router-dom";
import AdminDashboard from "../components/dashboards/AdminDashboard";
import ManagerDashboard from "../components/dashboards/ManagerDashboard";
import DriverDashboard from "../components/dashboards/DriverDashboard";
import CustomerDashboard from "../components/dashboards/CustomerDashboard";

const Dashboard = () => {
  const { state } = useGlobalState();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("🎯 Dashboard mounted");
    console.log("📦 Full state:", state);
    console.log("👤 User:", state.user);
    console.log(
      "🔑 Token from localStorage:",
      localStorage.getItem("jwtToken")
    );
    console.log("🎭 Role from localStorage:", localStorage.getItem("role"));
  }, [state]);

  // Check if user exists in state
  if (!state.user) {
    console.warn("⚠️ No user in state!");
    console.log("Checking localStorage...");

    const token = localStorage.getItem("jwtToken");
    const role = localStorage.getItem("role");

    if (!token) {
      console.error("❌ No token found, redirecting to login");
      navigate("/login", { replace: true });
      return null;
    }

    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-xl">Loading user data...</div>
      </div>
    );
  }

  // Check if roles exist
  if (!state.user.roles || state.user.roles.length === 0) {
    console.error("❌ No roles in user object:", state.user);
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-red-400 text-xl">Error: No roles assigned</div>
      </div>
    );
  }

  // Get role and strip "ROLE_" prefix
  const fullRole = state.user.roles[0];
  const role = fullRole.replace("ROLE_", "");

  console.log("🎭 Full role:", fullRole);
  console.log("🎭 Cleaned role:", role);

  // Render appropriate dashboard
  switch (role) {
    case "ADMIN":
      console.log("✅ Rendering AdminDashboard");
      return <AdminDashboard />;

    case "MANAGER":
      console.log("✅ Rendering ManagerDashboard");
      return <ManagerDashboard />;

    case "DRIVER":
      console.log("✅ Rendering DriverDashboard");
      return <DriverDashboard />;

    case "CUSTOMER":
      console.log("✅ Rendering CustomerDashboard");
      return <CustomerDashboard />;

    default:
      console.error("❌ Unknown role:", role);
      return (
        <div className="flex items-center justify-center h-screen bg-gray-900">
          <div className="text-red-400 text-xl">
            <p>Unauthorized</p>
            <p className="text-sm mt-2">Role: {role}</p>
          </div>
        </div>
      );
  }
};

export default Dashboard;

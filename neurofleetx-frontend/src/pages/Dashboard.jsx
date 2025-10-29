import React, { useEffect, useState } from "react";
import { useGlobalState } from "../context/GlobalState.jsx";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminDashboard from "../components/dashboards/AdminDashboard";
import ManagerDashboard from "../components/dashboards/ManagerDashboard";
import DriverDashboard from "../components/dashboards/DriverDashboard";
import CustomerDashboard from "../components/dashboards/CustomerDashboard";

const Dashboard = () => {
  const { state, dispatch } = useGlobalState();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("jwtToken");
      const userId = localStorage.getItem("userId");

      if (!token || !userId) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        const res = await axios.get(
          `http://localhost:8080/api/users/${userId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const userData = {
          ...res.data,
          roles: Array.isArray(res.data.roles) ? res.data.roles : [],
        };

        dispatch({ type: "SET_USER", payload: userData });
        localStorage.setItem("user", JSON.stringify(userData));

        // Only stop loading after user is set
        setLoading(false);
      } catch (err) {
        console.error("Error fetching user:", err);
        localStorage.removeItem("jwtToken");
        localStorage.removeItem("userId");
        navigate("/login", { replace: true });
      }
    };

    fetchUser();
  }, [dispatch, navigate]);

  // If still loading, show loading screen
  if (loading || !state.user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-xl">Loading user data...</div>
      </div>
    );
  }

  const roles = Array.isArray(state.user?.roles) ? state.user.roles : [];
  let role = "";

  if (roles.length > 0) {
    const firstRole = roles[0];
    if (typeof firstRole === "string") {
      role = firstRole.replace("ROLE_", "");
    } else if (firstRole && firstRole.name) {
      role = firstRole.name.replace("ROLE_", "");
    }
  }

  switch (role) {
    case "ADMIN":
      return <AdminDashboard />;
    case "MANAGER":
      return <ManagerDashboard />;
    case "DRIVER":
      return <DriverDashboard />;
    case "CUSTOMER":
      return <CustomerDashboard />;
    default:
      return (
        <div className="flex items-center justify-center h-screen bg-gray-900">
          <div className="text-red-400 text-xl">
            Unauthorized
            <br />
            Role: {fullRole}
          </div>
        </div>
      );
  }
};

export default Dashboard;

import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import VehicleDashboard from "../pages/VehicleDashboard";
import VehicleDashboardKPIs from "../components/VehicleDashboardKPIs";

import AdminDashboard from "../components/dashboards/AdminDashboard";
import ManagerDashboard from "../components/dashboards/ManagerDashboard";
import DriverDashboard from "../components/dashboards/DriverDashboard";
import CustomerDashboard from "../components/dashboards/CustomerDashboard";

import { getToken, getUserRole } from "../utils/auth";

export default function AppRoutes() {
  // Simple private route for any logged-in user
  const PrivateRoute = ({ children }) => {
    return getToken() ? children : <Navigate to="/login" />;
  };

  // Role-protected route
  const ProtectedRoute = ({ role, children }) => {
    const token = getToken();
    const userRole = getUserRole(); // This now returns "ADMIN" not "ROLE_ADMIN"

    console.log("🛡️ ProtectedRoute check:", { role, userRole, token: !!token });

    if (!token) {
      console.log("❌ No token, redirecting to login");
      return <Navigate to="/login" />;
    }

    if (userRole !== role) {
      console.log(`❌ Role mismatch: expected ${role}, got ${userRole}`);
      return <Navigate to="/dashboard" />;
    }

    console.log("✅ Access granted");
    return children;
  };

  return (
    <Router>
      <Routes>
        {/* 🔓 Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* 🔒 General Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/vehicles"
          element={
            <PrivateRoute>
              <VehicleDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/vehicles/kpi"
          element={
            <PrivateRoute>
              <VehicleDashboardKPIs />
            </PrivateRoute>
          }
        />

        {/* 🧩 Role-Specific Dashboards */}
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/manager"
          element={
            <ProtectedRoute role="MANAGER">
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/driver"
          element={
            <ProtectedRoute role="DRIVER">
              <DriverDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/customer"
          element={
            <ProtectedRoute role="CUSTOMER">
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />

        {/* 🚫 Catch-All */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

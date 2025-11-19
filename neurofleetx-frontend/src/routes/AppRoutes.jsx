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

// ✅ NEW: Module 3, 4, 5 Pages
import RouteOptimization from "../../src/components/Route/RouteOptimization";
import BookingWizard from "../../src/components/booking/BookingWizard";
import VehicleRecommendations from "../../src/components/booking/VehicleRecommendations";
import MaintenanceAnalytics from "../../src/components/maintenance/MaintenanceAnalytics";

import { getToken, getUserRole } from "../utils/auth";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";

export default function AppRoutes() {
  // Simple private route for any logged-in user
  const PrivateRoute = ({ children }) => {
    return getToken() ? children : <Navigate to="/login" />;
  };

  // Role-protected route
  const ProtectedRoute = ({ role, children }) => {
    const token = getToken();
    const userRole = getUserRole();

    if (!token) {
      return <Navigate to="/login" />;
    }

    if (userRole !== role) {
      return <Navigate to="/dashboard" />;
    }

    return children;
  };

  return (
    <Router>
      <Routes>
        {/* 🔓 Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

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

        {/* ✅ NEW: Module 3 - Route Optimization */}
        <Route
          path="/customer/route-optimization"
          element={
            <ProtectedRoute role="CUSTOMER">
              <RouteOptimization />
            </ProtectedRoute>
          }
        />

        {/* ✅ NEW: Module 5 - Smart Booking */}
        <Route
          path="/customer/book"
          element={
            <ProtectedRoute role="CUSTOMER">
              <BookingWizard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/recommendations"
          element={
            <ProtectedRoute role="CUSTOMER">
              <VehicleRecommendations />
            </ProtectedRoute>
          }
        />

        {/* ✅ NEW: Module 4 - Maintenance Analytics */}
        <Route
          path="/manager/maintenance"
          element={
            <ProtectedRoute role="MANAGER">
              <MaintenanceAnalytics />
            </ProtectedRoute>
          }
        />

        {/* 🚫 Catch-All */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

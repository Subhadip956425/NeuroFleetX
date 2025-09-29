import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminDashboard from "./pages/AdminDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import DriverDashboard from "./pages/DriverDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Routes */}
        <Route
          path="/admin"
          element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>}
        />
        <Route
          path="/manager"
          element={<ProtectedRoute role="manager"><ManagerDashboard /></ProtectedRoute>}
        />
        <Route
          path="/customer"
          element={<ProtectedRoute role="customer"><CustomerDashboard /></ProtectedRoute>}
        />
        <Route
          path="/driver"
          element={<ProtectedRoute role="driver"><DriverDashboard /></ProtectedRoute>}
        />
      </Routes>
    </Router>
  );
}

export default App;

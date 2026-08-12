import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import People from "./pages/People";
import MilkEntries from "./pages/MilkEntries";
import Billing from "./pages/Billing";
import Profile from "./pages/Profile";
import { authService } from "./services/api";

// Guard for Owner-only routes
const OwnerRoute = ({ children }) => {
  const user = authService.getCurrentUser();
  const token = authService.getToken();

  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== "owner") {
    return <Navigate to="/profile" replace />;
  }

  return children;
};

// Guard for Supplier/Customer-only routes
const ClientRoute = ({ children }) => {
  const user = authService.getCurrentUser();
  const token = authService.getToken();

  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  if (user.role === "owner") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/" element={<Login />} />

      {/* Owner-Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <OwnerRoute>
            <Dashboard />
          </OwnerRoute>
        }
      />
      <Route
        path="/people"
        element={
          <OwnerRoute>
            <People />
          </OwnerRoute>
        }
      />
      <Route
        path="/milk"
        element={
          <OwnerRoute>
            <MilkEntries />
          </OwnerRoute>
        }
      />
      <Route
        path="/billing"
        element={
          <OwnerRoute>
            <Billing />
          </OwnerRoute>
        }
      />

      {/* Client-Protected Route */}
      <Route
        path="/profile"
        element={
          <ClientRoute>
            <Profile />
          </ClientRoute>
        }
      />

      {/* Fallback Redirections */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
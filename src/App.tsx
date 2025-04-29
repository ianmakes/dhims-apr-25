
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Home from "@/pages/Home";
import Students from "@/pages/Students";
import Sponsors from "@/pages/Sponsors";
import Timeline from "@/pages/Timeline";  // Now this import will work
import Settings from "@/pages/Settings";
import GeneralSettings from "@/pages/settings/GeneralSettings";
import ProfileSettings from "@/pages/settings/ProfileSettings";
import SmtpSettings from "@/pages/settings/SmtpSettings";
import AuditLogSettings from "@/pages/settings/AuditLogSettings";
import UserRolesSettings from "@/pages/settings/UserRolesSettings";
import { SettingsLayout } from "@/components/settings/SettingsLayout";
import AcademicYearsSettings from "@/pages/settings/AcademicYearsSettings";

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Main Routes */}
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
          <Route path="/sponsors" element={<ProtectedRoute><Sponsors /></ProtectedRoute>} />
          <Route path="/timeline" element={<ProtectedRoute><Timeline /></ProtectedRoute>} />

          {/* Settings Routes */}
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsLayout /></ProtectedRoute>}>
            <Route path="general" element={<GeneralSettings />} />
            <Route path="profile" element={<ProfileSettings />} />
            <Route path="smtp" element={<SmtpSettings />} />
            <Route path="academic-years" element={<AcademicYearsSettings />} />
            <Route path="audit" element={<AuditLogSettings />} />
            <Route path="roles" element={<UserRolesSettings />} />
          </Route>

          {/* Add more routes as needed */}
        </Routes>
      </AuthProvider>
    </Router>
  );
}

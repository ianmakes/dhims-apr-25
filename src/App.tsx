
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { SettingsLayout } from "./components/settings/SettingsLayout";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import StudentDetail from "./pages/StudentDetail";
import Sponsors from "./pages/Sponsors";
import SponsorDetail from "./pages/SponsorDetail";
import Exams from "./pages/Exams";
import ExamDetail from "./pages/ExamDetail";
import Users from "./pages/Users";
import GeneralSettings from "./pages/settings/GeneralSettings";
import ProfileSettings from "./pages/settings/ProfileSettings";
import SmtpSettings from "./pages/settings/SmtpSettings";
import AuditLogSettings from "./pages/settings/AuditLogSettings";
import UserRolesSettings from "./pages/settings/UserRolesSettings";
import AcademicYearsSettings from "./pages/settings/AcademicYearsSettings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import "./App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Auth Routes */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected Routes */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              {/* Dashboard */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Students */}
              <Route path="/students" element={<Students />} />
              <Route path="/students/:idOrSlug" element={<StudentDetail />} />
              
              {/* Sponsors */}
              <Route path="/sponsors" element={<Sponsors />} />
              <Route path="/sponsors/:idOrSlug" element={<SponsorDetail />} />
              
              {/* Exams */}
              <Route path="/exams" element={<Exams />} />
              <Route path="/exams/:id" element={<ExamDetail />} />
              
              {/* Users */}
              <Route path="/users" element={<Users />} />
              
              {/* Settings */}
              <Route path="/settings" element={<SettingsLayout />}>
                <Route index element={<Navigate to="/settings/general" replace />} />
                <Route path="general" element={<GeneralSettings />} />
                <Route path="profile" element={<ProfileSettings />} />
                <Route path="smtp" element={<SmtpSettings />} />
                <Route path="audit" element={<AuditLogSettings />} />
                <Route path="roles" element={<UserRolesSettings />} />
                <Route path="academic" element={<AcademicYearsSettings />} />
              </Route>
            </Route>
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

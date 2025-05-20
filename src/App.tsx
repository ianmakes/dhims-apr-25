import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@supabase/auth-helpers-react";
import { supabase } from "./integrations/supabase/client";

import AppLayout from "./components/layout/AppLayout";
import AuthLayout from "./components/layout/AuthLayout";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Sponsors from "./pages/Sponsors";
import Exams from "./pages/Exams";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Users from "./pages/Users";
import Roles from "./pages/Roles";
import AuditLogs from "./pages/AuditLogs";
import AcademicYears from "./pages/AcademicYears";
import GeneralSettings from "./pages/settings/GeneralSettings";
import ProfileSettings from "./pages/settings/ProfileSettings";
import EmailSettings from "./pages/settings/EmailSettings";
import { GlobalSettingsProvider } from "./components/settings/GlobalSettingsProvider";
import { Footer } from "./components/layout/Footer";

function App() {
  const { toast } = useToast();
  const user = useUser();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Function to update online status
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Set initial online status
    setIsOnline(navigator.onLine);

    // Add event listeners for online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Clean up event listeners when component unmounts
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  useEffect(() => {
    if (!isOnline) {
      toast({
        title: "No internet connection",
        description: "Some features may be unavailable.",
        variant: "destructive",
      });
    }
  }, [isOnline, toast]);

  return (
    <GlobalSettingsProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<AuthLayout />} />
            <Route path="/register" element={<AuthLayout />} />
            <Route path="/forgot-password" element={<AuthLayout />} />
            <Route path="/reset-password" element={<AuthLayout />} />
          </Route>

          <Route
            path="/"
            element={
              user ? (
                <AppLayout />
              ) : (
                <Navigate to="/login" replace={true} />
              )
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/sponsors" element={<Sponsors />} />
            <Route path="/exams" element={<Exams />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/users" element={<Users />} />
            <Route path="/roles" element={<Roles />} />
            <Route path="/audit" element={<AuditLogs />} />
            <Route path="/academic" element={<AcademicYears />} />

            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/general" element={<GeneralSettings />} />
            <Route path="/settings/profile" element={<ProfileSettings />} />
            <Route path="/settings/smtp" element={<EmailSettings />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </GlobalSettingsProvider>
  );
}

export default App;

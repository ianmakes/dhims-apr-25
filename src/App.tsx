
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
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
import GeneralSettings from "./pages/settings/GeneralSettings";
import ProfileSettings from "./pages/settings/ProfileSettings";
import EmailSettings from "./pages/settings/EmailSettings";
import { GlobalSettingsProvider } from "./components/settings/GlobalSettingsProvider";
import { Footer } from "./components/layout/Footer";

function App() {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Check if user is logged in
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    checkUser();
    
    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

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
            <Route path="/login" element={<div>Login Page</div>} />
            <Route path="/register" element={<div>Register Page</div>} />
            <Route path="/forgot-password" element={<div>Forgot Password Page</div>} />
            <Route path="/reset-password" element={<div>Reset Password Page</div>} />
          </Route>

          <Route
            path="/"
            element={
              user ? (
                <AppLayout>
                  <Outlet />
                </AppLayout>
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

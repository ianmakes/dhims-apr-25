
import React from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { AcademicYearProvider } from "@/contexts/AcademicYearContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Import pages
import Dashboard from "@/pages/Dashboard";
import Students from "@/pages/Students";
import Sponsors from "@/pages/Sponsors";
import Exams from "@/pages/Exams";
import Settings from "@/pages/Settings";
import GeneralSettings from "@/pages/settings/GeneralSettings";
import ProfileSettings from "@/pages/settings/ProfileSettings";
import SmtpSettings from "@/pages/settings/SmtpSettings";
import AcademicYearsSettings from "@/pages/settings/AcademicYearsSettings";
import AuditLogSettings from "@/pages/settings/AuditLogSettings";
import UserRolesSettings from "@/pages/settings/UserRolesSettings";

// Create a client
const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        path: "/",
        element: <ProtectedRoute><Dashboard /></ProtectedRoute>,
      },
      {
        path: "/students",
        element: <ProtectedRoute><Students /></ProtectedRoute>,
      },
      {
        path: "/sponsors",
        element: <ProtectedRoute><Sponsors /></ProtectedRoute>,
      },
      {
        path: "/exams",
        element: <ProtectedRoute><Exams /></ProtectedRoute>,
      },
      {
        path: "/settings",
        element: <ProtectedRoute><Settings /></ProtectedRoute>,
        children: [
          { path: "general", element: <GeneralSettings /> },
          { path: "profile", element: <ProfileSettings /> },
          { path: "smtp", element: <SmtpSettings /> },
          { path: "academic", element: <AcademicYearsSettings /> },
          { path: "audit", element: <AuditLogSettings /> },
          { path: "roles", element: <UserRolesSettings /> },
        ],
      },
    ],
  }
]);

function App() {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="wp-theme">
          <AuthProvider>
            <AcademicYearProvider>
              <RouterProvider router={router} />
            </AcademicYearProvider>
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
}

export default App;

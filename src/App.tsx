
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./App.css";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import StudentDetail from "./pages/StudentDetail";
import Sponsors from "./pages/Sponsors";
import SponsorDetail from "./pages/SponsorDetail";
import Exams from "./pages/Exams";
import ExamDetail from "./pages/ExamDetail";
import Settings from "./pages/Settings";
import { Toaster } from "./components/ui/toaster";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import NotFound from "./pages/NotFound";
import { initializeApp } from "./utils/initializeApp";
import Profile from "./pages/Profile";
import Users from "./pages/Users";
import AcademicYearsSettings from "./pages/settings/AcademicYearsSettings";
import { AcademicYearProvider } from "./contexts/AcademicYearContext";

// Create a client
const queryClient = new QueryClient();

// Define the router configuration
const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
  },
  {
    path: "/auth",
    element: <Auth />,
  },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "/dashboard",
        element: <Dashboard />,
      },
      {
        path: "/students",
        element: <Students />,
      },
      {
        path: "/students/:slug",
        element: <StudentDetail />,
      },
      {
        path: "/sponsors",
        element: <Sponsors />,
      },
      {
        path: "/sponsors/:slug",
        element: <SponsorDetail />,
      },
      {
        path: "/exams",
        element: <Exams />,
      },
      {
        path: "/exams/:id",
        element: <ExamDetail />,
      },
      {
        path: "/users",
        element: <Users />,
      },
      {
        path: "/profile",
        element: <Profile />,
      },
      {
        path: "/settings/*",
        element: <Settings />,
      },
      {
        path: "/settings/academic-years",
        element: <AcademicYearsSettings />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

function App() {
  useEffect(() => {
    initializeApp();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AcademicYearProvider>
          <RouterProvider router={router} />
          <Toaster />
        </AcademicYearProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

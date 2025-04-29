
import { createBrowserRouter } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import StudentDetail from "./pages/StudentDetail";
import Sponsors from "./pages/Sponsors";
import SponsorDetail from "./pages/SponsorDetail";
import Exams from "./pages/Exams";
import ExamDetail from "./pages/ExamDetail";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import Profile from "./pages/Profile";

// Academic Year settings
import AcademicYearsSettings from "./pages/settings/AcademicYearsSettings";
import UserRolesSettings from "./pages/settings/UserRolesSettings";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
  },
  {
    path: "/auth",
    element: <Auth />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "students",
        element: <Students />,
      },
      {
        path: "students/:id",
        element: <StudentDetail />,
      },
      {
        path: "sponsors",
        element: <Sponsors />,
      },
      {
        path: "sponsors/:id",
        element: <SponsorDetail />,
      },
      {
        path: "exams",
        element: <Exams />,
      },
      {
        path: "exams/:id",
        element: <ExamDetail />,
      },
      {
        path: "users",
        element: <Users />,
      },
      {
        path: "profile",
        element: <Profile />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "settings/academic",
        element: <AcademicYearsSettings />,
      },
      {
        path: "settings/roles",
        element: <UserRolesSettings />,
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
]);

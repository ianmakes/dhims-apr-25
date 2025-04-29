
import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { SettingsLayout } from "./components/settings/SettingsLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import StudentDetail from "./pages/StudentDetail";
import Sponsors from "./pages/Sponsors";
import SponsorDetail from "./pages/SponsorDetail";
import Exams from "./pages/Exams";
import ExamDetail from "./pages/ExamDetail";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import UserRolesSettings from "./pages/settings/UserRolesSettings";
import AcademicYearsSettings from "./pages/settings/AcademicYearsSettings";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

export const router = createBrowserRouter([
  { 
    path: "/auth", 
    element: <Auth /> 
  },
  {
    path: "/",
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "students", element: <Students /> },
      { path: "students/:id", element: <StudentDetail /> },
      { path: "sponsors", element: <Sponsors /> },
      { path: "sponsors/:id", element: <SponsorDetail /> },
      { path: "exams", element: <Exams /> },
      { path: "exams/:id", element: <ExamDetail /> },
      { path: "users", element: <Users /> },
      {
        path: "settings",
        element: <SettingsLayout />,
        children: [
          { index: true, element: <Settings /> },
          { path: "general", element: <Settings /> },
          { path: "profile", element: <Profile /> },
          { path: "smtp", element: <div>Email and SMTP Settings</div> },
          { path: "audit", element: <div>Audit Logs</div> },
          { path: "roles", element: <UserRolesSettings /> },
          { path: "academic", element: <AcademicYearsSettings /> },
        ],
      },
    ],
  },
  { path: "*", element: <NotFound /> },
]);

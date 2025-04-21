
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import StudentDetail from "./pages/StudentDetail";
import Sponsors from "./pages/Sponsors";
import SponsorDetail from "./pages/SponsorDetail";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            {/* Dashboard */}
            <Route path="/" element={<Dashboard />} />
            
            {/* Students */}
            <Route path="/students" element={<Students />} />
            <Route path="/students/:id" element={<StudentDetail />} />
            
            {/* Sponsors */}
            <Route path="/sponsors" element={<Sponsors />} />
            <Route path="/sponsors/:id" element={<SponsorDetail />} />
            
            {/* Exams */}
            {/* To be implemented */}
            
            {/* Users */}
            <Route path="/users" element={<Users />} />
            
            {/* Settings */}
            <Route path="/settings" element={<Settings />} />
          </Route>
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

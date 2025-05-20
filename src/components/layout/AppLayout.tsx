
import Sidebar from "./Sidebar";
import { AppHeader } from "./AppHeader";
import { useState } from "react";
import { Footer } from "./Footer";
import { useAppSettings } from "../settings/GlobalSettingsProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { settings } = useAppSettings();

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl space-y-6">
            {children}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}

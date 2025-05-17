
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { AppHeader } from "./AppHeader";

export function AppLayout() {
  return (
    <div className="flex h-screen w-full bg-wp-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-auto bg-wp-gray-50">
          <div className="wp-container py-4 md:py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

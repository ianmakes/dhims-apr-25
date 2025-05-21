
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { AppHeader } from "./AppHeader";
import { useAppSettings } from "../settings/GlobalSettingsProvider";

export function AppLayout() {
  const { settings } = useAppSettings();
  
  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-auto bg-wp-gray-50 flex flex-col">
          <div className="page-content-container px-4 py-4 md:px-6 md:py-6 flex-grow">
            <Outlet />
          </div>
          {settings?.footer_text && (
            <footer className="h-[50px] flex items-center justify-center text-sm text-muted-foreground border-t">
              {settings.footer_text}
            </footer>
          )}
        </main>
      </div>
    </div>
  );
}

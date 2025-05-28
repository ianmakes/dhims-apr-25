
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
        <main className="flex flex-col flex-1 overflow-hidden bg-wp-gray-50">
          <div className="flex-1 overflow-auto">
            <div className="page-content-container px-3 py-3 md:px-4 md:py-4 min-h-full">
              <Outlet />
            </div>
          </div>
          {settings?.footer_text && (
            <footer className="h-12 flex items-center justify-center text-sm text-muted-foreground border-t bg-background shrink-0">
              {settings.footer_text}
            </footer>
          )}
        </main>
      </div>
    </div>
  );
}

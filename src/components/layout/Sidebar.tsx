
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  BarChart2, 
  Users, 
  UserCircle, 
  BookOpen, 
  Settings, 
  User, 
  ChevronLeft, 
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const [appVersion, setAppVersion] = useState("1.0.0");
  const [sidebarTheme, setSidebarTheme] = useState({
    bg: "bg-sidebar",
    text: "text-sidebar-foreground"
  });
  
  const isActiveRoute = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // Fetch app settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('*')
          .eq('id', 'general')
          .single();
          
        if (data && !error) {
          if (data.app_version) {
            setAppVersion(data.app_version);
          }
          
          // Apply custom theme if available
          if (data.primary_color && data.secondary_color) {
            document.documentElement.style.setProperty('--primary', data.primary_color);
            document.documentElement.style.setProperty('--secondary', data.secondary_color);
          }
        }
      } catch (error) {
        console.error("Error fetching app settings:", error);
      }
    };
    
    fetchSettings();
  }, []);

  const sidebarItems = [
    {
      title: "Dashboard",
      path: "/dashboard",
      icon: <BarChart2 className="h-5 w-5" />,
    },
    {
      title: "Students",
      path: "/students",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Sponsors",
      path: "/sponsors",
      icon: <UserCircle className="h-5 w-5" />,
    },
    {
      title: "Exams",
      path: "/exams",
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      title: "Users",
      path: "/users",
      icon: <User className="h-5 w-5" />,
    },
    {
      title: "Settings",
      path: "/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  return (
    <aside
      className={cn(
        "h-screen flex-shrink-0 bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out",
        collapsed ? "w-12 md:w-14" : "w-60"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Sidebar Header */}
        <div className="flex items-center h-14 px-3 border-b border-sidebar-border">
          {!collapsed && (
            <div className="flex items-center space-x-2 overflow-hidden">
              <BookOpen className="h-6 w-6 text-sidebar-foreground flex-shrink-0" />
              <h1 className="font-medium text-base text-sidebar-foreground truncate">DHIMS</h1>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "ml-auto p-1 text-sidebar-foreground hover:bg-sidebar-accent rounded-full h-7 w-7 flex items-center justify-center",
              collapsed && "mx-auto"
            )}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 py-2 overflow-y-auto">
          <nav className="space-y-1 px-2">
            {sidebarItems.map((item) => (
              <Link key={item.title} to={item.path}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full flex justify-start text-sidebar-foreground hover:bg-sidebar-accent transition-colors h-10 px-3 py-2",
                    collapsed ? "justify-center p-2" : "",
                    isActiveRoute(item.path) ? "bg-sidebar-accent font-medium text-white" : ""
                  )}
                >
                  {item.icon}
                  {!collapsed && <span className="ml-3 truncate">{item.title}</span>}
                </Button>
              </Link>
            ))}
          </nav>
        </div>

        {/* Version info */}
        {!collapsed && (
          <div className="px-3 py-2 text-xs text-sidebar-foreground/60">
            Version {appVersion}
          </div>
        )}
      </div>
    </aside>
  );
}

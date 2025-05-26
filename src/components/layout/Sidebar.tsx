
import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { useAppSettings } from "@/components/settings/GlobalSettingsProvider";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { settings } = useAppSettings();
  
  const isActiveRoute = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

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

  const organizationName = settings?.organization_name || "DHIMS";
  const appVersion = settings?.app_version || "1.0.0";

  return (
    <aside
      className={cn(
        "h-screen flex-shrink-0 bg-sidebar border-r border-border transition-all duration-300 ease-in-out flex flex-col",
        collapsed ? "w-12 md:w-14" : "w-60"
      )}
    >
      {/* Sidebar Header */}
      <div className="flex items-center h-14 px-3 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center space-x-2 overflow-hidden">
            <BookOpen className="h-6 w-6 text-sidebar-foreground flex-shrink-0" />
            <h1 className="font-medium text-base text-sidebar-foreground truncate">{organizationName}</h1>
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
                  isActiveRoute(item.path) ? "bg-sidebar-accent font-medium" : ""
                )}
              >
                {item.icon}
                {!collapsed && <span className="ml-3 truncate">{item.title}</span>}
              </Button>
            </Link>
          ))}
        </nav>
      </div>

      {/* App Version Badge */}
      <div className="p-3 border-t border-sidebar-border">
        {!collapsed ? (
          <Badge 
            variant="secondary" 
            className="w-full justify-center text-xs bg-sidebar-accent text-sidebar-foreground"
          >
            v{appVersion}
          </Badge>
        ) : (
          <div className="flex justify-center">
            <Badge 
              variant="secondary" 
              className="text-xs bg-sidebar-accent text-sidebar-foreground px-1"
            >
              v{appVersion.split('.')[0]}
            </Badge>
          </div>
        )}
      </div>
    </aside>
  );
}

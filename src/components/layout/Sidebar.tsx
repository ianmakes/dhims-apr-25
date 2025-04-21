
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
  Menu, 
  X, 
  LogOut, 
  Home,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";

type SidebarItem = {
  title: string;
  path: string;
  icon: React.ReactNode;
  children?: { title: string; path: string }[];
};

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const location = useLocation();
  
  const toggleSubmenu = (title: string) => {
    setOpenSubmenu(openSubmenu === title ? null : title);
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const sidebarItems: SidebarItem[] = [
    {
      title: "Dashboard",
      path: "/",
      icon: <BarChart2 className="h-5 w-5" />,
    },
    {
      title: "Students",
      path: "/students",
      icon: <Users className="h-5 w-5" />,
      children: [
        { title: "All Students", path: "/students" },
        { title: "Add Student", path: "/students/new" },
      ],
    },
    {
      title: "Sponsors",
      path: "/sponsors",
      icon: <UserCircle className="h-5 w-5" />,
      children: [
        { title: "All Sponsors", path: "/sponsors" },
        { title: "Add Sponsor", path: "/sponsors/new" },
      ],
    },
    {
      title: "Exams",
      path: "/exams",
      icon: <BookOpen className="h-5 w-5" />,
      children: [
        { title: "All Exams", path: "/exams" },
        { title: "Add Exam", path: "/exams/new" },
        { title: "Grade Entry", path: "/exams/grade-entry" },
      ],
    },
    {
      title: "Users",
      path: "/users",
      icon: <User className="h-5 w-5" />,
      children: [
        { title: "All Users", path: "/users" },
        { title: "Add User", path: "/users/new" },
        { title: "Roles", path: "/users/roles" },
      ],
    },
    {
      title: "Settings",
      path: "/settings",
      icon: <Settings className="h-5 w-5" />,
      children: [
        { title: "Academic Year", path: "/settings/academic-year" },
        { title: "Audit Logs", path: "/settings/audit-logs" },
        { title: "SMTP Settings", path: "/settings/smtp" },
        { title: "Theme", path: "/settings/theme" },
        { title: "Profile", path: "/settings/profile" },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar border-r border-border relative transition-all-medium",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <Home className="h-6 w-6 text-sidebar-foreground" />
              <h1 className="font-bold text-xl text-sidebar-foreground">DHIMS</h1>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {collapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
          </Button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 py-4 overflow-y-auto">
          <nav className="space-y-1 px-2">
            {sidebarItems.map((item) => (
              <div key={item.title} className="space-y-1">
                {item.children ? (
                  <>
                    <Button
                      variant="ghost"
                      onClick={() => toggleSubmenu(item.title)}
                      className={cn(
                        "w-full flex justify-between items-center text-sidebar-foreground hover:bg-sidebar-accent transition-colors",
                        isActiveRoute(item.path) && "bg-sidebar-accent"
                      )}
                    >
                      <div className="flex items-center">
                        {item.icon}
                        {!collapsed && <span className="ml-3">{item.title}</span>}
                      </div>
                      {!collapsed && (
                        <>
                          {openSubmenu === item.title ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </>
                      )}
                    </Button>
                    {openSubmenu === item.title && !collapsed && (
                      <div className="ml-6 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <Link key={child.path} to={child.path}>
                            <Button
                              variant="ghost"
                              className={cn(
                                "w-full justify-start pl-6 text-sidebar-foreground hover:bg-sidebar-accent transition-colors",
                                isActiveRoute(child.path) && "bg-sidebar-accent"
                              )}
                            >
                              {child.title}
                            </Button>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link to={item.path}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full flex justify-start text-sidebar-foreground hover:bg-sidebar-accent transition-colors",
                        isActiveRoute(item.path) && "bg-sidebar-accent"
                      )}
                    >
                      {item.icon}
                      {!collapsed && <span className="ml-3">{item.title}</span>}
                    </Button>
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <Button
            variant="ghost"
            className="w-full flex justify-start text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span className="ml-3">Logout</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
}

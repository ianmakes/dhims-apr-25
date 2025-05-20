import {
  LayoutDashboard,
  Users,
  Calendar,
  Book,
  Settings,
  UserPlus,
  FileText,
  LogOut,
  Palette,
  LucideIcon,
  BadgeCheck,
  HeartHandshake,
  ScrollText,
  ImagePlus,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/hooks/use-theme";
import { Moon, Sun } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAppSettings } from "../settings/GlobalSettingsProvider";

interface NavItemProps {
  label: string;
  icon: LucideIcon;
  to: string;
}

const NavItem = ({ label, icon: Icon, to }: NavItemProps) => {
  const location = useLocation();
  const isActive = location.pathname.startsWith(to);

  return (
    <li>
      <Link
        to={to}
        className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:bg-secondary/50 ${
          isActive ? "bg-secondary/50" : "text-muted-foreground"
        }`}
      >
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </Link>
    </li>
  );
};

interface MobileNavItemProps {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}

const MobileNavItem = ({ label, icon: Icon, onClick }: MobileNavItemProps) => {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:bg-secondary/50"
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
};

export default function Sidebar() {
  const { signOut, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { settings } = useAppSettings();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="flex h-full border-r bg-popover text-popover-foreground flex-col">
      <div className="px-3 py-2">
        <Link to="/" className="flex items-center px-2 py-3">
          {settings?.logo_url ? (
            <img 
              src={settings.logo_url} 
              alt={settings.organization_name}
              className="h-8 w-auto" 
            />
          ) : (
            <span className="text-lg font-semibold">
              {settings?.organization_name || "David's Hope"}
            </span>
          )}
        </Link>
      </div>
      <Separator />
      <div className="flex-1 overflow-y-auto py-2">
        <nav className="grid gap-1 px-2 text-sm">
          <ul>
            <NavItem label="Dashboard" icon={LayoutDashboard} to="/dashboard" />
            <NavItem label="Students" icon={Users} to="/students" />
            <NavItem label="Sponsors" icon={HeartHandshake} to="/sponsors" />
            <NavItem label="Academics" icon={Book} to="/academics" />
          </ul>
          <Label className="mt-4 px-2 font-medium text-muted-foreground">
            Manage
          </Label>
          <ul>
            <NavItem label="Users" icon={UserPlus} to="/users" />
            <NavItem label="Roles" icon={BadgeCheck} to="/roles" />
            <NavItem label="Settings" icon={Settings} to="/settings" />
          </ul>
        </nav>
      </div>
      <Separator />
      <div className="flex flex-col space-y-4 px-4 py-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center space-x-2 rounded-md p-2 hover:bg-secondary/50">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start space-y-0.5">
                <span className="text-sm font-medium">{user?.user_metadata?.full_name}</span>
                <span className="text-xs text-muted-foreground">{user?.email}</span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Link to="/profile" className="w-full">
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="space-y-1">
          <Label>Theme</Label>
          <div className="flex items-center justify-between rounded-md border p-2">
            <span className="text-sm font-medium">Dark Mode</span>
            <Switch
              checked={mounted && theme === "dark"}
              onCheckedChange={(checked) => {
                if (checked) {
                  setTheme("dark");
                } else {
                  setTheme("light");
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

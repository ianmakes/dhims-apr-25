
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";
import { Bell, User, ChevronDown, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AppHeader } from "./AppHeader";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAcademicYear } from "@/contexts/AcademicYearContext";

export function AppLayout() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { currentYear } = useAcademicYear();
  
  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="bg-white border-b border-wp-border py-2 px-4 md:px-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-wp-text-secondary" />
                <Input 
                  placeholder="Search students, sponsors, exams, users..."
                  className="pl-8 bg-wp-gray-50 border-wp-gray-200"
                />
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Activity Logs Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
                    <Bell className="h-4 w-4 text-wp-text-secondary" />
                    <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-wp-error" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Activity Logs</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-80 overflow-y-auto">
                    <DropdownMenuItem className="cursor-pointer py-3">
                      <div>
                        <p className="font-medium">New student registered</p>
                        <p className="text-sm text-muted-foreground">
                          John Doe has been registered as a new student
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          2 hours ago
                        </p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer py-3">
                      <div>
                        <p className="font-medium">Exam results updated</p>
                        <p className="text-sm text-muted-foreground">
                          Term 2 exam results have been uploaded
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          1 day ago
                        </p>
                      </div>
                    </DropdownMenuItem>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer justify-center text-wp-primary">
                    View all activity
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative p-0 h-8 flex items-center space-x-1 text-wp-text-secondary rounded hover:text-wp-text-primary focus:outline-none">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={user?.user_metadata?.avatar_url || ""} alt="User" />
                      <AvatarFallback className="bg-wp-gray-300 text-wp-gray-700">
                        <User className="h-3.5 w-3.5" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm hidden md:inline">{user?.user_metadata?.name || "Admin"}</span>
                    <ChevronDown className="h-3.5 w-3.5 hidden md:inline" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/settings/profile')}>Profile</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/settings/general')}>Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>Log out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-wp-gray-50 p-4 md:p-6">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

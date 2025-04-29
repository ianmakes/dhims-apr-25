
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Bell, Search, Menu, X, LogOut, Settings, User, ChevronDown } from "lucide-react";
import { useMobileStore } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { AcademicYearSelector } from "@/components/academic/AcademicYearSelector";

export function AppHeader() {
  const { sidebarOpen, setSidebarOpen } = useMobileStore();
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);

  const isSettingsPage = location.pathname.startsWith('/settings');
  const userInitials = user?.email ? user.email.substring(0, 2).toUpperCase() : "U";

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <Button 
        variant="ghost" 
        className="mr-2 h-9 w-9 p-0 lg:hidden" 
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <span className="sr-only">Toggle sidebar</span>
        {sidebarOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </Button>
      
      {/* Mobile search toggle */}
      <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden" onClick={() => setSearchOpen(!searchOpen)}>
        <Search className="h-5 w-5" />
      </Button>
      
      {/* Desktop search */}
      <div className={`${searchOpen ? 'flex' : 'hidden'} w-full md:flex md:w-[200px] lg:w-[300px]`}>
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-full pl-8"
          />
        </div>
      </div>
      
      <div className="ml-auto flex items-center gap-2">
        {/* Academic Year Selector */}
        <div className="hidden md:block mr-4">
          <AcademicYearSelector />
        </div>
        
        <Button variant="outline" size="icon" className="rounded-full">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notifications</span>
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium">{user?.email}</div>
                <div className="text-xs text-muted-foreground">Administrator</div>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link to="/settings/profile" className="flex w-full items-center">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link to="/settings" className="flex w-full items-center">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

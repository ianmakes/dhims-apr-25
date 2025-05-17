
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

export function SettingsLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentTab = location.pathname.split('/').pop() || 'general';
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-wp-text-primary text-left">Settings</h2>
        <p className="text-muted-foreground text-wp-text-secondary text-left">
          Manage your account settings and preferences.
        </p>
      </div>
      
      <div className="wp-card">
        <Tabs value={currentTab} onValueChange={value => navigate(`/settings/${value}`)}>
          <TabsList className="w-full border-b border-wp-border overflow-auto flex justify-start rounded-none bg-wp-gray-50">
            <TabsTrigger 
              value="general" 
              className="data-[state=active]:bg-white data-[state=active]:border-t-2 data-[state=active]:border-t-wp-primary data-[state=active]:shadow-none rounded-none"
            >
              General
            </TabsTrigger>
            <TabsTrigger 
              value="profile" 
              className="data-[state=active]:bg-white data-[state=active]:border-t-2 data-[state=active]:border-t-wp-primary data-[state=active]:shadow-none rounded-none"
            >
              Profile & Account
            </TabsTrigger>
            <TabsTrigger 
              value="smtp" 
              className="data-[state=active]:bg-white data-[state=active]:border-t-2 data-[state=active]:border-t-wp-primary data-[state=active]:shadow-none rounded-none"
            >
              Email & SMTP
            </TabsTrigger>
            <TabsTrigger 
              value="academic" 
              className="data-[state=active]:bg-white data-[state=active]:border-t-2 data-[state=active]:border-t-wp-primary data-[state=active]:shadow-none rounded-none"
            >
              Academic Years
            </TabsTrigger>
            <TabsTrigger 
              value="audit" 
              className="data-[state=active]:bg-white data-[state=active]:border-t-2 data-[state=active]:border-t-wp-primary data-[state=active]:shadow-none rounded-none"
            >
              Audit Logs
            </TabsTrigger>
            <TabsTrigger 
              value="roles" 
              className="data-[state=active]:bg-white data-[state=active]:border-t-2 data-[state=active]:border-t-wp-primary data-[state=active]:shadow-none rounded-none"
            >
              User Roles
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="bg-white p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

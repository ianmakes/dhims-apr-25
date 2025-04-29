
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
        <h2 className="text-2xl font-bold tracking-tight text-left">Settings</h2>
        <p className="text-muted-foreground text-left">
          Manage your account settings and preferences.
        </p>
      </div>
      <Tabs value={currentTab} onValueChange={value => navigate(`/settings/${value}`)}>
        <TabsList className="w-full border-b overflow-auto flex justify-start">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="profile">Profile & Account</TabsTrigger>
          <TabsTrigger value="smtp">Email & SMTP</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="roles">User Roles</TabsTrigger>
          <TabsTrigger value="academic">Academic Years</TabsTrigger>
        </TabsList>
      </Tabs>
      <Card className="p-6">
        <Outlet />
      </Card>
    </div>
  );
}

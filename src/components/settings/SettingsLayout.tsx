
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type AcademicYear } from "@/types/exam";

export function SettingsLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentTab = location.pathname.split('/').pop() || 'general';
  const [currentAcademicYear, setCurrentAcademicYear] = useState<AcademicYear | null>(null);
  
  useEffect(() => {
    // Fetch current academic year
    const fetchCurrentYear = async () => {
      try {
        const { data, error } = await supabase
          .from('academic_years')
          .select('*')
          .eq('is_current', true)
          .single();
          
        if (error) {
          console.error("Error fetching current academic year:", error);
          return;
        }
        
        if (data) {
          setCurrentAcademicYear(data as AcademicYear);
        }
      } catch (error) {
        console.error("Error in fetchCurrentYear:", error);
      }
    };
    
    fetchCurrentYear();
  }, []);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-left">Settings</h2>
          <p className="text-muted-foreground text-left">
            Manage your account settings and preferences.
          </p>
        </div>
        {currentAcademicYear && (
          <div className="bg-green-50 border border-green-200 rounded-md px-3 py-2 flex items-center">
            <span className="text-sm text-green-800 font-medium">
              Current Academic Year: {currentAcademicYear.year_name}
            </span>
          </div>
        )}
      </div>
      <Tabs value={currentTab} onValueChange={value => navigate(`/settings/${value}`)}>
        <TabsList className="w-full border-b overflow-auto flex justify-start">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="smtp">Email & SMTP</TabsTrigger>
          <TabsTrigger value="academic">Academic Years</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="roles">User Roles</TabsTrigger>
        </TabsList>
      </Tabs>
      <Card className="p-6">
        <Outlet />
      </Card>
    </div>
  );
}

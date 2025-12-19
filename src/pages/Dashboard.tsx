import YearlyRevenueSummary from "@/components/YearlyRevenueSummary";
import UserDashboard from "@/components/dashboard/UserDashboard";
import { useUserRole } from "@/hooks/useUserRole";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationBell } from "@/components/NotificationBell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BarChart3, LayoutDashboard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type DashboardView = "analytics" | "overview";

const Dashboard = () => {
  const { isAdmin, loading } = useUserRole();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const availableYears = [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];
  const currentYear = new Date().getFullYear();
  const defaultYear = availableYears.includes(currentYear) ? currentYear : 2025;
  const [selectedYear, setSelectedYear] = useState(defaultYear);

  // Fetch admin's dashboard preference
  const { data: dashboardPreference, isLoading: prefLoading } = useQuery({
    queryKey: ['dashboard-preference', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('dashboard_preferences')
        .select('layout_view')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return (data?.layout_view as DashboardView) || 'analytics';
    },
    enabled: !!user?.id && isAdmin,
  });

  const [currentView, setCurrentView] = useState<DashboardView>("analytics");

  // Update local state when preference is loaded
  useEffect(() => {
    if (dashboardPreference) {
      setCurrentView(dashboardPreference);
    }
  }, [dashboardPreference]);

  // Mutation to save dashboard preference
  const savePreferenceMutation = useMutation({
    mutationFn: async (view: DashboardView) => {
      if (!user?.id) return;
      const { error } = await supabase
        .from('dashboard_preferences')
        .upsert({
          user_id: user.id,
          layout_view: view,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-preference', user?.id] });
    },
  });

  const handleViewChange = (value: string) => {
    if (value && (value === "analytics" || value === "overview")) {
      setCurrentView(value);
      savePreferenceMutation.mutate(value);
    }
  };

  if (loading || (isAdmin && prefLoading)) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  // Non-admin users only see UserDashboard
  if (!isAdmin) {
    return <UserDashboard />;
  }

  // Admin users can toggle between views
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Fixed Header */}
      <div className="flex-shrink-0 bg-background">
        <div className="px-6 h-16 flex items-center border-b w-full">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <ToggleGroup 
                type="single" 
                value={currentView} 
                onValueChange={handleViewChange}
                className="bg-muted rounded-lg p-1"
              >
                <ToggleGroupItem 
                  value="analytics" 
                  aria-label="Revenue Analytics"
                  className="data-[state=on]:bg-background data-[state=on]:shadow-sm px-3 py-1.5 text-sm"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Revenue Analytics
                </ToggleGroupItem>
                <ToggleGroupItem 
                  value="overview" 
                  aria-label="Dashboard Overview"
                  className="data-[state=on]:bg-background data-[state=on]:shadow-sm px-3 py-1.5 text-sm"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell placement="down" size="small" />
              {currentView === "analytics" && (
                <Select value={selectedYear.toString()} onValueChange={value => setSelectedYear(parseInt(value))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-auto">
        {currentView === "analytics" ? (
          <div className="p-6 space-y-8">
            <YearlyRevenueSummary selectedYear={selectedYear} />
            <div className="border-t border-border" />
          </div>
        ) : (
          <UserDashboard />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, FileText, Briefcase, TrendingUp, Clock, CheckCircle2, ArrowRight, Plus, Settings2, Calendar, Activity, Bell, AlertCircle } from "lucide-react";
import { useState } from "react";
import { DashboardCustomizeModal, WidgetKey, WidgetSize, WidgetSizeConfig, DEFAULT_WIDGETS } from "./DashboardCustomizeModal";
import { toast } from "sonner";
import { format, isAfter, isBefore, addDays } from "date-fns";

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [customizeOpen, setCustomizeOpen] = useState(false);
  
  // Fetch display name directly from profiles table
  const { data: userName } = useQuery({
    queryKey: ['user-profile-name', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();
      if (error) throw error;
      const name = data?.full_name;
      if (!name || name.includes('@')) {
        return user.email?.split('@')[0] || null;
      }
      return name;
    },
    enabled: !!user?.id,
  });

  // Fetch dashboard preferences
  const { data: dashboardPrefs } = useQuery({
    queryKey: ['dashboard-prefs', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('dashboard_preferences')
        .select('visible_widgets, card_order, layout_view')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Get visible widgets, order, and sizes from preferences or use defaults
  const defaultWidgetKeys = DEFAULT_WIDGETS.map(w => w.key);
  const visibleWidgets: WidgetKey[] = dashboardPrefs?.visible_widgets 
    ? (dashboardPrefs.visible_widgets as WidgetKey[])
    : defaultWidgetKeys;
  const widgetOrder: WidgetKey[] = dashboardPrefs?.card_order 
    ? (dashboardPrefs.card_order as WidgetKey[])
    : defaultWidgetKeys;
  
  // Safely parse widget sizes - handle legacy string values gracefully
  const parseWidgetSizes = (): WidgetSizeConfig => {
    if (!dashboardPrefs?.layout_view) return {};
    if (typeof dashboardPrefs.layout_view === 'object') {
      return dashboardPrefs.layout_view as WidgetSizeConfig;
    }
    if (typeof dashboardPrefs.layout_view === 'string') {
      try {
        const parsed = JSON.parse(dashboardPrefs.layout_view);
        if (typeof parsed === 'object' && parsed !== null) {
          return parsed as WidgetSizeConfig;
        }
      } catch {
        // Legacy string value like "grid" - ignore and use defaults
      }
    }
    return {};
  };
  const widgetSizes: WidgetSizeConfig = parseWidgetSizes();

  // Save dashboard preferences
  const savePreferencesMutation = useMutation({
    mutationFn: async ({ widgets, order, sizes }: { widgets: WidgetKey[], order: WidgetKey[], sizes: WidgetSizeConfig }) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }
      
      console.log("Saving dashboard preferences:", { widgets, order, sizes, userId: user.id });
      
      const { data, error } = await supabase
        .from('dashboard_preferences')
        .upsert({
          user_id: user.id,
          visible_widgets: widgets,
          card_order: order,
          layout_view: JSON.stringify(sizes),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
        .select();
      
      if (error) {
        console.error("Error saving preferences:", error);
        throw error;
      }
      
      console.log("Preferences saved successfully:", data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-prefs', user?.id] });
      setCustomizeOpen(false);
      toast.success("Dashboard preferences saved");
    },
    onError: (error) => {
      console.error("Mutation error:", error);
      toast.error("Failed to save preferences");
    },
  });

  // Fetch user's leads count
  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ['user-leads-count', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('leads').select('id, lead_status').eq('created_by', user?.id);
      if (error) throw error;
      return {
        total: data?.length || 0,
        new: data?.filter(l => l.lead_status === 'New').length || 0,
        contacted: data?.filter(l => l.lead_status === 'Contacted').length || 0,
        qualified: data?.filter(l => l.lead_status === 'Qualified').length || 0
      };
    },
    enabled: !!user?.id
  });

  // Fetch user's contacts count
  const { data: contactsData, isLoading: contactsLoading } = useQuery({
    queryKey: ['user-contacts-count', user?.id],
    queryFn: async () => {
      const { count, error } = await supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('created_by', user?.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id
  });

  // Fetch user's deals count and value
  const { data: dealsData, isLoading: dealsLoading } = useQuery({
    queryKey: ['user-deals-count', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('deals').select('id, stage, total_contract_value').eq('created_by', user?.id);
      if (error) throw error;
      const totalValue = data?.reduce((sum, d) => sum + (d.total_contract_value || 0), 0) || 0;
      const wonDeals = data?.filter(d => d.stage === 'Won') || [];
      const wonValue = wonDeals.reduce((sum, d) => sum + (d.total_contract_value || 0), 0);
      return {
        total: data?.length || 0,
        won: wonDeals.length,
        totalValue,
        wonValue,
        active: data?.filter(d => !['Won', 'Lost', 'Dropped'].includes(d.stage)).length || 0
      };
    },
    enabled: !!user?.id
  });

  // Fetch user's pending action items
  const { data: actionItemsData, isLoading: actionItemsLoading } = useQuery({
    queryKey: ['user-action-items', user?.id],
    queryFn: async () => {
      const { data: dealItems, error: dealError } = await supabase.from('deal_action_items').select('id, status, due_date').eq('assigned_to', user?.id).eq('status', 'Open');
      if (dealError) throw dealError;
      const { data: leadItems, error: leadError } = await supabase.from('lead_action_items').select('id, status, due_date').eq('assigned_to', user?.id).eq('status', 'Open');
      if (leadError) throw leadError;
      const allItems = [...(dealItems || []), ...(leadItems || [])];
      const overdue = allItems.filter(item => item.due_date && new Date(item.due_date) < new Date()).length;
      return { total: allItems.length, overdue };
    },
    enabled: !!user?.id
  });

  // Fetch upcoming meetings
  const { data: upcomingMeetings } = useQuery({
    queryKey: ['user-upcoming-meetings', user?.id],
    queryFn: async () => {
      const now = new Date().toISOString();
      const weekFromNow = addDays(new Date(), 7).toISOString();
      const { data, error } = await supabase
        .from('meetings')
        .select('id, subject, start_time, status')
        .eq('created_by', user?.id)
        .gte('start_time', now)
        .lte('start_time', weekFromNow)
        .order('start_time', { ascending: true })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  // Fetch task reminders (due soon or overdue) - only for current user
  const { data: taskReminders } = useQuery({
    queryKey: ['user-task-reminders', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const weekFromNow = format(addDays(new Date(), 7), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, due_date, priority, status')
        .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`)
        .in('status', ['open', 'in_progress'])
        .lte('due_date', weekFromNow)
        .order('due_date', { ascending: true })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  // Fetch recent activities
  const { data: recentActivities } = useQuery({
    queryKey: ['user-recent-activities', user?.id],
    queryFn: async () => {
      const { data: contactActivities, error: contactError } = await supabase
        .from('contact_activities')
        .select('id, subject, activity_type, activity_date')
        .eq('created_by', user?.id)
        .order('activity_date', { ascending: false })
        .limit(3);
      if (contactError) throw contactError;

      const { data: accountActivities, error: accountError } = await supabase
        .from('account_activities')
        .select('id, subject, activity_type, activity_date')
        .eq('created_by', user?.id)
        .order('activity_date', { ascending: false })
        .limit(3);
      if (accountError) throw accountError;

      const combined = [
        ...(contactActivities || []).map(a => ({ ...a, source: 'contact' })),
        ...(accountActivities || []).map(a => ({ ...a, source: 'account' })),
      ].sort((a, b) => new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime())
        .slice(0, 5);

      return combined;
    },
    enabled: !!user?.id
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const isLoading = leadsLoading || contactsLoading || dealsLoading || actionItemsLoading;
  const isWidgetVisible = (key: WidgetKey) => visibleWidgets.includes(key);

  // Get ordered visible widgets for stats row
  const statsWidgets: WidgetKey[] = ["leads", "contacts", "deals", "actionItems"];
  const orderedStatsWidgets = widgetOrder.filter(w => statsWidgets.includes(w) && isWidgetVisible(w));

  // Get ordered visible widgets for other sections
  const getOrderedWidgets = (keys: WidgetKey[]) => 
    widgetOrder.filter(w => keys.includes(w) && isWidgetVisible(w));

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  const renderWidget = (key: WidgetKey) => {
    switch (key) {
      case "leads":
        return (
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer animate-fade-in" onClick={() => navigate('/leads')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">My Leads</CardTitle>
              <FileText className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{leadsData?.total || 0}</div>
              <p className="text-xs text-muted-foreground">{leadsData?.new || 0} new, {leadsData?.qualified || 0} qualified</p>
            </CardContent>
          </Card>
        );
      case "contacts":
        return (
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer animate-fade-in" onClick={() => navigate('/contacts')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">My Contacts</CardTitle>
              <Users className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contactsData || 0}</div>
              <p className="text-xs text-muted-foreground">Total contacts created</p>
            </CardContent>
          </Card>
        );
      case "deals":
        return (
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer animate-fade-in" onClick={() => navigate('/deals')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">My Deals</CardTitle>
              <Briefcase className="w-4 h-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dealsData?.total || 0}</div>
              <p className="text-xs text-muted-foreground">{dealsData?.active || 0} active, {dealsData?.won || 0} won</p>
            </CardContent>
          </Card>
        );
      case "actionItems":
        return (
          <Card className="h-full hover:shadow-lg transition-shadow animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Action Items</CardTitle>
              <Clock className="w-4 h-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{actionItemsData?.total || 0}</div>
              <p className="text-xs text-muted-foreground">{actionItemsData?.overdue || 0} overdue</p>
            </CardContent>
          </Card>
        );
      case "upcomingMeetings":
        return (
          <Card className="h-full animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Upcoming Meetings
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/meetings')}>
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {upcomingMeetings && upcomingMeetings.length > 0 ? (
                <div className="space-y-3">
                  {upcomingMeetings.map((meeting) => (
                    <div key={meeting.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{meeting.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(meeting.start_time), 'dd/MM/yyyy HH:mm')}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        meeting.status === 'scheduled' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {meeting.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No upcoming meetings</p>
              )}
            </CardContent>
          </Card>
        );
      case "taskReminders":
        return (
          <Card className="h-full animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Task Reminders
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/tasks')}>
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {taskReminders && taskReminders.length > 0 ? (
                <div className="space-y-3">
                  {taskReminders.map((task) => {
                    const isOverdue = task.due_date && isBefore(new Date(task.due_date), new Date());
                    return (
                      <div key={task.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{task.title}</p>
                          <p className={`text-xs ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}>
                            {isOverdue && <AlertCircle className="w-3 h-3 inline mr-1" />}
                            Due: {task.due_date ? format(new Date(task.due_date), 'dd/MM/yyyy') : 'No date'}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          task.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No pending tasks</p>
              )}
            </CardContent>
          </Card>
        );
      case "recentActivities":
        return (
          <Card className="h-full animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Recent Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivities && recentActivities.length > 0 ? (
                <div className="space-y-3">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Activity className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{activity.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.activity_type} • {format(new Date(activity.activity_date), 'dd/MM/yyyy')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No recent activities</p>
              )}
            </CardContent>
          </Card>
        );
      case "performance":
        return (
          <Card className="h-full animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                My Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Total Pipeline Value</p>
                  <p className="text-xl font-bold">{formatCurrency(dealsData?.totalValue || 0)}</p>
                </div>
                <Briefcase className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Won Revenue</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(dealsData?.wonValue || 0)}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600/50" />
              </div>
            </CardContent>
          </Card>
        );
      case "quickActions":
        return (
          <Card className="h-full animate-fade-in">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-between" onClick={() => navigate('/leads')}>
                <span className="flex items-center gap-2"><Plus className="w-4 h-4" />Add New Lead</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between" onClick={() => navigate('/contacts')}>
                <span className="flex items-center gap-2"><Plus className="w-4 h-4" />Add New Contact</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between" onClick={() => navigate('/deals')}>
                <span className="flex items-center gap-2"><Plus className="w-4 h-4" />Create New Deal</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        );
      case "leadStatus":
        return (
          <Card className="h-full animate-fade-in">
            <CardHeader>
              <CardTitle>Lead Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{leadsData?.new || 0}</p>
                  <p className="text-sm text-muted-foreground">New</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{leadsData?.contacted || 0}</p>
                  <p className="text-sm text-muted-foreground">Contacted</p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{leadsData?.qualified || 0}</p>
                  <p className="text-sm text-muted-foreground">Qualified</p>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{leadsData?.total || 0}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  // Get widget size class
  const getWidgetSizeClass = (key: WidgetKey): string => {
    const size = widgetSizes[key] || DEFAULT_WIDGETS.find(w => w.key === key)?.size || "medium";
    switch (size) {
      case "small": return "col-span-1";
      case "medium": return "col-span-1 lg:col-span-2";
      case "large": return "col-span-1 lg:col-span-3";
      default: return "col-span-1";
    }
  };

  // Get all visible widgets in order
  const orderedVisibleWidgets = widgetOrder.filter(w => visibleWidgets.includes(w));

  return (
    <div className="p-6 space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back{userName ? `, ${userName}` : ''}!
          </h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => setCustomizeOpen(true)} className="gap-2">
          <Settings2 className="w-4 h-4" />
          Customize
        </Button>
      </div>

      {/* Responsive Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        {orderedVisibleWidgets.map(key => (
          <div key={key} className={getWidgetSizeClass(key)}>
            {renderWidget(key)}
          </div>
        ))}
      </div>

      {/* Customize Modal */}
      <DashboardCustomizeModal
        open={customizeOpen}
        onOpenChange={setCustomizeOpen}
        visibleWidgets={visibleWidgets}
        widgetOrder={widgetOrder}
        widgetSizes={widgetSizes}
        onSave={(widgets, order, sizes) => savePreferencesMutation.mutate({ widgets, order, sizes })}
        isSaving={savePreferencesMutation.isPending}
      />
    </div>
  );
};

export default UserDashboard;

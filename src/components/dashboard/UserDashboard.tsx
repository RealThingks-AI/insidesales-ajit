import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, FileText, Briefcase, TrendingUp, Clock, CheckCircle2, ArrowRight, Plus } from "lucide-react";

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
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
      // Return full_name, fallback to email username if it looks like an email
      const name = data?.full_name;
      if (!name || name.includes('@')) {
        return user.email?.split('@')[0] || null;
      }
      return name;
    },
    enabled: !!user?.id,
  });

  // Fetch user's leads count
  const {
    data: leadsData,
    isLoading: leadsLoading
  } = useQuery({
    queryKey: ['user-leads-count', user?.id],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('leads').select('id, lead_status').eq('created_by', user?.id);
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
  const {
    data: contactsData,
    isLoading: contactsLoading
  } = useQuery({
    queryKey: ['user-contacts-count', user?.id],
    queryFn: async () => {
      const {
        count,
        error
      } = await supabase.from('contacts').select('id', {
        count: 'exact',
        head: true
      }).eq('created_by', user?.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id
  });

  // Fetch user's deals count and value
  const {
    data: dealsData,
    isLoading: dealsLoading
  } = useQuery({
    queryKey: ['user-deals-count', user?.id],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('deals').select('id, stage, total_contract_value').eq('created_by', user?.id);
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
  const {
    data: actionItemsData,
    isLoading: actionItemsLoading
  } = useQuery({
    queryKey: ['user-action-items', user?.id],
    queryFn: async () => {
      const {
        data: dealItems,
        error: dealError
      } = await supabase.from('deal_action_items').select('id, status, due_date').eq('assigned_to', user?.id).eq('status', 'Open');
      if (dealError) throw dealError;
      const {
        data: leadItems,
        error: leadError
      } = await supabase.from('lead_action_items').select('id, status, due_date').eq('assigned_to', user?.id).eq('status', 'Open');
      if (leadError) throw leadError;
      const allItems = [...(dealItems || []), ...(leadItems || [])];
      const overdue = allItems.filter(item => item.due_date && new Date(item.due_date) < new Date()).length;
      return {
        total: allItems.length,
        overdue
      };
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
  if (isLoading) {
    return <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>;
  }
  return <div className="p-6 space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back{userName ? `, ${userName}` : ''}!
          </h1>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/leads')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">My Leads</CardTitle>
            <FileText className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leadsData?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {leadsData?.new || 0} new, {leadsData?.qualified || 0} qualified
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/contacts')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">My Contacts</CardTitle>
            <Users className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contactsData || 0}</div>
            <p className="text-xs text-muted-foreground">Total contacts created</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/deals')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">My Deals</CardTitle>
            <Briefcase className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dealsData?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {dealsData?.active || 0} active, {dealsData?.won || 0} won
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Action Items</CardTitle>
            <Clock className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{actionItemsData?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {actionItemsData?.overdue || 0} overdue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
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

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-between" onClick={() => navigate('/leads')}>
              <span className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add New Lead
              </span>
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between" onClick={() => navigate('/contacts')}>
              <span className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add New Contact
              </span>
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between" onClick={() => navigate('/deals')}>
              <span className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create New Deal
              </span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Lead Status Breakdown */}
      <Card>
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
    </div>;
};
export default UserDashboard;
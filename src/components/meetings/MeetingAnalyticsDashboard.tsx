import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar, 
  Clock, 
  UserX, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  BarChart3,
  PieChart as PieChartIcon,
  Loader2
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";
import { format, startOfWeek, endOfWeek, subWeeks, differenceInMinutes, parseISO } from "date-fns";

interface Meeting {
  id: string;
  subject: string;
  start_time: string;
  end_time: string;
  status: string;
  outcome?: string | null;
}

interface MeetingAnalyticsDashboardProps {
  onClose?: () => void;
}

export const MeetingAnalyticsDashboard = ({ onClose }: MeetingAnalyticsDashboardProps) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("4"); // weeks

  useEffect(() => {
    fetchMeetings();
  }, [timeRange]);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const weeksAgo = subWeeks(new Date(), parseInt(timeRange));
      
      const { data, error } = await supabase
        .from('meetings')
        .select('id, subject, start_time, end_time, status, outcome')
        .gte('start_time', weeksAgo.toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;
      setMeetings(data || []);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    const completedMeetings = meetings.filter(m => new Date(m.start_time) < now && m.status !== 'cancelled');
    const scheduledMeetings = meetings.filter(m => new Date(m.start_time) >= now && m.status !== 'cancelled');
    const cancelledMeetings = meetings.filter(m => m.status === 'cancelled');
    const noShowMeetings = meetings.filter(m => m.outcome === 'no_show');
    const successfulMeetings = meetings.filter(m => m.outcome === 'successful');
    const followUpMeetings = meetings.filter(m => m.outcome === 'follow_up_needed');

    // Calculate average duration
    const durations = completedMeetings.map(m => 
      differenceInMinutes(new Date(m.end_time), new Date(m.start_time))
    );
    const avgDuration = durations.length > 0 
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) 
      : 0;

    // No-show rate
    const noShowRate = completedMeetings.length > 0 
      ? Math.round((noShowMeetings.length / completedMeetings.length) * 100) 
      : 0;

    // Success rate
    const successRate = completedMeetings.length > 0 
      ? Math.round((successfulMeetings.length / completedMeetings.length) * 100) 
      : 0;

    return {
      total: meetings.length,
      completed: completedMeetings.length,
      scheduled: scheduledMeetings.length,
      cancelled: cancelledMeetings.length,
      noShow: noShowMeetings.length,
      successful: successfulMeetings.length,
      followUp: followUpMeetings.length,
      avgDuration,
      noShowRate,
      successRate
    };
  }, [meetings]);

  // Meetings per week data
  const weeklyData = useMemo(() => {
    const weeks: Record<string, { week: string; meetings: number; completed: number; cancelled: number }> = {};
    
    meetings.forEach(meeting => {
      const meetingDate = parseISO(meeting.start_time);
      const weekStart = startOfWeek(meetingDate, { weekStartsOn: 1 });
      const weekKey = format(weekStart, 'dd/MM');
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = { week: weekKey, meetings: 0, completed: 0, cancelled: 0 };
      }
      
      weeks[weekKey].meetings++;
      if (meeting.status === 'cancelled') {
        weeks[weekKey].cancelled++;
      } else if (new Date(meeting.start_time) < new Date()) {
        weeks[weekKey].completed++;
      }
    });

    return Object.values(weeks).sort((a, b) => {
      const dateA = new Date(a.week);
      const dateB = new Date(b.week);
      return dateA.getTime() - dateB.getTime();
    });
  }, [meetings]);

  // Duration trend data
  const durationTrendData = useMemo(() => {
    const now = new Date();
    const completedMeetings = meetings
      .filter(m => new Date(m.start_time) < now && m.status !== 'cancelled')
      .map(m => ({
        date: format(parseISO(m.start_time), 'dd/MM'),
        duration: differenceInMinutes(new Date(m.end_time), new Date(m.start_time))
      }));

    // Group by date and average
    const grouped: Record<string, { date: string; duration: number; count: number }> = {};
    completedMeetings.forEach(m => {
      if (!grouped[m.date]) {
        grouped[m.date] = { date: m.date, duration: 0, count: 0 };
      }
      grouped[m.date].duration += m.duration;
      grouped[m.date].count++;
    });

    return Object.values(grouped).map(g => ({
      date: g.date,
      avgDuration: Math.round(g.duration / g.count)
    }));
  }, [meetings]);

  // Outcome distribution for pie chart
  const outcomeData = useMemo(() => {
    const outcomes = [
      { name: 'Successful', value: stats.successful, color: '#22c55e' },
      { name: 'Follow-up Needed', value: stats.followUp, color: '#eab308' },
      { name: 'No-show', value: stats.noShow, color: '#ef4444' },
      { name: 'Cancelled', value: stats.cancelled, color: '#6b7280' },
    ].filter(o => o.value > 0);

    return outcomes;
  }, [stats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with time range selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Meeting Analytics
        </h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">Last 2 weeks</SelectItem>
            <SelectItem value="4">Last 4 weeks</SelectItem>
            <SelectItem value="8">Last 8 weeks</SelectItem>
            <SelectItem value="12">Last 12 weeks</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Meetings</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Duration</p>
                <p className="text-2xl font-bold">{stats.avgDuration} min</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">{stats.successRate}%</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">No-show Rate</p>
                <p className="text-2xl font-bold text-red-600">{stats.noShowRate}%</p>
              </div>
              <UserX className="h-8 w-8 text-red-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meetings per Week Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Meetings per Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="week" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="completed" name="Completed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cancelled" name="Cancelled" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Outcome Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" />
              Meeting Outcomes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {outcomeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={outcomeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {outcomeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No outcome data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Duration Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Average Meeting Duration Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          {durationTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={durationTrendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" unit=" min" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${value} minutes`, 'Avg Duration']}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgDuration" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
              No duration data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{stats.completed}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-500">{stats.scheduled}</p>
              <p className="text-sm text-muted-foreground">Upcoming</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-500">{stats.successful}</p>
              <p className="text-sm text-muted-foreground">Successful</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-500">{stats.followUp}</p>
              <p className="text-sm text-muted-foreground">Need Follow-up</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-500">{stats.noShow}</p>
              <p className="text-sm text-muted-foreground">No-shows</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

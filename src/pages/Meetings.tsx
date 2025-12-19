import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, Video, Trash2, Edit, Calendar, ArrowUpDown, ArrowUp, ArrowDown, List, CalendarDays, CheckCircle2, AlertCircle, UserX, CalendarClock, BarChart3 } from "lucide-react";
import { MeetingsCalendarView } from "@/components/meetings/MeetingsCalendarView";
import { MeetingAnalyticsDashboard } from "@/components/meetings/MeetingAnalyticsDashboard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MeetingModal } from "@/components/MeetingModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
type SortColumn = 'subject' | 'date' | 'time' | 'lead_contact' | 'status' | null;
type SortDirection = 'asc' | 'desc';
interface Meeting {
  id: string;
  subject: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  join_url?: string | null;
  attendees?: unknown;
  lead_id?: string | null;
  contact_id?: string | null;
  created_by?: string | null;
  created_at?: string | null;
  status: string;
  outcome?: string | null;
  notes?: string | null;
  lead_name?: string | null;
  contact_name?: string | null;
}
const Meetings = () => {
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [filteredMeetings, setFilteredMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<string | null>(null);
  const [selectedMeetings, setSelectedMeetings] = useState<string[]>([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [viewMode, setViewMode] = useState<'table' | 'calendar' | 'analytics'>('table');
  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const {
        data,
        error
      } = await supabase.from('meetings').select(`
          *,
          leads:lead_id (lead_name),
          contacts:contact_id (contact_name)
        `).order('start_time', {
        ascending: true
      });
      if (error) throw error;
      const transformedData = (data || []).map(meeting => ({
        ...meeting,
        lead_name: meeting.leads?.lead_name,
        contact_name: meeting.contacts?.contact_name
      }));
      setMeetings(transformedData);
      setSelectedMeetings([]);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch meetings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchMeetings();
  }, []);
  const getMeetingStatus = (meeting: Meeting): string => {
    if (meeting.status === 'cancelled') return 'cancelled';
    const now = new Date();
    const meetingStart = new Date(meeting.start_time);
    return meetingStart < now ? 'completed' : 'scheduled';
  };
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };
  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />;
  };
  const sortedAndFilteredMeetings = useMemo(() => {
    let filtered = meetings.filter(meeting => {
      const matchesSearch = meeting.subject?.toLowerCase().includes(searchTerm.toLowerCase()) || meeting.lead_name?.toLowerCase().includes(searchTerm.toLowerCase()) || meeting.contact_name?.toLowerCase().includes(searchTerm.toLowerCase());
      if (statusFilter === "all") return matchesSearch;
      const meetingStatus = getMeetingStatus(meeting);
      return matchesSearch && meetingStatus === statusFilter;
    });
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: string | number = '';
        let bValue: string | number = '';
        switch (sortColumn) {
          case 'subject':
            aValue = a.subject?.toLowerCase() || '';
            bValue = b.subject?.toLowerCase() || '';
            break;
          case 'date':
            aValue = new Date(a.start_time).setHours(0, 0, 0, 0);
            bValue = new Date(b.start_time).setHours(0, 0, 0, 0);
            break;
          case 'time':
            const aDate = new Date(a.start_time);
            const bDate = new Date(b.start_time);
            aValue = aDate.getHours() * 60 + aDate.getMinutes();
            bValue = bDate.getHours() * 60 + bDate.getMinutes();
            break;
          case 'lead_contact':
            aValue = (a.lead_name || a.contact_name || '').toLowerCase();
            bValue = (b.lead_name || b.contact_name || '').toLowerCase();
            break;
          case 'status':
            aValue = getMeetingStatus(a);
            bValue = getMeetingStatus(b);
            break;
        }
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [meetings, searchTerm, statusFilter, sortColumn, sortDirection]);
  useEffect(() => {
    setFilteredMeetings(sortedAndFilteredMeetings);
  }, [sortedAndFilteredMeetings]);
  const handleDelete = async (id: string) => {
    try {
      const {
        error
      } = await supabase.from('meetings').delete().eq('id', id);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Meeting deleted successfully"
      });
      fetchMeetings();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete meeting",
        variant: "destructive"
      });
    }
  };
  const handleBulkDelete = async () => {
    try {
      const {
        error
      } = await supabase.from('meetings').delete().in('id', selectedMeetings);
      if (error) throw error;
      toast({
        title: "Success",
        description: `${selectedMeetings.length} meeting(s) deleted successfully`
      });
      setSelectedMeetings([]);
      fetchMeetings();
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete meetings",
        variant: "destructive"
      });
    }
  };
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMeetings(filteredMeetings.map(m => m.id));
    } else {
      setSelectedMeetings([]);
    }
  };
  const handleSelectMeeting = (meetingId: string, checked: boolean) => {
    if (checked) {
      setSelectedMeetings(prev => [...prev, meetingId]);
    } else {
      setSelectedMeetings(prev => prev.filter(id => id !== meetingId));
    }
  };
  const isAllSelected = filteredMeetings.length > 0 && selectedMeetings.length === filteredMeetings.length;
  const isSomeSelected = selectedMeetings.length > 0 && selectedMeetings.length < filteredMeetings.length;
  const getStatusBadge = (status: string, startTime: string) => {
    const now = new Date();
    const meetingStart = new Date(startTime);
    if (status === 'cancelled') {
      return <Badge variant="destructive">Cancelled</Badge>;
    }
    if (meetingStart < now) {
      return <Badge variant="secondary">Completed</Badge>;
    }
    return <Badge variant="default">Scheduled</Badge>;
  };
  const getOutcomeBadge = (outcome: string | null) => {
    if (!outcome) return <span className="text-muted-foreground">—</span>;
    const outcomeConfig: Record<string, {
      label: string;
      icon: React.ReactNode;
      className: string;
    }> = {
      successful: {
        label: "Successful",
        icon: <CheckCircle2 className="h-3 w-3" />,
        className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      },
      follow_up_needed: {
        label: "Follow-up",
        icon: <AlertCircle className="h-3 w-3" />,
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      },
      no_show: {
        label: "No-show",
        icon: <UserX className="h-3 w-3" />,
        className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      },
      rescheduled: {
        label: "Rescheduled",
        icon: <CalendarClock className="h-3 w-3" />,
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      }
    };
    const config = outcomeConfig[outcome];
    if (!config) return <span className="text-muted-foreground">—</span>;
    return <Badge variant="outline" className={`gap-1 ${config.className}`}>
        {config.icon}
        {config.label}
      </Badge>;
  };
  if (loading) {
    return <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading meetings...</p>
        </div>
      </div>;
  }
  return <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Fixed Header */}
      <div className="flex-shrink-0 bg-background">
        <div className="px-6 h-16 flex items-center border-b w-full">
          <div className="flex items-center justify-between w-full">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl text-foreground font-semibold">Meetings</h1>
            </div>
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex items-center gap-0.5 bg-muted rounded-md p-0.5">
                <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('table')} className="gap-1.5 h-8 px-2.5 text-xs">
                  <List className="h-3.5 w-3.5" />
                  List
                </Button>
                <Button variant={viewMode === 'calendar' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('calendar')} className="gap-1.5 h-8 px-2.5 text-xs">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Calendar
                </Button>
                <Button variant={viewMode === 'analytics' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('analytics')} className="gap-1.5 h-8 px-2.5 text-xs">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Analytics
                </Button>
              </div>
              
              <Button size="sm" onClick={() => {
              setEditingMeeting(null);
              setShowModal(true);
            }}>
                Add Meeting
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 overflow-auto p-6">
        {viewMode === 'analytics' ? <MeetingAnalyticsDashboard /> : viewMode === 'calendar' ? <MeetingsCalendarView meetings={filteredMeetings} onMeetingClick={meeting => {
        setEditingMeeting(meeting);
        setShowModal(true);
      }} onMeetingUpdated={fetchMeetings} /> : <div className="space-y-4">
            {/* Search and Bulk Actions */}
            <div className="flex items-center gap-4">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search meetings..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" inputSize="sm" />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Bulk Actions */}
              {selectedMeetings.length > 0 && <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-lg">
                  <span className="text-sm text-muted-foreground">
                    {selectedMeetings.length} selected
                  </span>
                  <Button variant="destructive" size="sm" onClick={() => setShowBulkDeleteDialog(true)} className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete Selected
                  </Button>
                </div>}
            </div>

            {/* Table */}
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox checked={isAllSelected} ref={el => {
                    if (el) {
                      (el as any).indeterminate = isSomeSelected;
                    }
                  }} onCheckedChange={handleSelectAll} aria-label="Select all" />
                    </TableHead>
                    <TableHead>
                      <button onClick={() => handleSort('subject')} className="group flex items-center hover:text-foreground transition-colors">
                        Subject {getSortIcon('subject')}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button onClick={() => handleSort('date')} className="group flex items-center hover:text-foreground transition-colors">
                        Date {getSortIcon('date')}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button onClick={() => handleSort('time')} className="group flex items-center hover:text-foreground transition-colors">
                        Time {getSortIcon('time')}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button onClick={() => handleSort('lead_contact')} className="group flex items-center hover:text-foreground transition-colors">
                        Lead/Contact {getSortIcon('lead_contact')}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button onClick={() => handleSort('status')} className="group flex items-center hover:text-foreground transition-colors">
                        Status {getSortIcon('status')}
                      </button>
                    </TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead>Join URL</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMeetings.length === 0 ? <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        No meetings found
                      </TableCell>
                    </TableRow> : filteredMeetings.map(meeting => <TableRow key={meeting.id} className={selectedMeetings.includes(meeting.id) ? "bg-muted/50" : ""}>
                        <TableCell>
                          <Checkbox checked={selectedMeetings.includes(meeting.id)} onCheckedChange={checked => handleSelectMeeting(meeting.id, !!checked)} aria-label={`Select ${meeting.subject}`} />
                        </TableCell>
                        <TableCell className="font-medium">{meeting.subject}</TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(meeting.start_time), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(meeting.start_time), 'HH:mm')} - {format(new Date(meeting.end_time), 'HH:mm')}
                        </TableCell>
                        <TableCell>
                          {meeting.lead_name && <div>Lead: {meeting.lead_name}</div>}
                          {meeting.contact_name && <div>Contact: {meeting.contact_name}</div>}
                          {!meeting.lead_name && !meeting.contact_name && <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>{getStatusBadge(meeting.status, meeting.start_time)}</TableCell>
                        <TableCell>{getOutcomeBadge(meeting.outcome || null)}</TableCell>
                        <TableCell>
                          {meeting.join_url ? <a href={meeting.join_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                              <Video className="h-4 w-4" />
                              Join
                            </a> : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => {
                      setEditingMeeting(meeting);
                      setShowModal(true);
                    }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => {
                      setMeetingToDelete(meeting.id);
                      setShowDeleteDialog(true);
                    }}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>)}
                </TableBody>
              </Table>
            </Card>
          </div>}
      </div>

      {/* Modals */}
      <MeetingModal open={showModal} onOpenChange={setShowModal} meeting={editingMeeting} onSuccess={() => {
      fetchMeetings();
      setEditingMeeting(null);
    }} />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Meeting</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this meeting? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
            if (meetingToDelete) {
              handleDelete(meetingToDelete);
              setMeetingToDelete(null);
            }
          }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedMeetings.length} Meeting(s)</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedMeetings.length} selected meeting(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
            handleBulkDelete();
            setShowBulkDeleteDialog(false);
          }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete {selectedMeetings.length} Meeting(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};
export default Meetings;
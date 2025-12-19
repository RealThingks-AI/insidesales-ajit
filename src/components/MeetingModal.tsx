import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Video, Loader2, CalendarIcon, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MeetingOutcomeSelect } from "@/components/meetings/MeetingOutcomeSelect";
import { MeetingNotesSection } from "@/components/meetings/MeetingNotesSection";
import { MeetingFollowUpsSection } from "@/components/meetings/MeetingFollowUpsSection";
import { MeetingReminderSettings } from "@/components/meetings/MeetingReminderSettings";
import { MeetingConflictWarning } from "@/components/meetings/MeetingConflictWarning";
// Comprehensive timezones (40 options, ordered by GMT offset)
const TIMEZONES = [
  { value: "Pacific/Midway", label: "(GMT-11:00) Midway Island, Samoa" },
  { value: "Pacific/Honolulu", label: "(GMT-10:00) Hawaii" },
  { value: "America/Anchorage", label: "(GMT-09:00) Alaska" },
  { value: "America/Los_Angeles", label: "(GMT-08:00) Los Angeles, San Francisco, Seattle" },
  { value: "America/Tijuana", label: "(GMT-08:00) Tijuana, Baja California" },
  { value: "America/Denver", label: "(GMT-07:00) Denver, Phoenix, Salt Lake City" },
  { value: "America/Phoenix", label: "(GMT-07:00) Arizona" },
  { value: "America/Chicago", label: "(GMT-06:00) Chicago, Dallas, Houston" },
  { value: "America/Mexico_City", label: "(GMT-06:00) Mexico City, Guadalajara" },
  { value: "America/New_York", label: "(GMT-05:00) New York, Washington, Boston" },
  { value: "America/Bogota", label: "(GMT-05:00) Bogota, Lima, Quito" },
  { value: "America/Caracas", label: "(GMT-04:00) Caracas, La Paz" },
  { value: "America/Santiago", label: "(GMT-04:00) Santiago" },
  { value: "America/Halifax", label: "(GMT-04:00) Atlantic Time (Canada)" },
  { value: "America/Sao_Paulo", label: "(GMT-03:00) Brasilia, Sao Paulo" },
  { value: "America/Buenos_Aires", label: "(GMT-03:00) Buenos Aires, Georgetown" },
  { value: "Atlantic/South_Georgia", label: "(GMT-02:00) Mid-Atlantic" },
  { value: "Atlantic/Azores", label: "(GMT-01:00) Azores" },
  { value: "Atlantic/Cape_Verde", label: "(GMT-01:00) Cape Verde Islands" },
  { value: "UTC", label: "(GMT+00:00) Coordinated Universal Time" },
  { value: "Europe/London", label: "(GMT+00:00) London, Edinburgh, Dublin" },
  { value: "Africa/Casablanca", label: "(GMT+00:00) Casablanca, Monrovia" },
  { value: "Europe/Berlin", label: "(GMT+01:00) Berlin, Vienna, Rome, Stockholm" },
  { value: "Europe/Paris", label: "(GMT+01:00) Paris, Brussels, Madrid, Amsterdam" },
  { value: "Africa/Lagos", label: "(GMT+01:00) West Central Africa" },
  { value: "Europe/Athens", label: "(GMT+02:00) Athens, Bucharest, Istanbul" },
  { value: "Africa/Cairo", label: "(GMT+02:00) Cairo" },
  { value: "Africa/Johannesburg", label: "(GMT+02:00) Johannesburg, Pretoria" },
  { value: "Europe/Moscow", label: "(GMT+03:00) Moscow, St. Petersburg" },
  { value: "Asia/Kuwait", label: "(GMT+03:00) Kuwait, Riyadh, Baghdad" },
  { value: "Africa/Nairobi", label: "(GMT+03:00) Nairobi" },
  { value: "Asia/Tehran", label: "(GMT+03:30) Tehran" },
  { value: "Asia/Dubai", label: "(GMT+04:00) Dubai, Abu Dhabi, Muscat" },
  { value: "Asia/Kabul", label: "(GMT+04:30) Kabul" },
  { value: "Asia/Karachi", label: "(GMT+05:00) Islamabad, Karachi, Tashkent" },
  { value: "Asia/Kolkata", label: "(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi" },
  { value: "Asia/Kathmandu", label: "(GMT+05:45) Kathmandu" },
  { value: "Asia/Dhaka", label: "(GMT+06:00) Dhaka, Almaty" },
  { value: "Asia/Yangon", label: "(GMT+06:30) Yangon (Rangoon)" },
  { value: "Asia/Bangkok", label: "(GMT+07:00) Bangkok, Hanoi, Jakarta" },
  { value: "Asia/Singapore", label: "(GMT+08:00) Singapore, Kuala Lumpur, Perth" },
  { value: "Asia/Hong_Kong", label: "(GMT+08:00) Hong Kong, Beijing, Taipei" },
  { value: "Asia/Tokyo", label: "(GMT+09:00) Tokyo, Seoul, Osaka" },
  { value: "Australia/Darwin", label: "(GMT+09:30) Darwin, Adelaide" },
  { value: "Australia/Sydney", label: "(GMT+10:00) Sydney, Melbourne, Brisbane" },
  { value: "Pacific/Guam", label: "(GMT+10:00) Guam, Port Moresby" },
  { value: "Pacific/Noumea", label: "(GMT+11:00) Magadan, Solomon Islands" },
  { value: "Pacific/Auckland", label: "(GMT+12:00) Auckland, Wellington" },
  { value: "Pacific/Fiji", label: "(GMT+12:00) Fiji, Marshall Islands" },
  { value: "Pacific/Tongatapu", label: "(GMT+13:00) Nuku'alofa, Tongatapu" },
];

// Duration options
const DURATION_OPTIONS = [
  { value: "30", label: "30 Minutes" },
  { value: "60", label: "1 Hour" },
];

// Generate 15-minute time slots
const generateTimeSlots = () => {
  const slots: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const h = hour.toString().padStart(2, "0");
      const m = minute.toString().padStart(2, "0");
      slots.push(`${h}:${m}`);
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

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
  status: string;
  outcome?: string | null;
  notes?: string | null;
}

interface Lead {
  id: string;
  lead_name: string;
  email?: string;
}

interface Contact {
  id: string;
  contact_name: string;
  email?: string;
}

interface MeetingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting?: Meeting | null;
  onSuccess: () => void;
}

export const MeetingModal = ({ open, onOpenChange, meeting, onSuccess }: MeetingModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [creatingTeamsMeeting, setCreatingTeamsMeeting] = useState(false);
  const [cancellingMeeting, setCancellingMeeting] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  
  // Separate state for date/time selection
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState("60"); // Duration in minutes
  
  // Store the UTC reference time for timezone conversions
  const [utcReferenceTime, setUtcReferenceTime] = useState<Date | null>(null);
  
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    join_url: "",
    lead_id: "",
    contact_id: "",
    status: "scheduled",
    outcome: "",
    notes: ""
  });

  // Handle timezone change - convert the displayed time to the new timezone
  const handleTimezoneChange = (newTimezone: string) => {
    if (startDate && startTime) {
      // Create a datetime from current date and time in the old timezone
      const [h, m] = startTime.split(":").map(Number);
      const dateInOldTz = new Date(startDate);
      dateInOldTz.setHours(h, m, 0, 0);
      
      // Convert from old timezone to UTC, then to new timezone
      const utcTime = fromZonedTime(dateInOldTz, timezone);
      const timeInNewTz = toZonedTime(utcTime, newTimezone);
      
      // Update the displayed date and time
      setStartDate(timeInNewTz);
      setStartTime(format(timeInNewTz, "HH:mm"));
    }
    setTimezone(newTimezone);
  };

  // Get current date/time for validation in selected timezone
  const now = new Date();
  const nowInTimezone = toZonedTime(now, timezone);
  const todayInTimezone = new Date(nowInTimezone.getFullYear(), nowInTimezone.getMonth(), nowInTimezone.getDate());

  // Filter time slots to exclude past times for today in the selected timezone
  const getAvailableTimeSlots = (selectedDate: Date | undefined) => {
    if (!selectedDate) return TIME_SLOTS;
    
    const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const isToday = selectedDateOnly.getTime() === todayInTimezone.getTime();
    
    if (!isToday) return TIME_SLOTS;
    
    // For today, filter out past times based on the selected timezone
    const currentHour = nowInTimezone.getHours();
    const currentMinute = nowInTimezone.getMinutes();
    
    return TIME_SLOTS.filter(slot => {
      const [h, m] = slot.split(":").map(Number);
      if (h > currentHour) return true;
      if (h === currentHour && m > currentMinute) return true;
      return false;
    });
  };

  const availableStartTimeSlots = useMemo(() => getAvailableTimeSlots(startDate), [startDate, timezone, nowInTimezone]);

  // Calculate end time based on start time and duration
  const calculateEndDateTime = (start: Date, time: string, durationMinutes: number) => {
    const [h, m] = time.split(":").map(Number);
    const endDateTime = new Date(start);
    endDateTime.setHours(h, m, 0, 0);
    endDateTime.setMinutes(endDateTime.getMinutes() + durationMinutes);
    return endDateTime;
  };

  // Compute proposed meeting times for conflict detection
  const proposedStartTime = useMemo(() => {
    if (!startDate) return "";
    const [h, m] = startTime.split(":").map(Number);
    const dt = new Date(startDate);
    dt.setHours(h, m, 0, 0);
    const utcTime = fromZonedTime(dt, timezone);
    return utcTime.toISOString();
  }, [startDate, startTime, timezone]);

  const proposedEndTime = useMemo(() => {
    if (!startDate) return "";
    const endDateTime = calculateEndDateTime(startDate, startTime, parseInt(duration));
    const utcTime = fromZonedTime(endDateTime, timezone);
    return utcTime.toISOString();
  }, [startDate, startTime, duration, timezone]);

  useEffect(() => {
    if (open) {
      fetchLeadsAndContacts();
      if (meeting) {
        const start = new Date(meeting.start_time);
        const end = new Date(meeting.end_time);
        
        // Calculate duration from existing meeting
        const durationMs = end.getTime() - start.getTime();
        const durationMinutes = Math.round(durationMs / (1000 * 60));
        
        setStartDate(start);
        setStartTime(format(start, "HH:mm"));
        setDuration(durationMinutes <= 30 ? "30" : "60");
        
        setFormData({
          subject: meeting.subject || "",
          description: meeting.description || "",
          join_url: meeting.join_url || "",
          lead_id: meeting.lead_id || "",
          contact_id: meeting.contact_id || "",
          status: meeting.status || "scheduled",
          outcome: meeting.outcome || "",
          notes: meeting.notes || ""
        });
      } else {
        // Set default start time to next hour rounded to 15 min
        const defaultStart = new Date();
        defaultStart.setMinutes(Math.ceil(defaultStart.getMinutes() / 15) * 15 + 15, 0, 0);
        if (defaultStart.getMinutes() === 0) {
          defaultStart.setHours(defaultStart.getHours());
        }
        
        setStartDate(defaultStart);
        setStartTime(format(defaultStart, "HH:mm"));
        setDuration("60");
        
        setFormData({
          subject: "",
          description: "",
          join_url: "",
          lead_id: "",
          contact_id: "",
          status: "scheduled",
          outcome: "",
          notes: ""
        });
      }
    }
  }, [open, meeting]);

  const fetchLeadsAndContacts = async () => {
    try {
      const [leadsRes, contactsRes] = await Promise.all([
        supabase.from('leads').select('id, lead_name, email').order('lead_name'),
        supabase.from('contacts').select('id, contact_name, email').order('contact_name')
      ]);

      if (leadsRes.data) setLeads(leadsRes.data);
      if (contactsRes.data) setContacts(contactsRes.data);
    } catch (error) {
      console.error('Error fetching leads/contacts:', error);
    }
  };

  // Build ISO datetime in the selected timezone context
  const buildISODateTime = (date: Date | undefined, time: string): string => {
    if (!date) return "";
    const [h, m] = time.split(":").map(Number);
    const dt = new Date(date);
    dt.setHours(h, m, 0, 0);
    // Convert from selected timezone to UTC for storage
    const utcTime = fromZonedTime(dt, timezone);
    return utcTime.toISOString();
  };

  const buildEndISODateTime = (date: Date | undefined, time: string, durationMinutes: number): string => {
    if (!date) return "";
    const endDateTime = calculateEndDateTime(date, time, durationMinutes);
    // Convert from selected timezone to UTC for storage
    const utcTime = fromZonedTime(endDateTime, timezone);
    return utcTime.toISOString();
  };

  const createTeamsMeeting = async () => {
    if (!formData.subject || !startDate) {
      toast({
        title: "Missing fields",
        description: "Please fill in subject and start time first",
        variant: "destructive",
      });
      return;
    }

    setCreatingTeamsMeeting(true);
    try {
      const attendees: { email: string; name: string }[] = [];
      
      if (formData.lead_id) {
        const lead = leads.find(l => l.id === formData.lead_id);
        if (lead?.email) {
          attendees.push({ email: lead.email, name: lead.lead_name });
        }
      }
      
      if (formData.contact_id) {
        const contact = contacts.find(c => c.id === formData.contact_id);
        if (contact?.email) {
          attendees.push({ email: contact.email, name: contact.contact_name });
        }
      }

      const { data, error } = await supabase.functions.invoke('create-teams-meeting', {
        body: {
          subject: formData.subject,
          attendees,
          startTime: buildISODateTime(startDate, startTime),
          endTime: buildEndISODateTime(startDate, startTime, parseInt(duration)),
          timezone,
          description: formData.description
        }
      });

      if (error) throw error;

      if (data?.meeting?.joinUrl) {
        setFormData(prev => ({ ...prev, join_url: data.meeting.joinUrl }));
        toast({
          title: "Teams Meeting Created",
          description: "Meeting link has been generated",
        });
        return data.meeting.joinUrl; // Return the join URL for immediate use
      }
      return null;
    } catch (error: any) {
      console.error('Error creating Teams meeting:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create Teams meeting",
        variant: "destructive",
      });
      return null;
    } finally {
      setCreatingTeamsMeeting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, joinUrlOverride?: string | null) => {
    e.preventDefault();
    
    if (!formData.subject || !startDate) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const meetingData = {
        subject: formData.subject,
        description: formData.description || null,
        start_time: buildISODateTime(startDate, startTime),
        end_time: buildEndISODateTime(startDate, startTime, parseInt(duration)),
        join_url: joinUrlOverride || formData.join_url || null,
        lead_id: formData.lead_id || null,
        contact_id: formData.contact_id || null,
        status: formData.status,
        outcome: formData.outcome || null,
        notes: formData.notes || null,
        created_by: user?.id
      };

      if (meeting) {
        const { error } = await supabase
          .from('meetings')
          .update(meetingData)
          .eq('id', meeting.id);
        if (error) throw error;
        toast({ title: "Success", description: "Meeting updated successfully" });
      } else {
        const { error } = await supabase
          .from('meetings')
          .insert([meetingData]);
        if (error) throw error;
        toast({ title: "Success", description: "Meeting created successfully" });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving meeting:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save meeting",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelMeeting = async () => {
    if (!meeting?.id || !meeting?.join_url) {
      toast({
        title: "Cannot cancel",
        description: "No Teams meeting link found for this meeting",
        variant: "destructive",
      });
      return;
    }

    setCancellingMeeting(true);
    try {
      // Call the edge function to cancel the Teams meeting
      const { data, error } = await supabase.functions.invoke('cancel-teams-meeting', {
        body: {
          meetingId: meeting.id,
          joinUrl: meeting.join_url
        }
      });

      if (error) throw error;

      // Update meeting status to cancelled in the database
      const { error: updateError } = await supabase
        .from('meetings')
        .update({ status: 'cancelled' })
        .eq('id', meeting.id);

      if (updateError) throw updateError;

      toast({
        title: "Meeting Cancelled",
        description: "The Teams meeting has been cancelled",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error cancelling meeting:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel meeting",
        variant: "destructive",
      });
    } finally {
      setCancellingMeeting(false);
    }
  };

  const formatDisplayTime = (time: string) => {
    const [h, m] = time.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{meeting ? "Edit Meeting" : "New Meeting"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="notes">Notes & Follow-ups</TabsTrigger>
              <TabsTrigger value="reminders">Reminders</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Meeting subject"
                  required
                />
              </div>

              {/* Timezone Selection */}
              <div className="space-y-2">
                <Label>Time Zone</Label>
                <Select value={timezone} onValueChange={handleTimezoneChange}>
                  <SelectTrigger className="w-80">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date, Time & Duration */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "dd/MM/yyyy") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-50" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        disabled={(date) => date < todayInTimezone}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Start Time *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        {formatDisplayTime(startTime)}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-0 z-50 max-h-60 overflow-y-auto" align="start">
                      <div className="p-2 space-y-1">
                        {availableStartTimeSlots.length > 0 ? (
                          availableStartTimeSlots.map((slot) => (
                            <Button
                              key={slot}
                              variant={startTime === slot ? "default" : "ghost"}
                              className="w-full justify-start text-sm"
                              onClick={() => setStartTime(slot)}
                            >
                              {formatDisplayTime(slot)}
                            </Button>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground p-2">No available times today</p>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Duration *</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATION_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Conflict Warning */}
              {proposedStartTime && proposedEndTime && (
                <MeetingConflictWarning
                  startTime={proposedStartTime}
                  endTime={proposedEndTime}
                  excludeMeetingId={meeting?.id}
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lead_id">Link to Lead</Label>
                  <Select
                    value={formData.lead_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, lead_id: value === "none" ? "" : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a lead (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {leads.map((lead) => (
                        <SelectItem key={lead.id} value={lead.id}>
                          <div className="flex flex-col">
                            <span>{lead.lead_name}</span>
                            {lead.email && <span className="text-xs text-muted-foreground">{lead.email}</span>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_id">Link to Contact</Label>
                  <Select
                    value={formData.contact_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, contact_id: value === "none" ? "" : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a contact (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {contacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          <div className="flex flex-col">
                            <span>{contact.contact_name}</span>
                            {contact.email && <span className="text-xs text-muted-foreground">{contact.email}</span>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Meeting description"
                  rows={3}
                />
              </div>

              {/* Outcome - only show for existing meetings */}
              {meeting && (
                <MeetingOutcomeSelect
                  value={formData.outcome}
                  onChange={(value) => setFormData(prev => ({ ...prev, outcome: value }))}
                />
              )}
            </TabsContent>

            <TabsContent value="notes" className="space-y-4 mt-4">
              <MeetingNotesSection
                value={formData.notes}
                onChange={(value) => setFormData(prev => ({ ...prev, notes: value }))}
              />
              
              <MeetingFollowUpsSection meetingId={meeting?.id} />
            </TabsContent>

            <TabsContent value="reminders" className="space-y-4 mt-4">
              <MeetingReminderSettings meetingId={meeting?.id} />
              <p className="text-sm text-muted-foreground">
                Reminders will be sent as in-app notifications before the meeting starts.
              </p>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between gap-2 pt-4 border-t">
            <div>
              {meeting && meeting.join_url && (
                <Button 
                  type="button" 
                  variant="destructive"
                  disabled={cancellingMeeting || loading}
                  onClick={handleCancelMeeting}
                  className="gap-2"
                >
                  {cancellingMeeting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  {cancellingMeeting ? "Cancelling..." : "Cancel Meeting"}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button 
                type="button" 
                disabled={loading || creatingTeamsMeeting || cancellingMeeting}
                onClick={async (e) => {
                  e.preventDefault();
                  
                  if (!formData.subject || !startDate) {
                    toast({
                      title: "Missing fields",
                      description: "Please fill in subject and start date",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  // First create Teams meeting and get the join URL
                  let joinUrl = formData.join_url;
                  if (!joinUrl) {
                    joinUrl = await createTeamsMeeting();
                  }
                  
                  // Now submit the form with the join URL
                  const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
                  await handleSubmit(fakeEvent, joinUrl);
                }}
                className="gap-2"
              >
                {(loading || creatingTeamsMeeting) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Video className="h-4 w-4" />
                )}
                {loading ? "Saving..." : creatingTeamsMeeting ? "Creating Teams Meeting..." : meeting ? "Update" : "Create Meeting"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
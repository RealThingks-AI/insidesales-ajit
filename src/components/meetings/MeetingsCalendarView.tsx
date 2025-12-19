import { useState, useMemo } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay, addDays, subDays, startOfMonth, endOfMonth, addMonths, subMonths, isSameMonth, setHours, setMinutes, differenceInMinutes } from "date-fns";
import { ChevronLeft, ChevronRight, Video, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  lead_name?: string | null;
  contact_name?: string | null;
}

interface MeetingsCalendarViewProps {
  meetings: Meeting[];
  onMeetingClick: (meeting: Meeting) => void;
  onMeetingUpdated?: () => void;
}

interface PendingReschedule {
  meeting: Meeting;
  newStart: Date;
  newEnd: Date;
}

const WORK_START_HOUR = 8;
const WORK_END_HOUR = 20;

export const MeetingsCalendarView = ({ meetings, onMeetingClick, onMeetingUpdated }: MeetingsCalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'day' | 'month'>('week');
  const [draggedMeeting, setDraggedMeeting] = useState<Meeting | null>(null);
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null);
  const [dragOverHour, setDragOverHour] = useState<number | null>(null);
  const [pendingReschedule, setPendingReschedule] = useState<PendingReschedule | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const { toast } = useToast();

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = useMemo(() => {
    const start = startOfWeek(monthStart, { weekStartsOn: 1 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [monthStart, monthEnd]);

  const displayDays = viewMode === 'week' ? daysInWeek : viewMode === 'day' ? [currentDate] : monthDays;

  const goToPrevious = () => {
    if (viewMode === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else if (viewMode === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subDays(currentDate, 1));
    }
  };

  const goToNext = () => {
    if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getMeetingsForDay = (day: Date) => {
    return meetings.filter(meeting => {
      const meetingDate = new Date(meeting.start_time);
      return isSameDay(meetingDate, day);
    });
  };

  const getMeetingPosition = (meeting: Meeting) => {
    const startTime = new Date(meeting.start_time);
    const endTime = new Date(meeting.end_time);
    
    const startHour = startTime.getHours();
    const startMinute = startTime.getMinutes();
    const endHour = endTime.getHours();
    const endMinute = endTime.getMinutes();
    
    const top = (startHour - WORK_START_HOUR) * 60 + startMinute;
    const height = ((endHour - startHour) * 60) + (endMinute - startMinute);
    
    return { top, height: Math.max(height, 30) };
  };

  const getMeetingColor = (meeting: Meeting) => {
    if (meeting.status === 'cancelled') return 'bg-destructive/20 border-destructive/40 text-destructive-foreground';
    const now = new Date();
    const meetingStart = new Date(meeting.start_time);
    if (meetingStart < now) return 'bg-muted border-muted-foreground/20 text-muted-foreground';
    return 'bg-primary/20 border-primary/40 text-primary-foreground';
  };

  const workHours = Array.from({ length: WORK_END_HOUR - WORK_START_HOUR }, (_, i) => i + WORK_START_HOUR);

  const handleDragStart = (e: React.DragEvent, meeting: Meeting) => {
    setDraggedMeeting(meeting);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', meeting.id);
  };

  const handleDragEnd = () => {
    setDraggedMeeting(null);
    setDragOverDate(null);
    setDragOverHour(null);
  };

  const handleDragOver = (e: React.DragEvent, day: Date, hour?: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDate(day);
    if (hour !== undefined) {
      setDragOverHour(hour);
    }
  };

  const handleDragLeave = () => {
    setDragOverDate(null);
    setDragOverHour(null);
  };

  const handleDrop = async (e: React.DragEvent, targetDay: Date, targetHour?: number) => {
    e.preventDefault();
    
    if (!draggedMeeting) return;

    // Prevent rescheduling cancelled or completed meetings
    if (draggedMeeting.status === 'cancelled' || draggedMeeting.status === 'completed') {
      toast({
        title: "Cannot reschedule",
        description: `This meeting is ${draggedMeeting.status} and cannot be rescheduled.`,
        variant: "destructive",
      });
      handleDragEnd();
      return;
    }

    const originalStart = new Date(draggedMeeting.start_time);
    const originalEnd = new Date(draggedMeeting.end_time);
    const duration = differenceInMinutes(originalEnd, originalStart);

    let newStart: Date;
    if (viewMode === 'month') {
      // In month view, keep the same time but change the date
      newStart = new Date(targetDay);
      newStart.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0);
    } else {
      // In day/week view, use the target hour
      newStart = new Date(targetDay);
      newStart.setHours(targetHour ?? originalStart.getHours(), 0, 0, 0);
    }

    const newEnd = new Date(newStart.getTime() + duration * 60 * 1000);

    // Prevent rescheduling to past date/time
    const now = new Date();
    if (newStart < now) {
      toast({
        title: "Cannot reschedule",
        description: "You cannot reschedule a meeting to a past date or time.",
        variant: "destructive",
      });
      handleDragEnd();
      return;
    }

    // Show confirmation dialog instead of directly updating
    setPendingReschedule({
      meeting: draggedMeeting,
      newStart,
      newEnd,
    });

    handleDragEnd();
  };

  const confirmReschedule = async () => {
    if (!pendingReschedule) return;

    setIsRescheduling(true);
    try {
      const { error } = await supabase
        .from('meetings')
        .update({
          start_time: pendingReschedule.newStart.toISOString(),
          end_time: pendingReschedule.newEnd.toISOString(),
        })
        .eq('id', pendingReschedule.meeting.id);

      if (error) throw error;

      toast({
        title: "Meeting rescheduled",
        description: `${pendingReschedule.meeting.subject} moved to ${format(pendingReschedule.newStart, 'dd/MM/yyyy HH:mm')}`,
      });

      onMeetingUpdated?.();
    } catch (error) {
      console.error('Error rescheduling meeting:', error);
      toast({
        title: "Error",
        description: "Failed to reschedule meeting",
        variant: "destructive",
      });
    } finally {
      setIsRescheduling(false);
      setPendingReschedule(null);
    }
  };

  const cancelReschedule = () => {
    setPendingReschedule(null);
  };

  const getHeaderTitle = () => {
    if (viewMode === 'month') {
      return format(currentDate, 'MMMM yyyy');
    } else if (viewMode === 'week') {
      return `${format(weekStart, 'd/MM')} - ${format(weekEnd, 'd/MM/yyyy')}`;
    }
    return format(currentDate, 'EEEE, dd/MM/yyyy');
  };

  return (
    <>
      <div className="flex flex-col h-full bg-card rounded-lg border">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={goToPrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={goToNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <h2 className="text-lg font-semibold ml-2">
              {getHeaderTitle()}
            </h2>
          </div>
          
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === 'day' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('day')}
            >
              Day
            </Button>
            <Button
              variant={viewMode === 'week' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('week')}
            >
              Week
            </Button>
            <Button
              variant={viewMode === 'month' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('month')}
            >
              Month
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto">
          {viewMode === 'month' ? (
            <MonthView
              days={monthDays}
              currentDate={currentDate}
              getMeetingsForDay={getMeetingsForDay}
              getMeetingColor={getMeetingColor}
              onMeetingClick={onMeetingClick}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              dragOverDate={dragOverDate}
              draggedMeeting={draggedMeeting}
            />
          ) : (
            <DayWeekView
              displayDays={displayDays}
              workHours={workHours}
              getMeetingsForDay={getMeetingsForDay}
              getMeetingPosition={getMeetingPosition}
              getMeetingColor={getMeetingColor}
              onMeetingClick={onMeetingClick}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              dragOverDate={dragOverDate}
              dragOverHour={dragOverHour}
              draggedMeeting={draggedMeeting}
            />
          )}
        </div>
      </div>

      {/* Reschedule Confirmation Dialog */}
      <AlertDialog open={!!pendingReschedule} onOpenChange={(open) => !open && cancelReschedule()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reschedule Meeting</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingReschedule && (
                <>
                  Are you sure you want to reschedule <strong>"{pendingReschedule.meeting.subject}"</strong> to{' '}
                  <strong>{format(pendingReschedule.newStart, 'EEEE, MMMM d, yyyy')}</strong> at{' '}
                  <strong>{format(pendingReschedule.newStart, 'h:mm a')}</strong>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelReschedule} disabled={isRescheduling}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmReschedule} disabled={isRescheduling}>
              {isRescheduling ? "Rescheduling..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

interface MonthViewProps {
  days: Date[];
  currentDate: Date;
  getMeetingsForDay: (day: Date) => Meeting[];
  getMeetingColor: (meeting: Meeting) => string;
  onMeetingClick: (meeting: Meeting) => void;
  onDragStart: (e: React.DragEvent, meeting: Meeting) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, day: Date) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, day: Date) => void;
  dragOverDate: Date | null;
  draggedMeeting: Meeting | null;
}

const MonthView = ({
  days,
  currentDate,
  getMeetingsForDay,
  getMeetingColor,
  onMeetingClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  dragOverDate,
  draggedMeeting,
}: MonthViewProps) => {
  const weeks = useMemo(() => {
    const result: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7));
    }
    return result;
  }, [days]);

  return (
    <div className="h-full flex flex-col">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} className="text-center py-2 text-sm font-medium text-muted-foreground border-r last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 grid grid-rows-5">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 border-b last:border-b-0">
            {week.map(day => {
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());
              const dayMeetings = getMeetingsForDay(day);
              const isDragOver = dragOverDate && isSameDay(day, dragOverDate);

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "min-h-[100px] p-1 border-r last:border-r-0 transition-colors",
                    !isCurrentMonth && "bg-muted/30",
                    isToday && "bg-primary/5",
                    isDragOver && draggedMeeting && "bg-primary/20 ring-2 ring-primary ring-inset"
                  )}
                  onDragOver={(e) => onDragOver(e, day)}
                  onDragLeave={onDragLeave}
                  onDrop={(e) => onDrop(e, day)}
                >
                  <div className={cn(
                    "text-sm font-medium mb-1",
                    !isCurrentMonth && "text-muted-foreground",
                    isToday && "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center"
                  )}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5 overflow-y-auto max-h-[80px]">
                    {dayMeetings.slice(0, 3).map(meeting => (
                      <div
                        key={meeting.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, meeting)}
                        onDragEnd={onDragEnd}
                        onClick={(e) => {
                          e.stopPropagation();
                          onMeetingClick(meeting);
                        }}
                        className={cn(
                          "text-xs px-1.5 py-0.5 rounded truncate cursor-grab active:cursor-grabbing border transition-all hover:shadow-sm",
                          getMeetingColor(meeting),
                          draggedMeeting?.id === meeting.id && "opacity-50"
                        )}
                      >
                        <span className="font-medium">{format(new Date(meeting.start_time), 'HH:mm')}</span>
                        {' '}{meeting.subject}
                      </div>
                    ))}
                    {dayMeetings.length > 3 && (
                      <div className="text-xs text-muted-foreground pl-1">
                        +{dayMeetings.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

interface DayWeekViewProps {
  displayDays: Date[];
  workHours: number[];
  getMeetingsForDay: (day: Date) => Meeting[];
  getMeetingPosition: (meeting: Meeting) => { top: number; height: number };
  getMeetingColor: (meeting: Meeting) => string;
  onMeetingClick: (meeting: Meeting) => void;
  onDragStart: (e: React.DragEvent, meeting: Meeting) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, day: Date, hour?: number) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, day: Date, hour?: number) => void;
  dragOverDate: Date | null;
  dragOverHour: number | null;
  draggedMeeting: Meeting | null;
}

const DayWeekView = ({
  displayDays,
  workHours,
  getMeetingsForDay,
  getMeetingPosition,
  getMeetingColor,
  onMeetingClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  dragOverDate,
  dragOverHour,
  draggedMeeting,
}: DayWeekViewProps) => {
  return (
    <div className="min-h-full">
      {/* Day Headers */}
      <div className="flex border-b sticky top-0 bg-card z-10">
        <div className="w-16 flex-shrink-0 border-r" />
        {displayDays.map((day) => {
          const isToday = isSameDay(day, new Date());
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "flex-1 text-center py-3 border-r last:border-r-0",
                isToday && "bg-primary/5"
              )}
            >
              <div className="text-xs text-muted-foreground uppercase">
                {format(day, 'EEE')}
              </div>
              <div className={cn(
                "text-xl font-semibold mt-1",
                isToday && "bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center mx-auto"
              )}>
                {format(day, 'd')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time Grid */}
      <div className="flex">
        {/* Time Labels */}
        <div className="w-16 flex-shrink-0 border-r">
          {workHours.map((hour) => (
            <div
              key={hour}
              className="h-[60px] text-xs text-muted-foreground text-right pr-2 -mt-2"
            >
              {format(setHours(setMinutes(new Date(), 0), hour), 'h a')}
            </div>
          ))}
        </div>

        {/* Day Columns */}
        {displayDays.map((day) => {
          const dayMeetings = getMeetingsForDay(day);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "flex-1 border-r last:border-r-0 relative",
                isToday && "bg-primary/5"
              )}
            >
              {/* Hour grid lines */}
              {workHours.map((hour) => {
                const isDragOverCell = dragOverDate && isSameDay(day, dragOverDate) && dragOverHour === hour;
                return (
                  <div
                    key={hour}
                    className={cn(
                      "h-[60px] border-b border-dashed border-border/50 transition-colors",
                      isDragOverCell && draggedMeeting && "bg-primary/20"
                    )}
                    onDragOver={(e) => onDragOver(e, day, hour)}
                    onDragLeave={onDragLeave}
                    onDrop={(e) => onDrop(e, day, hour)}
                  />
                );
              })}

              {/* Meetings */}
              {dayMeetings.map((meeting) => {
                const { top, height } = getMeetingPosition(meeting);
                if (top < 0 || top > (WORK_END_HOUR - WORK_START_HOUR) * 60) return null;
                
                return (
                  <div
                    key={meeting.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, meeting)}
                    onDragEnd={onDragEnd}
                    onClick={() => onMeetingClick(meeting)}
                    className={cn(
                      "absolute left-1 right-1 rounded-md border px-2 py-1 cursor-grab active:cursor-grabbing transition-all hover:shadow-md overflow-hidden group",
                      getMeetingColor(meeting),
                      draggedMeeting?.id === meeting.id && "opacity-50"
                    )}
                    style={{
                      top: `${top}px`,
                      height: `${height}px`,
                      minHeight: '28px',
                    }}
                  >
                    <div className="flex items-start gap-1">
                      <GripVertical className="h-3 w-3 mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-50 transition-opacity" />
                      {meeting.join_url && (
                        <Video className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium truncate">
                          {meeting.subject}
                        </div>
                        {height > 40 && (
                          <div className="text-xs opacity-70 truncate">
                            {format(new Date(meeting.start_time), 'HH:mm')} - {format(new Date(meeting.end_time), 'HH:mm')}
                          </div>
                        )}
                        {height > 60 && (meeting.lead_name || meeting.contact_name) && (
                          <div className="text-xs opacity-70 truncate mt-1">
                            {meeting.lead_name || meeting.contact_name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Current time indicator */}
              {isToday && <CurrentTimeIndicator />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CurrentTimeIndicator = () => {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  
  if (hour < WORK_START_HOUR || hour >= WORK_END_HOUR) return null;
  
  const top = (hour - WORK_START_HOUR) * 60 + minute;
  
  return (
    <div
      className="absolute left-0 right-0 z-20 pointer-events-none"
      style={{ top: `${top}px` }}
    >
      <div className="flex items-center">
        <div className="w-2 h-2 rounded-full bg-destructive" />
        <div className="flex-1 h-0.5 bg-destructive" />
      </div>
    </div>
  );
};

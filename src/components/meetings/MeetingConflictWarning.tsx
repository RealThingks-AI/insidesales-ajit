import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Clock } from "lucide-react";
import { format } from "date-fns";

interface ConflictingMeeting {
  id: string;
  subject: string;
  start_time: string;
  end_time: string;
}

interface MeetingConflictWarningProps {
  startTime: string; // ISO string
  endTime: string; // ISO string
  excludeMeetingId?: string; // Exclude current meeting when editing
}

export const MeetingConflictWarning = ({ 
  startTime, 
  endTime, 
  excludeMeetingId 
}: MeetingConflictWarningProps) => {
  const [conflicts, setConflicts] = useState<ConflictingMeeting[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (startTime && endTime) {
      checkConflicts();
    }
  }, [startTime, endTime, excludeMeetingId]);

  const checkConflicts = async () => {
    if (!startTime || !endTime) return;
    
    setLoading(true);
    try {
      // Find meetings that overlap with the proposed time range
      // A meeting overlaps if: existingStart < proposedEnd AND existingEnd > proposedStart
      let query = supabase
        .from('meetings')
        .select('id, subject, start_time, end_time')
        .neq('status', 'cancelled')
        .lt('start_time', endTime)
        .gt('end_time', startTime);

      // Exclude current meeting when editing
      if (excludeMeetingId) {
        query = query.neq('id', excludeMeetingId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setConflicts(data || []);
    } catch (error) {
      console.error('Error checking conflicts:', error);
      setConflicts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading || conflicts.length === 0) {
    return null;
  }

  return (
    <Alert variant="destructive" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertTitle className="text-yellow-800 dark:text-yellow-200">
        Schedule Conflict Detected
      </AlertTitle>
      <AlertDescription className="text-yellow-700 dark:text-yellow-300">
        <p className="mb-2">
          This meeting overlaps with {conflicts.length} existing meeting{conflicts.length > 1 ? 's' : ''}:
        </p>
        <ul className="space-y-1 text-sm">
          {conflicts.slice(0, 3).map((conflict) => (
            <li key={conflict.id} className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span className="font-medium">{conflict.subject}</span>
              <span className="text-xs opacity-80">
                ({format(new Date(conflict.start_time), 'dd/MM, HH:mm')} - {format(new Date(conflict.end_time), 'HH:mm')})
              </span>
            </li>
          ))}
          {conflicts.length > 3 && (
            <li className="text-xs opacity-70">
              ...and {conflicts.length - 3} more
            </li>
          )}
        </ul>
      </AlertDescription>
    </Alert>
  );
};

// Hook for checking conflicts programmatically
export const useConflictCheck = () => {
  const checkForConflicts = async (
    startTime: string,
    endTime: string,
    excludeMeetingId?: string
  ): Promise<ConflictingMeeting[]> => {
    try {
      let query = supabase
        .from('meetings')
        .select('id, subject, start_time, end_time')
        .neq('status', 'cancelled')
        .lt('start_time', endTime)
        .gt('end_time', startTime);

      if (excludeMeetingId) {
        query = query.neq('id', excludeMeetingId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error checking conflicts:', error);
      return [];
    }
  };

  return { checkForConflicts };
};

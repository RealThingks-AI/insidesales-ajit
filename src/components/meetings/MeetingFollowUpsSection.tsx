import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ListTodo, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface FollowUp {
  id: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  status: string;
  assigned_to?: string | null;
  created_by?: string | null;
}

interface MeetingFollowUpsSectionProps {
  meetingId?: string;
  disabled?: boolean;
}

export const MeetingFollowUpsSection = ({ meetingId, disabled }: MeetingFollowUpsSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (meetingId) {
      fetchFollowUps();
    }
  }, [meetingId]);

  const fetchFollowUps = async () => {
    if (!meetingId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('meeting_follow_ups')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setFollowUps(data || []);
    } catch (error) {
      console.error('Error fetching follow-ups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFollowUp = async () => {
    if (!meetingId || !newTitle.trim()) return;

    setAdding(true);
    try {
      const { error } = await supabase
        .from('meeting_follow_ups')
        .insert({
          meeting_id: meetingId,
          title: newTitle.trim(),
          due_date: newDueDate || null,
          created_by: user?.id,
          status: 'pending'
        });

      if (error) throw error;

      toast({ title: "Follow-up added" });
      setNewTitle("");
      setNewDueDate("");
      fetchFollowUps();
    } catch (error: any) {
      console.error('Error adding follow-up:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add follow-up",
        variant: "destructive"
      });
    } finally {
      setAdding(false);
    }
  };

  const handleToggleStatus = async (followUp: FollowUp) => {
    const newStatus = followUp.status === 'completed' ? 'pending' : 'completed';
    
    try {
      const { error } = await supabase
        .from('meeting_follow_ups')
        .update({ status: newStatus })
        .eq('id', followUp.id);

      if (error) throw error;
      fetchFollowUps();
    } catch (error) {
      console.error('Error updating follow-up:', error);
    }
  };

  const handleDeleteFollowUp = async (id: string) => {
    try {
      const { error } = await supabase
        .from('meeting_follow_ups')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchFollowUps();
    } catch (error) {
      console.error('Error deleting follow-up:', error);
    }
  };

  if (!meetingId) {
    return (
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-muted-foreground">
          <ListTodo className="h-4 w-4" />
          Follow-up Tasks
        </Label>
        <p className="text-sm text-muted-foreground italic">
          Save the meeting first to add follow-up tasks
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <ListTodo className="h-4 w-4" />
        Follow-up Tasks
      </Label>

      {/* Add new follow-up */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            placeholder="Add a follow-up task..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            disabled={disabled || adding}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddFollowUp();
              }
            }}
          />
        </div>
        <Input
          type="date"
          value={newDueDate}
          onChange={(e) => setNewDueDate(e.target.value)}
          disabled={disabled || adding}
          className="w-36"
        />
        <Button
          type="button"
          size="sm"
          onClick={handleAddFollowUp}
          disabled={disabled || adding || !newTitle.trim()}
        >
          {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </Button>
      </div>

      {/* Follow-ups list */}
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : followUps.length === 0 ? (
        <p className="text-sm text-muted-foreground italic py-2">
          No follow-up tasks yet
        </p>
      ) : (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {followUps.map((followUp) => (
            <div
              key={followUp.id}
              className="flex items-center gap-3 p-2 rounded-md bg-muted/50 group"
            >
              <Checkbox
                checked={followUp.status === 'completed'}
                onCheckedChange={() => handleToggleStatus(followUp)}
                disabled={disabled}
              />
              <span className={`flex-1 text-sm ${followUp.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                {followUp.title}
              </span>
              {followUp.due_date && (
                <Badge variant="outline" className="text-xs">
                  {format(new Date(followUp.due_date), 'dd/MM')}
                </Badge>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteFollowUp(followUp.id)}
                disabled={disabled}
                className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

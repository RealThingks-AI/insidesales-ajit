import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCRUDAudit } from "@/hooks/useCRUDAudit";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const leadSchema = z.object({
  lead_name: z.string().min(1, "Lead name is required"),
  account_id: z.string().optional(),
  position: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone_no: z.string().optional(),
  linkedin: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  contact_source: z.string().optional(),
  lead_status: z.string().optional(),
  description: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface Lead {
  id: string;
  lead_name: string;
  account_id?: string;
  company_name?: string;
  position?: string;
  email?: string;
  phone_no?: string;
  linkedin?: string;
  website?: string;
  contact_source?: string;
  industry?: string;
  country?: string;
  description?: string;
  lead_status?: string;
}

interface Account {
  id: string;
  company_name: string;
}

interface LeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | null;
  onSuccess: () => void;
}

const leadSources = [
  "LinkedIn",
  "Website",
  "Referral", 
  "Social Media",
  "Email Campaign",
  "Other"
];

const leadStatuses = [
  "New",
  "Attempted",
  "Follow-up",
  "Qualified",
  "Disqualified"
];

export const LeadModal = ({ open, onOpenChange, lead, onSuccess }: LeadModalProps) => {
  const { toast } = useToast();
  const { logCreate, logUpdate } = useCRUDAudit();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountSearch, setAccountSearch] = useState("");

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      lead_name: "",
      account_id: "",
      position: "",
      email: "",
      phone_no: "",
      linkedin: "",
      contact_source: "",
      lead_status: "New",
      description: "",
    },
  });

  // Fetch accounts for dropdown
  useEffect(() => {
    const fetchAccounts = async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('id, company_name')
        .order('company_name', { ascending: true });
      
      if (!error && data) {
        setAccounts(data);
      }
    };
    
    if (open) {
      fetchAccounts();
    }
  }, [open]);

  useEffect(() => {
    if (lead) {
      form.reset({
        lead_name: lead.lead_name || "",
        account_id: lead.account_id || "",
        position: lead.position || "",
        email: lead.email || "",
        phone_no: lead.phone_no || "",
        linkedin: lead.linkedin || "",
        contact_source: lead.contact_source || "",
        lead_status: lead.lead_status || "New",
        description: lead.description || "",
      });
    } else {
      form.reset({
        lead_name: "",
        account_id: "",
        position: "",
        email: "",
        phone_no: "",
        linkedin: "",
        contact_source: "",
        lead_status: "New",
        description: "",
      });
    }
  }, [lead, form]);

  const onSubmit = async (data: LeadFormData) => {
    try {
      setLoading(true);
      const user = await supabase.auth.getUser();
      
      if (!user.data.user) {
        toast({
          title: "Error",
          description: "You must be logged in to perform this action",
          variant: "destructive",
        });
        return;
      }

      // Prepare base data without created_by - that's set only on creation
      const baseLeadData = {
        lead_name: data.lead_name,
        account_id: data.account_id && data.account_id.trim() !== "" ? data.account_id : null,
        position: data.position || null,
        email: data.email || null,
        phone_no: data.phone_no || null,
        linkedin: data.linkedin || null,
        contact_source: data.contact_source || null,
        lead_status: data.lead_status || 'New',
        description: data.description || null,
        modified_by: user.data.user.id,
      };

      if (lead) {
        console.log('Updating lead with data:', { ...baseLeadData, modified_time: new Date().toISOString() });
        
        const { data: updatedLead, error } = await supabase
          .from('leads')
          .update({
            ...baseLeadData,
            modified_time: new Date().toISOString(),
          })
          .eq('id', lead.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating lead:', error);
          throw error;
        }
        
        console.log('Lead updated successfully:', updatedLead);

        if (error) throw error;

        await logUpdate('leads', lead.id, baseLeadData, lead);

        toast({
          title: "Success",
          description: "Lead updated successfully",
        });
      } else {
        // For new leads, add created_by and contact_owner
        const newLeadData = {
          ...baseLeadData,
          created_by: user.data.user.id,
          contact_owner: user.data.user.id,
          created_time: new Date().toISOString(),
        };
        
        console.log('Creating new lead with data:', newLeadData);
        
        const { data: newLead, error } = await supabase
          .from('leads')
          .insert(newLeadData)
          .select()
          .single();

        if (error) {
          console.error('Error creating lead:', error);
          throw error;
        }
        
        console.log('Lead created successfully:', newLead);

        await logCreate('leads', newLead.id, newLeadData);

        toast({
          title: "Success",
          description: "Lead created successfully",
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: lead ? "Failed to update lead" : "Failed to create lead",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAccounts = accounts.filter(account =>
    account.company_name.toLowerCase().includes(accountSearch.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {lead ? "Edit Lead" : "Add New Lead"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lead_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Lead Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="account_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Account</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <div className="px-2 py-1">
                          <Input
                            placeholder="Search accounts..."
                            value={accountSearch}
                            onChange={(e) => setAccountSearch(e.target.value)}
                            inputSize="sm"
                          />
                        </div>
                        {filteredAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.company_name}
                          </SelectItem>
                        ))}
                        {filteredAccounts.length === 0 && (
                          <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                            No accounts found
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <FormControl>
                      <Input placeholder="CEO" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 234 567 8900" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="linkedin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn Profile</FormLabel>
                    <FormControl>
                      <Input placeholder="https://linkedin.com/in/username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact_source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead Source</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {leadSources.map((source) => (
                          <SelectItem key={source} value={source}>
                            {source}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lead_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="New" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {leadStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional notes about the lead..."
                      className="min-h-20"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : lead ? "Save Changes" : "Add Lead"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

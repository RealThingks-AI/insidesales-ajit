import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowUpDown, ArrowUp, ArrowDown, CalendarPlus } from "lucide-react";
import { RowActionsDropdown, Edit, Trash2, Mail, Eye, UserPlus } from "../RowActionsDropdown";
import { useUserDisplayNames } from "@/hooks/useUserDisplayNames";
import { ContactColumnConfig } from "../ContactColumnCustomizer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AccountViewModal } from "../AccountViewModal";
import { SendEmailModal } from "../SendEmailModal";
import { MeetingModal } from "../MeetingModal";

interface Contact {
  id: string;
  contact_name: string;
  company_name?: string;
  account_company_name?: string;
  account_id?: string;
  position?: string;
  email?: string;
  phone_no?: string;
  contact_owner?: string;
  contact_source?: string;
  created_by?: string;
  linkedin?: string;
  website?: string;
  [key: string]: any;
}

interface ContactTableBodyProps {
  loading: boolean;
  pageContacts: Contact[];
  visibleColumns: ContactColumnConfig[];
  selectedContacts: string[];
  setSelectedContacts: React.Dispatch<React.SetStateAction<string[]>>;
  onEdit: (contact: Contact) => void;
  onView: (contact: Contact) => void;
  onDelete: (id: string) => void;
  searchTerm: string;
  onRefresh?: () => void;
  sortField: string | null;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
}

export const ContactTableBody = ({
  loading,
  pageContacts,
  visibleColumns,
  selectedContacts,
  setSelectedContacts,
  onEdit,
  onView,
  onDelete,
  searchTerm,
  onRefresh,
  sortField,
  sortDirection,
  onSort
}: ContactTableBodyProps) => {
  const { toast } = useToast();
  const [viewAccountId, setViewAccountId] = useState<string | null>(null);
  const [accountViewOpen, setAccountViewOpen] = useState(false);
  const [emailContact, setEmailContact] = useState<Contact | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [meetingContact, setMeetingContact] = useState<Contact | null>(null);
  
  // Get all unique user IDs that we need to fetch display names for
  const contactOwnerIds = [...new Set(pageContacts.map(c => c.contact_owner).filter(Boolean))];
  const createdByIds = [...new Set(pageContacts.map(c => c.created_by).filter(Boolean))];
  const allUserIds = [...new Set([...contactOwnerIds, ...createdByIds])];
  
  const { displayNames } = useUserDisplayNames(allUserIds);

  console.log('ContactTableBody: Display names received:', displayNames);
  console.log('ContactTableBody: Page contacts:', pageContacts.map(c => ({ id: c.id, contact_owner: c.contact_owner, created_by: c.created_by })));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pageContactIds = pageContacts.slice(0, 50).map(c => c.id);
      setSelectedContacts(pageContactIds);
    } else {
      setSelectedContacts([]);
    }
  };

  const handleSelectContact = (contactId: string, checked: boolean) => {
    if (checked) {
      setSelectedContacts(prev => [...prev, contactId]);
    } else {
      setSelectedContacts(prev => prev.filter(id => id !== contactId));
    }
  };

  const handleConvertToLead = async (contact: Contact) => {
    try {
      console.log('Converting contact to lead:', contact);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Create a new lead with contact information
      // Only include fields that have values to avoid insertion errors
      const leadData: any = {
        lead_name: contact.contact_name,
        created_by: user.id,
        created_time: new Date().toISOString(),
        modified_time: new Date().toISOString()
      };

      // Add optional fields only if they have values
      if (contact.company_name) leadData.company_name = contact.company_name;
      if (contact.position) leadData.position = contact.position;
      if (contact.email) leadData.email = contact.email;
      if (contact.phone_no) leadData.phone_no = contact.phone_no;
      if (contact.linkedin) leadData.linkedin = contact.linkedin;
      if (contact.website) leadData.website = contact.website;
      if (contact.contact_source) leadData.contact_source = contact.contact_source;
      if (contact.lead_status) leadData.lead_status = contact.lead_status;
      if (contact.industry) leadData.industry = contact.industry;
      if (contact.region) leadData.country = contact.region; // Map region to country for leads table
      if (contact.description) leadData.description = contact.description;
      if (contact.contact_owner) leadData.contact_owner = contact.contact_owner;

      console.log('Lead data to insert:', leadData);

      const { data: insertedLead, error } = await supabase
        .from('leads')
        .insert([leadData])
        .select()
        .single();

      if (error) {
        console.error('Error inserting lead:', error);
        throw error;
      }

      console.log('Lead created successfully:', insertedLead);

      toast({
        title: "Success",
        description: `Contact "${contact.contact_name}" has been converted to a lead successfully.`,
      });

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error converting contact to lead:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to convert contact to lead. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  const getDisplayValue = (contact: Contact, columnField: string) => {
    if (columnField === 'contact_owner') {
      if (!contact.contact_owner) return '-';
      const displayName = displayNames[contact.contact_owner];
      console.log(`ContactTableBody: Getting display value for contact_owner ${contact.contact_owner}:`, displayName);
      // Show the display name if available, otherwise show "Loading..." temporarily
      return displayName && displayName !== "Unknown User" ? displayName : (displayName === "Unknown User" ? "Unknown User" : "Loading...");
    } else if (columnField === 'created_by') {
      if (!contact.created_by) return '-';
      const displayName = displayNames[contact.created_by];
      // Show the display name if available, otherwise show "Loading..." temporarily
      return displayName && displayName !== "Unknown User" ? displayName : (displayName === "Unknown User" ? "Unknown User" : "Loading...");
    } else if (columnField === 'lead_status' && contact.lead_status) {
      return (
        <Badge variant={contact.lead_status === 'Converted' ? 'default' : 'secondary'}>
          {contact.lead_status}
        </Badge>
      );
    } else {
      return contact[columnField as keyof Contact] || '-';
    }
  };

  if (loading) {
    return (
      <Table>
        <TableBody>
          <TableRow>
            <TableCell colSpan={visibleColumns.length + 2} className="text-center py-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
                Loading contacts...
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  if (pageContacts.length === 0) {
    return (
      <Table>
        <TableBody>
          <TableRow>
            <TableCell colSpan={visibleColumns.length + 2} className="text-center py-8">
              <div className="flex flex-col items-center gap-2">
                <p className="text-muted-foreground">No contacts found</p>
                {searchTerm && (
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search terms
                  </p>
                )}
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  return (
    <div className="overflow-auto">
      <Table>
        <TableHeader className="sticky top-0 z-10">
          <TableRow className="bg-muted/50 hover:bg-muted/60 border-b-2">
            <TableHead className="w-12 text-center font-bold text-foreground">
              <div className="flex justify-center">
                <Checkbox
                  checked={selectedContacts.length > 0 && selectedContacts.length === Math.min(pageContacts.length, 50)}
                  onCheckedChange={handleSelectAll}
                />
              </div>
            </TableHead>
            {visibleColumns.map((column) => (
              <TableHead key={column.field} className="text-left font-bold text-foreground px-4 py-3">
                <Button
                  variant="ghost"
                  className="h-auto p-0 font-bold hover:bg-transparent w-full justify-start text-foreground"
                  onClick={() => onSort(column.field)}
                >
                  <div className="group flex items-center gap-2">
                    {column.label}
                    {getSortIcon(column.field)}
                  </div>
                </Button>
              </TableHead>
            ))}
            <TableHead className="text-center font-bold text-foreground w-32">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageContacts.map((contact) => (
            <TableRow key={contact.id} className="hover:bg-muted/20">
              <TableCell className="text-center px-4 py-3">
                <div className="flex justify-center">
                  <Checkbox
                    checked={selectedContacts.includes(contact.id)}
                    onCheckedChange={(checked) => handleSelectContact(contact.id, checked as boolean)}
                  />
                </div>
              </TableCell>
              {visibleColumns.map((column) => (
                <TableCell key={column.field} className="text-left px-4 py-3 align-middle">
                  <div className="flex items-center min-h-[1.5rem]">
                    {column.field === 'contact_name' ? (
                      <button
                        onClick={() => onEdit(contact)}
                        className="text-primary hover:underline font-medium text-left"
                      >
                        {contact[column.field as keyof Contact]}
                      </button>
                    ) : column.field === 'account_company_name' && contact.account_company_name ? (
                      <button
                        onClick={() => {
                          if (contact.account_id) {
                            setViewAccountId(contact.account_id);
                            setAccountViewOpen(true);
                          }
                        }}
                        className="text-primary hover:underline font-medium text-left truncate max-w-[200px]"
                        title={contact.account_company_name}
                      >
                        {contact.account_company_name}
                      </button>
                    ) : (
                      <span className="truncate max-w-[200px]" title={String(getDisplayValue(contact, column.field))}>
                        {getDisplayValue(contact, column.field)}
                      </span>
                    )}
                  </div>
                </TableCell>
              ))}
              <TableCell className="w-20 py-3">
                <div className="flex items-center justify-end pr-2">
                  <RowActionsDropdown
                    actions={[
                      {
                        label: "View Details",
                        icon: <Eye className="w-4 h-4" />,
                        onClick: () => onView(contact)
                      },
                      {
                        label: "Edit",
                        icon: <Edit className="w-4 h-4" />,
                        onClick: () => onEdit(contact)
                      },
                      {
                        label: "Send Email",
                        icon: <Mail className="w-4 h-4" />,
                        onClick: () => {
                          setEmailContact(contact);
                          setEmailModalOpen(true);
                        },
                        disabled: !contact.email
                      },
                      {
                        label: "Create Meeting",
                        icon: <CalendarPlus className="w-4 h-4" />,
                        onClick: () => {
                          setMeetingContact(contact);
                          setMeetingModalOpen(true);
                        }
                      },
                      {
                        label: "Convert to Lead",
                        icon: <UserPlus className="w-4 h-4" />,
                        onClick: () => handleConvertToLead(contact),
                        separator: true
                      },
                      {
                        label: "Delete",
                        icon: <Trash2 className="w-4 h-4" />,
                        onClick: () => onDelete(contact.id),
                        destructive: true,
                        separator: true
                      }
                    ]}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Account View Modal */}
      <AccountViewModal
        open={accountViewOpen}
        onOpenChange={setAccountViewOpen}
        accountId={viewAccountId}
      />

      {/* Send Email Modal */}
      <SendEmailModal
        open={emailModalOpen}
        onOpenChange={setEmailModalOpen}
        recipient={emailContact ? {
          name: emailContact.contact_name,
          email: emailContact.email,
          company_name: emailContact.company_name,
          position: emailContact.position,
        } : null}
      />

      {/* Meeting Modal */}
      <MeetingModal
        open={meetingModalOpen}
        onOpenChange={setMeetingModalOpen}
        meeting={meetingContact ? {
          id: '',
          subject: `Meeting with ${meetingContact.contact_name}`,
          start_time: new Date().toISOString(),
          end_time: new Date().toISOString(),
          contact_id: meetingContact.id,
          status: 'scheduled'
        } : null}
        onSuccess={() => {
          setMeetingModalOpen(false);
          setMeetingContact(null);
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
};

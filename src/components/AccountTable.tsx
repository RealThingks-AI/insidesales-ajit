import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCRUDAudit } from "@/hooks/useCRUDAudit";
import { useUserDisplayNames } from "@/hooks/useUserDisplayNames";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, X, Eye } from "lucide-react";
import { RowActionsDropdown, Edit, Trash2, Mail } from "./RowActionsDropdown";
import { AccountModal } from "./AccountModal";
import { AccountColumnCustomizer, AccountColumnConfig } from "./AccountColumnCustomizer";
import { AccountStatusFilter } from "./AccountStatusFilter";
import { AccountDeleteConfirmDialog } from "./AccountDeleteConfirmDialog";
import { SendEmailModal, EmailRecipient } from "./SendEmailModal";
import { AccountDetailModal } from "./accounts/AccountDetailModal";
import { AccountScoreBadge, AccountSegmentBadge } from "./accounts/AccountScoreBadge";
export interface Account {
  id: string;
  company_name: string;
  region?: string;
  country?: string;
  website?: string;
  company_type?: string;
  tags?: string[];
  status?: string;
  notes?: string;
  account_owner?: string;
  industry?: string;
  phone?: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  modified_by?: string;
  score?: number;
  segment?: string;
}
const defaultColumns: AccountColumnConfig[] = [{
  field: 'company_name',
  label: 'Company Name',
  visible: true,
  order: 0
}, {
  field: 'email',
  label: 'Email',
  visible: true,
  order: 1
}, {
  field: 'company_type',
  label: 'Company Type',
  visible: true,
  order: 2
}, {
  field: 'industry',
  label: 'Industry',
  visible: true,
  order: 3
}, {
  field: 'tags',
  label: 'Tags',
  visible: true,
  order: 4
}, {
  field: 'country',
  label: 'Country',
  visible: true,
  order: 5
}, {
  field: 'status',
  label: 'Status',
  visible: true,
  order: 6
}, {
  field: 'website',
  label: 'Website',
  visible: true,
  order: 7
}, {
  field: 'account_owner',
  label: 'Account Owner',
  visible: true,
  order: 8
}, {
  field: 'region',
  label: 'Region',
  visible: false,
  order: 9
}, {
  field: 'phone',
  label: 'Phone',
  visible: false,
  order: 10
}];
interface AccountTableProps {
  showColumnCustomizer: boolean;
  setShowColumnCustomizer: (show: boolean) => void;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  selectedAccounts: string[];
  setSelectedAccounts: React.Dispatch<React.SetStateAction<string[]>>;
  onBulkDeleteComplete?: () => void;
}
const AccountTable = ({
  showColumnCustomizer,
  setShowColumnCustomizer,
  showModal,
  setShowModal,
  selectedAccounts,
  setSelectedAccounts,
  onBulkDeleteComplete
}: AccountTableProps) => {
  const {
    toast
  } = useToast();
  const {
    logDelete
  } = useCRUDAudit();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [columns, setColumns] = useState(defaultColumns);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState<EmailRecipient | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewingAccount, setViewingAccount] = useState<Account | null>(null);
  useEffect(() => {
    fetchAccounts();
  }, []);
  useEffect(() => {
    let filtered = accounts.filter(account => account.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) || account.industry?.toLowerCase().includes(searchTerm.toLowerCase()) || account.country?.toLowerCase().includes(searchTerm.toLowerCase()));
    if (statusFilter !== "all") {
      filtered = filtered.filter(account => account.status === statusFilter);
    }
    if (tagFilter) {
      filtered = filtered.filter(account => account.tags?.includes(tagFilter));
    }
    if (sortField) {
      filtered.sort((a, b) => {
        const aValue = a[sortField as keyof Account] || '';
        const bValue = b[sortField as keyof Account] || '';
        const comparison = aValue.toString().localeCompare(bValue.toString());
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    setFilteredAccounts(filtered);
    setCurrentPage(1);
  }, [accounts, searchTerm, statusFilter, tagFilter, sortField, sortDirection]);
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };
  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const {
        data,
        error
      } = await supabase.from('accounts').select('*').order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch accounts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async () => {
    if (!accountToDelete?.id) return;
    try {
      // Check for linked contacts/leads
      const {
        data: linkedContacts
      } = await supabase.from('contacts').select('id').eq('account_id', accountToDelete.id).limit(1);
      const {
        data: linkedLeads
      } = await supabase.from('leads').select('id').eq('account_id', accountToDelete.id).limit(1);
      if (linkedContacts && linkedContacts.length > 0 || linkedLeads && linkedLeads.length > 0) {
        toast({
          title: "Cannot Delete",
          description: "This account has linked contacts or leads. Please unlink them first.",
          variant: "destructive"
        });
        setShowDeleteDialog(false);
        return;
      }
      const {
        error
      } = await supabase.from('accounts').delete().eq('id', accountToDelete.id);
      if (error) throw error;
      await logDelete('accounts', accountToDelete.id, accountToDelete);
      toast({
        title: "Success",
        description: "Account deleted successfully"
      });
      fetchAccounts();
      setAccountToDelete(null);
      setShowDeleteDialog(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account",
        variant: "destructive"
      });
    }
  };
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pageAccounts = getCurrentPageAccounts().slice(0, 50);
      setSelectedAccounts(pageAccounts.map(a => a.id));
    } else {
      setSelectedAccounts([]);
    }
  };
  const handleSelectAccount = (accountId: string, checked: boolean) => {
    if (checked) {
      setSelectedAccounts(prev => [...prev, accountId]);
    } else {
      setSelectedAccounts(prev => prev.filter(id => id !== accountId));
    }
  };
  const getCurrentPageAccounts = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAccounts.slice(startIndex, startIndex + itemsPerPage);
  };
  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);
  const createdByIds = useMemo(() => {
    return [...new Set(accounts.map(a => a.created_by).filter(Boolean))];
  }, [accounts]);
  const {
    displayNames
  } = useUserDisplayNames(createdByIds);
  const visibleColumns = columns.filter(col => col.visible);
  const pageAccounts = getCurrentPageAccounts();
  const getStatusBadgeVariant = (status?: string) => {
    switch (status) {
      case 'Hot':
        return 'destructive';
      case 'Warm':
        return 'default';
      case 'Working':
        return 'secondary';
      case 'Closed-Won':
        return 'outline';
      case 'Closed-Lost':
        return 'outline';
      default:
        return 'secondary';
    }
  };
  return <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
            <Input placeholder="Search accounts..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" inputSize="control" />
          </div>
          <AccountStatusFilter value={statusFilter} onValueChange={setStatusFilter} />
          {tagFilter && <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                Tag: {tagFilter}
                <button onClick={() => setTagFilter(null)} className="ml-1 hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            </div>}
        </div>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10">
              <TableRow className="bg-muted/50 hover:bg-muted/60 border-b-2">
                <TableHead className="w-12 text-center font-bold text-foreground bg-muted/50">
                  <div className="flex justify-center">
                    <Checkbox checked={selectedAccounts.length > 0 && selectedAccounts.length === Math.min(pageAccounts.length, 50)} onCheckedChange={handleSelectAll} />
                  </div>
                </TableHead>
                {visibleColumns.map(column => <TableHead key={column.field} className="text-left font-bold text-foreground bg-muted/50 px-4 py-3 whitespace-nowrap">
                    <div className="group flex items-center gap-2 cursor-pointer hover:text-primary" onClick={() => handleSort(column.field)}>
                      {column.label}
                      {getSortIcon(column.field)}
                    </div>
                  </TableHead>)}
                <TableHead className="text-center font-bold text-foreground bg-muted/50 w-32 px-4 py-3">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? <TableRow>
                  <TableCell colSpan={visibleColumns.length + 2} className="text-center py-8">
                    Loading accounts...
                  </TableCell>
                </TableRow> : pageAccounts.length === 0 ? <TableRow>
                  <TableCell colSpan={visibleColumns.length + 2} className="text-center py-8">
                    No accounts found
                  </TableCell>
                </TableRow> : pageAccounts.map(account => <TableRow key={account.id} className="hover:bg-muted/20 border-b">
                  <TableCell className="text-center px-4 py-3">
                    <div className="flex justify-center">
                      <Checkbox checked={selectedAccounts.includes(account.id)} onCheckedChange={checked => handleSelectAccount(account.id, checked as boolean)} />
                    </div>
                  </TableCell>
                  {visibleColumns.map(column => <TableCell key={column.field} className="text-left px-4 py-3 align-middle whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                      {column.field === 'company_name' ? <button onClick={() => {
                  setEditingAccount(account);
                  setShowModal(true);
                }} className="text-primary hover:underline font-medium text-left truncate block w-full">
                          {account.company_name || '-'}
                        </button> : column.field === 'account_owner' ? <span className="truncate block">
                          {account.created_by ? displayNames[account.created_by] || "Loading..." : '-'}
                        </span> : column.field === 'status' && account.status ? <Badge variant={getStatusBadgeVariant(account.status)} className="whitespace-nowrap">
                          {account.status}
                        </Badge> : column.field === 'tags' && account.tags ? <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1">
                                <Badge variant="outline" className="text-xs truncate max-w-[100px] cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors" onClick={() => setTagFilter(account.tags![0])}>
                                  {account.tags[0]}
                                </Badge>
                                {account.tags.length > 1 && <Badge variant="outline" className="text-xs shrink-0">
                                    +{account.tags.length - 1}
                                  </Badge>}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="z-50">
                              <div className="flex flex-col gap-1">
                                <span className="font-medium text-xs">All tags:</span>
                                <div className="flex flex-wrap gap-1 max-w-[280px]">
                                  {account.tags.map((tag, idx) => <Badge key={idx} variant="secondary" className="text-xs cursor-pointer" onClick={() => setTagFilter(tag)}>
                                      {tag}
                                    </Badge>)}
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider> : column.field === 'website' && account.website ? <a href={account.website.startsWith('http') ? account.website : `https://${account.website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                          <span className="truncate max-w-[150px]">
                            {account.website.replace(/^https?:\/\//, '')}
                          </span>
                          
                        </a> : <span className="truncate block" title={account[column.field as keyof Account]?.toString() || '-'}>
                          {account[column.field as keyof Account]?.toString() || '-'}
                        </span>}
                    </TableCell>)}
                  <TableCell className="w-20 px-4 py-3">
                    <div className="flex items-center justify-center">
                      <RowActionsDropdown
                        actions={[
                          {
                            label: "Edit",
                            icon: <Edit className="w-4 h-4" />,
                            onClick: () => {
                              setEditingAccount(account);
                              setShowModal(true);
                            }
                          },
                          {
                            label: "Send Email",
                            icon: <Mail className="w-4 h-4" />,
                            onClick: () => {
                              setEmailRecipient({
                                name: account.company_name,
                                email: account.email,
                                company_name: account.company_name
                              });
                              setEmailModalOpen(true);
                            }
                          },
                          {
                            label: "Delete",
                            icon: <Trash2 className="w-4 h-4" />,
                            onClick: () => {
                              setAccountToDelete(account);
                              setShowDeleteDialog(true);
                            },
                            destructive: true,
                            separator: true
                          }
                        ]}
                      />
                    </div>
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
        </div>
      </Card>

      {totalPages > 1 && <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAccounts.length)} of {filteredAccounts.length} accounts
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>}

      {/* Modals */}
      <AccountModal open={showModal} onOpenChange={open => {
      setShowModal(open);
      if (!open) setEditingAccount(null);
    }} account={editingAccount} onSuccess={() => {
      fetchAccounts();
      setEditingAccount(null);
    }} />

      <AccountColumnCustomizer open={showColumnCustomizer} onOpenChange={setShowColumnCustomizer} columns={columns} onColumnsChange={setColumns} />

      <AccountDeleteConfirmDialog open={showDeleteDialog} onConfirm={handleDelete} onCancel={() => {
      setShowDeleteDialog(false);
      setAccountToDelete(null);
    }} isMultiple={false} count={1} />

      <SendEmailModal open={emailModalOpen} onOpenChange={setEmailModalOpen} recipient={emailRecipient} />
    </div>;
};
export default AccountTable;
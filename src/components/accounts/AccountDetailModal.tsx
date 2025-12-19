import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Building2, 
  Globe, 
  Phone, 
  MapPin, 
  Factory,
  Clock,
  Users,
  Briefcase,
  Plus,
  ExternalLink,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { AccountActivityTimeline } from "./AccountActivityTimeline";
import { AccountAssociations } from "./AccountAssociations";
import { ActivityLogModal } from "./ActivityLogModal";
import { AccountScoreBadge, AccountSegmentBadge } from "./AccountScoreBadge";

interface Account {
  id: string;
  company_name: string;
  website?: string | null;
  phone?: string | null;
  industry?: string | null;
  region?: string | null;
  country?: string | null;
  status?: string | null;
  notes?: string | null;
  company_type?: string | null;
  score?: number | null;
  segment?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface AccountDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account | null;
  onUpdate?: () => void;
}

export const AccountDetailModal = ({ open, onOpenChange, account, onUpdate }: AccountDetailModalProps) => {
  const { toast } = useToast();
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  if (!account) return null;

  const handleActivityLogged = () => {
    setRefreshKey(prev => prev + 1);
    onUpdate?.();
  };

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inactive': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'new': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {account.company_name}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={getStatusColor(account.status)}>
                    {account.status || 'New'}
                  </Badge>
                  <AccountSegmentBadge segment={account.segment || 'prospect'} />
                  <AccountScoreBadge score={account.score || 0} />
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowActivityLog(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Log Activity
              </Button>
            </div>
          </DialogHeader>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="timeline">Activity Timeline</TabsTrigger>
              <TabsTrigger value="associations">Contacts & Deals</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              {/* Account Info */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Company Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {account.website && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={account.website.startsWith('http') ? account.website : `https://${account.website}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {account.website}
                        </a>
                      </div>
                    )}
                    {account.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${account.phone}`} className="hover:underline">
                          {account.phone}
                        </a>
                      </div>
                    )}
                    {account.industry && (
                      <div className="flex items-center gap-2 text-sm">
                        <Factory className="h-4 w-4 text-muted-foreground" />
                        <span>{account.industry}</span>
                      </div>
                    )}
                    {(account.region || account.country) && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{[account.region, account.country].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                    {account.company_type && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{account.company_type}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Account Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AccountScoreBadge score={account.score || 0} showProgress />
                    <div className="mt-4 text-sm text-muted-foreground">
                      <p>Score is calculated based on:</p>
                      <ul className="list-disc list-inside mt-1 space-y-0.5">
                        <li>Number of contacts</li>
                        <li>Activity frequency</li>
                        <li>Recent engagement</li>
                        <li>Profile completeness</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Notes */}
              {account.notes && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{account.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Timestamps */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {account.created_at && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Created: {format(new Date(account.created_at), 'dd/MM/yyyy')}
                  </span>
                )}
                {account.updated_at && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Updated: {format(new Date(account.updated_at), 'dd/MM/yyyy')}
                  </span>
                )}
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="mt-4">
              <AccountActivityTimeline key={refreshKey} accountId={account.id} />
            </TabsContent>

            <TabsContent value="associations" className="mt-4">
              <AccountAssociations 
                accountId={account.id} 
                companyName={account.company_name} 
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <ActivityLogModal
        open={showActivityLog}
        onOpenChange={setShowActivityLog}
        accountId={account.id}
        onSuccess={handleActivityLogged}
      />
    </>
  );
};

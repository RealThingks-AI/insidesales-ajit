import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const validStatuses = ['New', 'Working', 'Warm', 'Hot', 'Nurture', 'Closed-Won', 'Closed-Lost'];
const validTags = [
  'AUTOSAR', 'Adaptive AUTOSAR', 'Embedded Systems', 'BSW', 'ECU', 'Zone Controller',
  'HCP', 'CI/CD', 'V&V Testing', 'Integration', 'Software Architecture', 'LINUX',
  'QNX', 'Cybersecurity', 'FuSa', 'OTA', 'Diagnostics', 'Vehicle Network',
  'Vehicle Architecture', 'Connected Car', 'Platform', 'µC/HW'
];

export const useAccountsImportExport = (onImportComplete: () => void) => {
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleImport = async (file: File) => {
    setIsImporting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('CSV file must have headers and at least one data row');
      }

      const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
      const records: any[] = [];
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const record: any = {};
        
        headers.forEach((header, idx) => {
          record[header] = values[idx] || null;
        });

        // Map common header variations
        const companyName = record.company_name || record.name || record.company;
        if (!companyName) {
          errors.push(`Row ${i + 1}: Missing company_name`);
          continue;
        }

        // Validate status
        let status = record.status || 'New';
        if (!validStatuses.includes(status)) {
          status = 'New';
        }

        // Parse tags
        let tags: string[] = [];
        if (record.tags) {
          const tagList = record.tags.split(/[,;]/).map((t: string) => t.trim());
          tags = tagList.filter((t: string) => validTags.includes(t));
        }

        // Check if record has an ID for update
        const existingId = record.id || null;

        records.push({
          id: existingId,
          company_name: companyName,
          email: record.email || null,
          region: record.region || null,
          country: record.country || null,
          website: record.website || null,
          company_type: record.company_type || null,
          tags: tags.length > 0 ? tags : null,
          status,
          notes: record.notes || null,
          industry: record.industry || null,
          phone: record.phone || null,
          created_by: record.created_by || user.id,
          account_owner: record.account_owner || user.id,
          modified_by: user.id,
        });
      }

      if (records.length === 0) {
        throw new Error('No valid records found in CSV');
      }

      // Upsert by id or company_name
      let successCount = 0;
      let updateCount = 0;

      for (const record of records) {
        const { id, ...recordWithoutId } = record;

        // If id is provided, try to update by id first
        if (id) {
          const { data: existingById } = await supabase
            .from('accounts')
            .select('id')
            .eq('id', id)
            .maybeSingle();

          if (existingById) {
            const { error } = await supabase
              .from('accounts')
              .update({ ...recordWithoutId, updated_at: new Date().toISOString() })
              .eq('id', id);
            
            if (!error) updateCount++;
            continue;
          }
        }

        // Otherwise, check by company_name
        const { data: existing } = await supabase
          .from('accounts')
          .select('id')
          .eq('company_name', record.company_name)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from('accounts')
            .update({ ...recordWithoutId, updated_at: new Date().toISOString() })
            .eq('id', existing.id);
          
          if (!error) updateCount++;
        } else {
          const { error } = await supabase
            .from('accounts')
            .insert(recordWithoutId);
          
          if (!error) successCount++;
        }
      }

      toast({
        title: "Import Successful",
        description: `Created ${successCount} new accounts, updated ${updateCount} existing accounts${errors.length > 0 ? `. ${errors.length} rows had errors.` : ''}`,
      });

      onImportComplete();
    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = async () => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: "No Data",
          description: "No accounts to export.",
        });
        return;
      }

      const headers = [
        'id', 'company_name', 'email', 'company_type', 'industry', 'tags', 'country', 
        'status', 'website', 'region', 'notes', 'phone',
        'account_owner', 'created_by', 'modified_by', 'created_at', 'updated_at'
      ];

      const csvLines = [headers.join(',')];

      for (const account of data) {
        const row = headers.map(header => {
          let value = account[header as keyof typeof account];
          if (header === 'tags' && Array.isArray(value)) {
            value = value.join(';');
          }
          if (value === null || value === undefined) return '';
          const strValue = String(value);
          if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
            return `"${strValue.replace(/"/g, '""')}"`;
          }
          return strValue;
        });
        csvLines.push(row.join(','));
      }

      const csvContent = csvLines.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('href', url);
      a.setAttribute('download', `accounts_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Exported ${data.length} accounts to CSV.`,
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return {
    handleImport,
    handleExport,
    isImporting
  };
};

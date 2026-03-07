import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download, CalendarDays, FileText, Loader2 } from 'lucide-react';

interface Booking {
  id: string;
  parent_name: string;
  child_name: string;
  child_age: string;
  phone: string;
  email: string;
  preferred_date: string | null;
  created_at: string;
}

const ParentBookingsTable = () => {
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['parent-bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parent_bookings')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Booking[];
    },
  });

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        b.parent_name.toLowerCase().includes(q) ||
        b.child_name.toLowerCase().includes(q) ||
        b.phone.includes(q);

      const createdDate = b.created_at.slice(0, 10);
      const matchesFrom = !dateFrom || createdDate >= dateFrom;
      const matchesTo = !dateTo || createdDate <= dateTo;

      return matchesSearch && matchesFrom && matchesTo;
    });
  }, [bookings, search, dateFrom, dateTo]);

  const exportCSV = () => {
    const headers = ['Parent Name', 'Child Name', 'Date of Birth', 'Phone', 'Preferred Date', 'Submitted On'];
    const rows = filtered.map((b) => [
      b.parent_name,
      b.child_name,
      b.child_age,
      b.phone,
      b.preferred_date || 'N/A',
      new Date(b.created_at).toLocaleString('en-IN'),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parent-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand" />
            Parent Bookings ({filtered.length})
          </CardTitle>
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={filtered.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 items-center">
            <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-auto" />
            <span className="text-muted-foreground text-sm">to</span>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-auto" />
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No bookings found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parent Name</TableHead>
                  <TableHead>Child Name</TableHead>
                  <TableHead>DOB</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Preferred Date</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.parent_name}</TableCell>
                    <TableCell>{b.child_name}</TableCell>
                    <TableCell>{b.child_age}</TableCell>
                    <TableCell>{b.phone}</TableCell>
                    <TableCell>{b.preferred_date || '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatDate(b.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ParentBookingsTable;

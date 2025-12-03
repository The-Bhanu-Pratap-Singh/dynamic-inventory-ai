import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Plus, BookOpen, FileText, TrendingUp, TrendingDown, Scale, Download } from 'lucide-react';

interface Ledger {
  id: string;
  name: string;
  code: string | null;
  type: string;
  opening_balance: number;
  current_balance: number;
  is_system: boolean;
}

interface JournalEntry {
  id: string;
  entry_number: string;
  entry_date: string;
  description: string | null;
  total_debit: number;
  total_credit: number;
  status: string;
}

const Accounting = () => {
  const navigate = useNavigate();
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLedgerDialogOpen, setIsLedgerDialogOpen] = useState(false);
  const [ledgerForm, setLedgerForm] = useState({
    name: '',
    code: '',
    type: 'asset',
    opening_balance: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ledgersRes, journalsRes] = await Promise.all([
        supabase.from('ledgers').select('*').order('type').order('name'),
        supabase.from('journal_entries').select('*').order('entry_date', { ascending: false }).limit(50)
      ]);

      if (ledgersRes.error) throw ledgersRes.error;
      if (journalsRes.error) throw journalsRes.error;

      setLedgers(ledgersRes.data || []);
      setJournalEntries(journalsRes.data || []);
    } catch (error: any) {
      toast.error('Failed to load accounting data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLedger = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('ledgers')
        .insert({
          ...ledgerForm,
          current_balance: ledgerForm.opening_balance
        });

      if (error) throw error;

      toast.success('Ledger added successfully');
      setIsLedgerDialogOpen(false);
      setLedgerForm({ name: '', code: '', type: 'asset', opening_balance: 0 });
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add ledger');
    }
  };

  const getLedgersByType = (type: string) => ledgers.filter(l => l.type === type);

  const calculateTotals = () => {
    const assets = getLedgersByType('asset').reduce((sum, l) => sum + (l.current_balance || 0), 0);
    const liabilities = getLedgersByType('liability').reduce((sum, l) => sum + (l.current_balance || 0), 0);
    const equity = getLedgersByType('equity').reduce((sum, l) => sum + (l.current_balance || 0), 0);
    const income = getLedgersByType('income').reduce((sum, l) => sum + (l.current_balance || 0), 0);
    const expenses = getLedgersByType('expense').reduce((sum, l) => sum + (l.current_balance || 0), 0);
    
    return { assets, liabilities, equity, income, expenses };
  };

  const totals = calculateTotals();

  const exportTrialBalance = () => {
    const rows = ledgers.map(l => ({
      Code: l.code || '',
      Name: l.name,
      Type: l.type,
      Debit: l.current_balance > 0 ? l.current_balance : 0,
      Credit: l.current_balance < 0 ? Math.abs(l.current_balance) : 0
    }));

    const csv = [
      Object.keys(rows[0] || {}).join(','),
      ...rows.map(r => Object.values(r).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trial-balance-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Accounting</h1>
              <p className="text-muted-foreground">Ledgers, journal entries, and financial statements</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Assets</p>
                  <p className="text-lg font-bold">₹{totals.assets.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Liabilities</p>
                  <p className="text-lg font-bold">₹{totals.liabilities.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Scale className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Equity</p>
                  <p className="text-lg font-bold">₹{totals.equity.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Income</p>
                  <p className="text-lg font-bold">₹{totals.income.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Expenses</p>
                  <p className="text-lg font-bold">₹{totals.expenses.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="ledgers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="ledgers">Chart of Accounts</TabsTrigger>
            <TabsTrigger value="journals">Journal Entries</TabsTrigger>
            <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
            <TabsTrigger value="pnl">Profit & Loss</TabsTrigger>
            <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
          </TabsList>

          <TabsContent value="ledgers">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" /> Chart of Accounts
                  </CardTitle>
                  <Dialog open={isLedgerDialogOpen} onOpenChange={setIsLedgerDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm"><Plus className="h-4 w-4 mr-2" /> Add Ledger</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Ledger</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleAddLedger} className="space-y-4">
                        <div className="space-y-2">
                          <Label>Account Name *</Label>
                          <Input
                            required
                            value={ledgerForm.name}
                            onChange={e => setLedgerForm({ ...ledgerForm, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Account Code</Label>
                          <Input
                            value={ledgerForm.code}
                            onChange={e => setLedgerForm({ ...ledgerForm, code: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Account Type *</Label>
                          <Select
                            value={ledgerForm.type}
                            onValueChange={v => setLedgerForm({ ...ledgerForm, type: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="asset">Asset</SelectItem>
                              <SelectItem value="liability">Liability</SelectItem>
                              <SelectItem value="equity">Equity</SelectItem>
                              <SelectItem value="income">Income</SelectItem>
                              <SelectItem value="expense">Expense</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Opening Balance (₹)</Label>
                          <Input
                            type="number"
                            value={ledgerForm.opening_balance}
                            onChange={e => setLedgerForm({ ...ledgerForm, opening_balance: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setIsLedgerDialogOpen(false)}>Cancel</Button>
                          <Button type="submit">Add Ledger</Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Opening Balance</TableHead>
                      <TableHead className="text-right">Current Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledgers.map(ledger => (
                      <TableRow key={ledger.id}>
                        <TableCell className="font-mono text-sm">{ledger.code || '-'}</TableCell>
                        <TableCell className="font-medium">{ledger.name}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs capitalize ${
                            ledger.type === 'asset' ? 'bg-blue-100 text-blue-700' :
                            ledger.type === 'liability' ? 'bg-red-100 text-red-700' :
                            ledger.type === 'equity' ? 'bg-purple-100 text-purple-700' :
                            ledger.type === 'income' ? 'bg-green-100 text-green-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {ledger.type}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">₹{ledger.opening_balance?.toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right font-medium">₹{ledger.current_balance?.toLocaleString('en-IN')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="journals">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Journal Entries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Entry #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {journalEntries.map(entry => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-mono">{entry.entry_number}</TableCell>
                        <TableCell>{new Date(entry.entry_date).toLocaleDateString('en-IN')}</TableCell>
                        <TableCell>{entry.description || '-'}</TableCell>
                        <TableCell className="text-right">₹{entry.total_debit?.toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right">₹{entry.total_credit?.toLocaleString('en-IN')}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${
                            entry.status === 'posted' ? 'bg-green-100 text-green-700' :
                            entry.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {entry.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {journalEntries.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No journal entries found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trial-balance">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Trial Balance</CardTitle>
                  <Button size="sm" variant="outline" onClick={exportTrialBalance}>
                    <Download className="h-4 w-4 mr-2" /> Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Account Name</TableHead>
                      <TableHead className="text-right">Debit (₹)</TableHead>
                      <TableHead className="text-right">Credit (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledgers.map(ledger => (
                      <TableRow key={ledger.id}>
                        <TableCell className="font-mono text-sm">{ledger.code || '-'}</TableCell>
                        <TableCell>{ledger.name}</TableCell>
                        <TableCell className="text-right">
                          {ledger.current_balance > 0 ? `₹${ledger.current_balance.toLocaleString('en-IN')}` : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {ledger.current_balance < 0 ? `₹${Math.abs(ledger.current_balance).toLocaleString('en-IN')}` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold bg-muted">
                      <TableCell colSpan={2}>Total</TableCell>
                      <TableCell className="text-right">
                        ₹{ledgers.filter(l => l.current_balance > 0).reduce((s, l) => s + l.current_balance, 0).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right">
                        ₹{Math.abs(ledgers.filter(l => l.current_balance < 0).reduce((s, l) => s + l.current_balance, 0)).toLocaleString('en-IN')}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pnl">
            <Card>
              <CardHeader>
                <CardTitle>Profit & Loss Statement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-green-600">Income</h3>
                  <Table>
                    <TableBody>
                      {getLedgersByType('income').map(l => (
                        <TableRow key={l.id}>
                          <TableCell>{l.name}</TableCell>
                          <TableCell className="text-right">₹{l.current_balance?.toLocaleString('en-IN')}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold border-t-2">
                        <TableCell>Total Income</TableCell>
                        <TableCell className="text-right text-green-600">₹{totals.income.toLocaleString('en-IN')}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-red-600">Expenses</h3>
                  <Table>
                    <TableBody>
                      {getLedgersByType('expense').map(l => (
                        <TableRow key={l.id}>
                          <TableCell>{l.name}</TableCell>
                          <TableCell className="text-right">₹{l.current_balance?.toLocaleString('en-IN')}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold border-t-2">
                        <TableCell>Total Expenses</TableCell>
                        <TableCell className="text-right text-red-600">₹{totals.expenses.toLocaleString('en-IN')}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                <div className="pt-4 border-t-2">
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span>Net {totals.income - totals.expenses >= 0 ? 'Profit' : 'Loss'}</span>
                    <span className={totals.income - totals.expenses >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ₹{Math.abs(totals.income - totals.expenses).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="balance-sheet">
            <Card>
              <CardHeader>
                <CardTitle>Balance Sheet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-blue-600">Assets</h3>
                    <Table>
                      <TableBody>
                        {getLedgersByType('asset').map(l => (
                          <TableRow key={l.id}>
                            <TableCell>{l.name}</TableCell>
                            <TableCell className="text-right">₹{l.current_balance?.toLocaleString('en-IN')}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-bold border-t-2">
                          <TableCell>Total Assets</TableCell>
                          <TableCell className="text-right text-blue-600">₹{totals.assets.toLocaleString('en-IN')}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-lg mb-3 text-red-600">Liabilities</h3>
                      <Table>
                        <TableBody>
                          {getLedgersByType('liability').map(l => (
                            <TableRow key={l.id}>
                              <TableCell>{l.name}</TableCell>
                              <TableCell className="text-right">₹{l.current_balance?.toLocaleString('en-IN')}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="font-bold border-t-2">
                            <TableCell>Total Liabilities</TableCell>
                            <TableCell className="text-right text-red-600">₹{totals.liabilities.toLocaleString('en-IN')}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-3 text-purple-600">Equity</h3>
                      <Table>
                        <TableBody>
                          {getLedgersByType('equity').map(l => (
                            <TableRow key={l.id}>
                              <TableCell>{l.name}</TableCell>
                              <TableCell className="text-right">₹{l.current_balance?.toLocaleString('en-IN')}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="font-bold border-t-2">
                            <TableCell>Total Equity</TableCell>
                            <TableCell className="text-right text-purple-600">₹{totals.equity.toLocaleString('en-IN')}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Accounting;

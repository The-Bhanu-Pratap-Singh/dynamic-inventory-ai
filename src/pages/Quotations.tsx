import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Search, FileText, Download } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  selling_price: number;
  tax_rate: number;
  hsn_code: string | null;
}

interface Quotation {
  id: string;
  quotation_number: string;
  customer_id: string | null;
  quotation_date: string;
  valid_until: string | null;
  subtotal: number;
  total_amount: number;
  status: string;
  customers?: { name: string } | null;
}

interface QuotationItem {
  product_id: string;
  product_name: string;
  hsn_code: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
}

const Quotations = () => {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    customer_id: '',
    valid_until: '',
    notes: ''
  });
  const [items, setItems] = useState<QuotationItem[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [quotationsRes, customersRes, productsRes] = await Promise.all([
        supabase.from('quotations').select('*, customers(name)').order('created_at', { ascending: false }),
        supabase.from('customers').select('id, name').order('name'),
        supabase.from('products').select('id, name, selling_price, tax_rate, hsn_code').order('name')
      ]);

      if (quotationsRes.error) throw quotationsRes.error;
      if (customersRes.error) throw customersRes.error;
      if (productsRes.error) throw productsRes.error;

      setQuotations(quotationsRes.data || []);
      setCustomers(customersRes.data || []);
      setProducts(productsRes.data || []);
    } catch (error: any) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const addItem = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingIndex = items.findIndex(i => i.product_id === productId);
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].tax_amount = (updated[existingIndex].unit_price * updated[existingIndex].quantity * (updated[existingIndex].tax_rate / 100));
      updated[existingIndex].total_amount = (updated[existingIndex].unit_price * updated[existingIndex].quantity) + updated[existingIndex].tax_amount;
      setItems(updated);
    } else {
      const taxAmount = (product.selling_price || 0) * ((product.tax_rate || 0) / 100);
      setItems([...items, {
        product_id: product.id,
        product_name: product.name,
        hsn_code: product.hsn_code || '',
        quantity: 1,
        unit_price: product.selling_price || 0,
        tax_rate: product.tax_rate || 0,
        tax_amount: taxAmount,
        total_amount: (product.selling_price || 0) + taxAmount
      }]);
    }
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    const updated = [...items];
    updated[index].quantity = quantity;
    updated[index].tax_amount = updated[index].unit_price * quantity * (updated[index].tax_rate / 100);
    updated[index].total_amount = (updated[index].unit_price * quantity) + updated[index].tax_amount;
    setItems(updated);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, i) => sum + (i.unit_price * i.quantity), 0);
    const taxAmount = items.reduce((sum, i) => sum + i.tax_amount, 0);
    return { subtotal, taxAmount, total: subtotal + taxAmount };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const totals = calculateTotals();
      const quotationNumber = `QT-${Date.now()}`;

      const { data: quotation, error: quotationError } = await supabase
        .from('quotations')
        .insert({
          quotation_number: quotationNumber,
          customer_id: formData.customer_id || null,
          valid_until: formData.valid_until || null,
          notes: formData.notes || null,
          subtotal: totals.subtotal,
          cgst_amount: totals.taxAmount / 2,
          sgst_amount: totals.taxAmount / 2,
          total_amount: totals.total,
          created_by: user?.id,
          status: 'draft'
        })
        .select()
        .single();

      if (quotationError) throw quotationError;

      const itemsToInsert = items.map(item => ({
        quotation_id: quotation.id,
        product_id: item.product_id,
        product_name: item.product_name,
        hsn_code: item.hsn_code,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        cgst_rate: item.tax_rate / 2,
        sgst_rate: item.tax_rate / 2,
        tax_amount: item.tax_amount,
        total_amount: item.total_amount
      }));

      const { error: itemsError } = await supabase
        .from('quotation_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast.success('Quotation created successfully');
      setIsDialogOpen(false);
      setFormData({ customer_id: '', valid_until: '', notes: '' });
      setItems([]);
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create quotation');
    }
  };

  const filteredQuotations = quotations.filter(q =>
    q.quotation_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const colors: { [key: string]: string } = {
      draft: 'bg-gray-100 text-gray-700',
      sent: 'bg-blue-100 text-blue-700',
      accepted: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      expired: 'bg-orange-100 text-orange-700',
      converted: 'bg-purple-100 text-purple-700'
    };
    return <Badge className={colors[status] || 'bg-gray-100'}>{status}</Badge>;
  };

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Quotations</h1>
              <p className="text-muted-foreground">Create and manage quotations</p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> New Quotation</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Quotation</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Customer</Label>
                    <Select value={formData.customer_id} onValueChange={v => setFormData({ ...formData, customer_id: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Valid Until</Label>
                    <Input
                      type="date"
                      value={formData.valid_until}
                      onChange={e => setFormData({ ...formData, valid_until: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Add Product</Label>
                    <Select onValueChange={addItem}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name} - ₹{p.selling_price}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Card>
                  <CardContent className="p-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>HSN</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-center">Qty</TableHead>
                          <TableHead className="text-right">Tax</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.product_name}</TableCell>
                            <TableCell className="font-mono text-sm">{item.hsn_code || '-'}</TableCell>
                            <TableCell className="text-right">₹{item.unit_price}</TableCell>
                            <TableCell className="text-center">
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={e => updateItemQuantity(index, parseInt(e.target.value) || 1)}
                                className="w-20 text-center"
                              />
                            </TableCell>
                            <TableCell className="text-right">₹{item.tax_amount.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-medium">₹{item.total_amount.toFixed(2)}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={() => removeItem(index)}>×</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {items.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                              No items added
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <div className="flex justify-between items-end">
                  <div className="space-y-2 flex-1 mr-4">
                    <Label>Notes</Label>
                    <Input
                      value={formData.notes}
                      onChange={e => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Additional notes..."
                    />
                  </div>
                  <div className="text-right space-y-1">
                    <p>Subtotal: <span className="font-medium">₹{totals.subtotal.toFixed(2)}</span></p>
                    <p>Tax: <span className="font-medium">₹{totals.taxAmount.toFixed(2)}</span></p>
                    <p className="text-lg font-bold">Total: ₹{totals.total.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit">Create Quotation</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Total Quotations</p>
              <p className="text-2xl font-bold">{quotations.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Draft</p>
              <p className="text-2xl font-bold">{quotations.filter(q => q.status === 'draft').length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Accepted</p>
              <p className="text-2xl font-bold text-green-600">{quotations.filter(q => q.status === 'accepted').length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold">₹{quotations.reduce((s, q) => s + (q.total_amount || 0), 0).toLocaleString('en-IN')}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" /> Quotation List
              </CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search quotations..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quotation #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotations.map(quotation => (
                    <TableRow key={quotation.id}>
                      <TableCell className="font-mono">{quotation.quotation_number}</TableCell>
                      <TableCell>{quotation.customers?.name || '-'}</TableCell>
                      <TableCell>{new Date(quotation.quotation_date).toLocaleDateString('en-IN')}</TableCell>
                      <TableCell>{quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString('en-IN') : '-'}</TableCell>
                      <TableCell className="text-right font-medium">₹{quotation.total_amount?.toLocaleString('en-IN')}</TableCell>
                      <TableCell>{getStatusBadge(quotation.status)}</TableCell>
                    </TableRow>
                  ))}
                  {filteredQuotations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No quotations found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Quotations;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Download, FileJson, FileSpreadsheet, Receipt } from 'lucide-react';

interface SalesOrder {
  id: string;
  order_number: string;
  customer_name: string | null;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  created_at: string;
}

interface HSNSummary {
  hsn_code: string;
  description: string;
  quantity: number;
  taxable_value: number;
  cgst: number;
  sgst: number;
  igst: number;
  total_tax: number;
}

const GSTReports = () => {
  const navigate = useNavigate();
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [hsnSummary, setHsnSummary] = useState<HSNSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const loadData = async () => {
    setLoading(true);
    try {
      const startDate = `${selectedMonth}-01`;
      const endDate = new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + 1)).toISOString().split('T')[0];

      // Fetch sales orders for GSTR-1
      const { data: ordersData, error: ordersError } = await supabase
        .from('sales_orders')
        .select('*')
        .gte('created_at', startDate)
        .lt('created_at', endDate)
        .order('created_at');

      if (ordersError) throw ordersError;
      setSalesOrders(ordersData || []);

      // Fetch HSN summary
      const { data: itemsData, error: itemsError } = await supabase
        .from('sales_order_items')
        .select(`
          hsn_code:product_name,
          quantity,
          unit_price,
          tax_rate,
          tax_amount,
          total_amount,
          sales_orders!inner(created_at)
        `)
        .gte('sales_orders.created_at', startDate)
        .lt('sales_orders.created_at', endDate);

      if (itemsError) throw itemsError;

      // Process HSN summary
      const hsnMap: { [key: string]: HSNSummary } = {};
      (itemsData || []).forEach((item: any) => {
        const hsn = item.hsn_code || 'N/A';
        if (!hsnMap[hsn]) {
          hsnMap[hsn] = {
            hsn_code: hsn,
            description: item.hsn_code || 'Unknown',
            quantity: 0,
            taxable_value: 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
            total_tax: 0
          };
        }
        hsnMap[hsn].quantity += item.quantity || 0;
        hsnMap[hsn].taxable_value += (item.unit_price * item.quantity) || 0;
        const taxAmount = item.tax_amount || 0;
        hsnMap[hsn].cgst += taxAmount / 2;
        hsnMap[hsn].sgst += taxAmount / 2;
        hsnMap[hsn].total_tax += taxAmount;
      });

      setHsnSummary(Object.values(hsnMap));
    } catch (error: any) {
      toast.error('Failed to load GST data');
    } finally {
      setLoading(false);
    }
  };

  const totalSales = salesOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
  const totalTax = salesOrders.reduce((sum, o) => sum + (o.tax_amount || 0), 0);

  const exportGSTR1JSON = () => {
    const gstr1Data = {
      gstin: "YOUR_GSTIN",
      fp: selectedMonth.replace('-', ''),
      b2b: [],
      b2cs: salesOrders.map(order => ({
        sply_ty: "INTRA",
        pos: "27",
        typ: "OE",
        txval: order.subtotal,
        camt: order.tax_amount / 2,
        samt: order.tax_amount / 2,
        iamt: 0,
        csamt: 0
      })),
      hsn: {
        data: hsnSummary.map(h => ({
          hsn_sc: h.hsn_code,
          desc: h.description,
          qty: h.quantity,
          txval: h.taxable_value,
          camt: h.cgst,
          samt: h.sgst,
          iamt: h.igst
        }))
      }
    };

    const blob = new Blob([JSON.stringify(gstr1Data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GSTR1-${selectedMonth}.json`;
    a.click();
    toast.success('GSTR-1 JSON exported successfully');
  };

  const exportGSTR3B = () => {
    const gstr3bData = {
      gstin: "YOUR_GSTIN",
      ret_period: selectedMonth.replace('-', ''),
      "3.1": {
        "a": { txval: totalSales, camt: totalTax / 2, samt: totalTax / 2, iamt: 0 }
      }
    };

    const blob = new Blob([JSON.stringify(gstr3bData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GSTR3B-${selectedMonth}.json`;
    a.click();
    toast.success('GSTR-3B JSON exported successfully');
  };

  const exportHSNExcel = () => {
    const rows = hsnSummary.map(h => ({
      'HSN Code': h.hsn_code,
      'Description': h.description,
      'Quantity': h.quantity,
      'Taxable Value': h.taxable_value,
      'CGST': h.cgst,
      'SGST': h.sgst,
      'IGST': h.igst,
      'Total Tax': h.total_tax
    }));

    const csv = [
      Object.keys(rows[0] || {}).join(','),
      ...rows.map(r => Object.values(r).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HSN-Summary-${selectedMonth}.csv`;
    a.click();
    toast.success('HSN Summary exported successfully');
  };

  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date.toISOString().slice(0, 7);
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">GST Reports</h1>
              <p className="text-muted-foreground">GSTR-1, GSTR-3B, and HSN summary reports</p>
            </div>
          </div>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map(m => (
                <SelectItem key={m} value={m}>
                  {new Date(m + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Receipt className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Invoices</p>
                  <p className="text-2xl font-bold">{salesOrders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Receipt className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Taxable Value</p>
                  <p className="text-2xl font-bold">₹{totalSales.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Receipt className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total GST</p>
                  <p className="text-2xl font-bold">₹{totalTax.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Receipt className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">HSN Codes</p>
                  <p className="text-2xl font-bold">{hsnSummary.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="gstr1" className="space-y-4">
          <TabsList>
            <TabsTrigger value="gstr1">GSTR-1 (Sales)</TabsTrigger>
            <TabsTrigger value="gstr3b">GSTR-3B (Summary)</TabsTrigger>
            <TabsTrigger value="hsn">HSN Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="gstr1">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>GSTR-1 - Outward Supplies</CardTitle>
                  <Button onClick={exportGSTR1JSON}>
                    <FileJson className="h-4 w-4 mr-2" /> Export JSON
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice No.</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead className="text-right">Taxable Value</TableHead>
                        <TableHead className="text-right">CGST</TableHead>
                        <TableHead className="text-right">SGST</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesOrders.map(order => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono">{order.order_number}</TableCell>
                          <TableCell>{new Date(order.created_at).toLocaleDateString('en-IN')}</TableCell>
                          <TableCell>{order.customer_name || 'Walk-in'}</TableCell>
                          <TableCell className="text-right">₹{order.subtotal?.toLocaleString('en-IN')}</TableCell>
                          <TableCell className="text-right">₹{(order.tax_amount / 2)?.toLocaleString('en-IN')}</TableCell>
                          <TableCell className="text-right">₹{(order.tax_amount / 2)?.toLocaleString('en-IN')}</TableCell>
                          <TableCell className="text-right font-medium">₹{order.total_amount?.toLocaleString('en-IN')}</TableCell>
                        </TableRow>
                      ))}
                      {salesOrders.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No sales data for this period
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gstr3b">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>GSTR-3B - Monthly Summary</CardTitle>
                  <Button onClick={exportGSTR3B}>
                    <FileJson className="h-4 w-4 mr-2" /> Export JSON
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">3.1 - Details of Outward Supplies</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nature of Supplies</TableHead>
                          <TableHead className="text-right">Taxable Value</TableHead>
                          <TableHead className="text-right">CGST</TableHead>
                          <TableHead className="text-right">SGST</TableHead>
                          <TableHead className="text-right">IGST</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>(a) Outward taxable supplies (other than zero rated, nil rated and exempted)</TableCell>
                          <TableCell className="text-right">₹{totalSales.toLocaleString('en-IN')}</TableCell>
                          <TableCell className="text-right">₹{(totalTax / 2).toLocaleString('en-IN')}</TableCell>
                          <TableCell className="text-right">₹{(totalTax / 2).toLocaleString('en-IN')}</TableCell>
                          <TableCell className="text-right">₹0</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>(b) Outward taxable supplies (zero rated)</TableCell>
                          <TableCell className="text-right">₹0</TableCell>
                          <TableCell className="text-right">₹0</TableCell>
                          <TableCell className="text-right">₹0</TableCell>
                          <TableCell className="text-right">₹0</TableCell>
                        </TableRow>
                        <TableRow className="font-bold bg-muted">
                          <TableCell>Total</TableCell>
                          <TableCell className="text-right">₹{totalSales.toLocaleString('en-IN')}</TableCell>
                          <TableCell className="text-right">₹{(totalTax / 2).toLocaleString('en-IN')}</TableCell>
                          <TableCell className="text-right">₹{(totalTax / 2).toLocaleString('en-IN')}</TableCell>
                          <TableCell className="text-right">₹0</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hsn">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>HSN-wise Summary</CardTitle>
                  <Button onClick={exportHSNExcel}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" /> Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>HSN Code</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Taxable Value</TableHead>
                      <TableHead className="text-right">CGST</TableHead>
                      <TableHead className="text-right">SGST</TableHead>
                      <TableHead className="text-right">Total Tax</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hsnSummary.map((hsn, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono">{hsn.hsn_code}</TableCell>
                        <TableCell>{hsn.description}</TableCell>
                        <TableCell className="text-right">{hsn.quantity}</TableCell>
                        <TableCell className="text-right">₹{hsn.taxable_value?.toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right">₹{hsn.cgst?.toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right">₹{hsn.sgst?.toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right font-medium">₹{hsn.total_tax?.toLocaleString('en-IN')}</TableCell>
                      </TableRow>
                    ))}
                    {hsnSummary.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No HSN data for this period
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default GSTReports;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Download, TrendingUp, Package, DollarSign } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Analytics = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [profitData, setProfitData] = useState<any>({});
  const [abcAnalysis, setAbcAnalysis] = useState<any[]>([]);

  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      // Fetch products
      const { data: products } = await supabase.from('products').select('*');
      
      // Fetch sales transactions
      const { data: sales } = await supabase
        .from('sales_transactions')
        .select('*, products(name, category, cost_price)')
        .order('transaction_date', { ascending: true });

      if (sales && products) {
        // Sales trend data (last 30 days)
        const last30Days = Array.from({ length: 30 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (29 - i));
          return date.toISOString().split('T')[0];
        });

        const salesByDate = last30Days.map(date => {
          const daySales = sales.filter(s => s.transaction_date.startsWith(date));
          return {
            date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            revenue: Number(daySales.reduce((sum, s) => sum + parseFloat(s.total_amount.toString()), 0).toFixed(2)),
            transactions: daySales.length
          };
        });
        setSalesData(salesByDate);

        // Category analysis
        const categoryMap = new Map<string, { revenue: number, cost: number, units: number }>();
        sales.forEach(sale => {
          const category = sale.products?.category || 'Uncategorized';
          const current = categoryMap.get(category) || { revenue: 0, cost: 0, units: 0 };
          const cost = (sale.products?.cost_price || 0) * sale.quantity;
          categoryMap.set(category, {
            revenue: current.revenue + parseFloat(sale.total_amount.toString()),
            cost: current.cost + cost,
            units: current.units + sale.quantity
          });
        });

        const catData = Array.from(categoryMap.entries()).map(([name, data]) => ({
          name,
          revenue: data.revenue,
          profit: data.revenue - data.cost,
          units: data.units
        })).sort((a, b) => b.revenue - a.revenue);
        setCategoryData(catData);

        // Overall profit data
        const totalRevenue = sales.reduce((sum, s) => sum + parseFloat(s.total_amount.toString()), 0);
        const totalCost = sales.reduce((sum, s) => {
          const cost = (s.products?.cost_price || 0) * s.quantity;
          return sum + cost;
        }, 0);
        setProfitData({
          revenue: totalRevenue,
          cost: totalCost,
          profit: totalRevenue - totalCost,
          margin: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue * 100).toFixed(2) : 0
        });

        // ABC Analysis
        const productSales = new Map<string, { name: string, revenue: number, units: number }>();
        sales.forEach(sale => {
          const pid = sale.product_id;
          const current = productSales.get(pid) || { name: sale.products?.name || 'Unknown', revenue: 0, units: 0 };
          productSales.set(pid, {
            name: current.name,
            revenue: current.revenue + parseFloat(sale.total_amount.toString()),
            units: current.units + sale.quantity
          });
        });

        const sortedProducts = Array.from(productSales.values())
          .sort((a, b) => b.revenue - a.revenue);
        
        const totalRev = sortedProducts.reduce((sum, p) => sum + p.revenue, 0);
        let cumulative = 0;
        const abc = sortedProducts.map(p => {
          cumulative += p.revenue;
          const percentage = (cumulative / totalRev) * 100;
          let category = 'C';
          if (percentage <= 80) category = 'A';
          else if (percentage <= 95) category = 'B';
          
          return {
            name: p.name,
            revenue: p.revenue,
            units: p.units,
            category
          };
        });
        setAbcAnalysis(abc);
      }
    } catch (error: any) {
      toast({
        title: "Error Loading Analytics",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    const headers = Object.keys(data[0] || {});
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(h => row[h]).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: `${filename}.csv downloaded`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
                  <TrendingUp className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Analytics & Reports</h1>
                  <p className="text-xs text-muted-foreground">Business insights and data export</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">₹{profitData.revenue?.toLocaleString() || 0}</p>
                </div>
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Profit</p>
                  <p className="text-2xl font-bold text-success">₹{profitData.profit?.toLocaleString() || 0}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Profit Margin</p>
                  <p className="text-2xl font-bold">{profitData.margin}%</p>
                </div>
                <Package className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="sales" className="space-y-6">
          <TabsList>
            <TabsTrigger value="sales">Sales Trend</TabsTrigger>
            <TabsTrigger value="category">Category Analysis</TabsTrigger>
            <TabsTrigger value="abc">ABC Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="sales">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Sales Trend (Last 30 Days)</CardTitle>
                    <CardDescription>Daily revenue and transaction volume</CardDescription>
                  </div>
                  <Button onClick={() => exportToCSV(salesData, 'sales-trend')} size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={2} name="Revenue (₹)" />
                    <Line yAxisId="right" type="monotone" dataKey="transactions" stroke="#10B981" strokeWidth={2} name="Transactions" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="category">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Category Performance</CardTitle>
                    <CardDescription>Revenue and profit by product category</CardDescription>
                  </div>
                  <Button onClick={() => exportToCSV(categoryData, 'category-analysis')} size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#4F46E5" name="Revenue (₹)" />
                    <Bar dataKey="profit" fill="#10B981" name="Profit (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="abc">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>ABC Analysis</CardTitle>
                    <CardDescription>Product classification by revenue contribution</CardDescription>
                  </div>
                  <Button onClick={() => exportToCSV(abcAnalysis, 'abc-analysis')} size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {['A', 'B', 'C'].map((cat, idx) => {
                      const items = abcAnalysis.filter(p => p.category === cat);
                      return (
                        <Card key={cat}>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <p className="text-3xl font-bold" style={{ color: COLORS[idx] }}>
                                Category {cat}
                              </p>
                              <p className="text-sm text-muted-foreground mt-2">
                                {items.length} products
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {cat === 'A' && '~80% of revenue'}
                                {cat === 'B' && '~15% of revenue'}
                                {cat === 'C' && '~5% of revenue'}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  <div className="max-h-96 overflow-auto">
                    <table className="w-full">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="text-left p-2">Product</th>
                          <th className="text-right p-2">Revenue</th>
                          <th className="text-right p-2">Units Sold</th>
                          <th className="text-center p-2">Category</th>
                        </tr>
                      </thead>
                      <tbody>
                        {abcAnalysis.map((item, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="p-2">{item.name}</td>
                            <td className="text-right p-2">₹{item.revenue.toLocaleString()}</td>
                            <td className="text-right p-2">{item.units}</td>
                            <td className="text-center p-2">
                              <span
                                className="px-2 py-1 rounded-full text-xs font-bold"
                                style={{
                                  backgroundColor: COLORS[['A', 'B', 'C'].indexOf(item.category)] + '20',
                                  color: COLORS[['A', 'B', 'C'].indexOf(item.category)]
                                }}
                              >
                                {item.category}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Analytics;

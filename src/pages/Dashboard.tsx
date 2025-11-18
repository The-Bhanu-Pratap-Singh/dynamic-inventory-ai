import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, TrendingUp, AlertTriangle, DollarSign, Plus, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DashboardStats {
  totalProducts: number;
  lowStockCount: number;
  totalValue: number;
  profitMargin: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    lowStockCount: 0,
    totalValue: 0,
    profitMargin: 0,
  });
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkUser();
    loadStats();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    } else {
      setUser(session.user);
    }
  };

  const loadStats = async () => {
    try {
      const { data: products, error } = await supabase
        .from("products")
        .select("*");

      if (error) throw error;

      if (products) {
        const totalProducts = products.length;
        const lowStockCount = products.filter(
          (p) => p.current_stock <= p.reorder_level
        ).length;
        
        const totalValue = products.reduce(
          (sum, p) => sum + (p.selling_price || 0) * (p.current_stock || 0),
          0
        );
        
        const totalCost = products.reduce(
          (sum, p) => sum + (p.cost_price || 0) * (p.current_stock || 0),
          0
        );
        
        const profitMargin = totalValue > 0 
          ? ((totalValue - totalCost) / totalValue) * 100 
          : 0;

        setStats({
          totalProducts,
          lowStockCount,
          totalValue,
          profitMargin,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const kpiCards = [
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: Package,
      description: "Active inventory items",
      gradient: "gradient-primary",
    },
    {
      title: "Low Stock Alerts",
      value: stats.lowStockCount,
      icon: AlertTriangle,
      description: "Items need reorder",
      gradient: "bg-warning",
    },
    {
      title: "Inventory Value",
      value: `₹${stats.totalValue.toLocaleString()}`,
      icon: DollarSign,
      description: "Total stock value",
      gradient: "gradient-success",
    },
    {
      title: "Profit Margin",
      value: `${stats.profitMargin.toFixed(1)}%`,
      icon: TrendingUp,
      description: "Average margin",
      gradient: "gradient-primary",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">DPI</h1>
              <p className="text-xs text-muted-foreground">Dynamic Product Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate("/products/new")} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome back! Here's your inventory overview.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpiCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-all">
                <div className={`absolute inset-0 ${card.gradient} opacity-5`} />
                <CardHeader className="relative">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <div className="absolute right-4 top-4">
                    <div className={`h-12 w-12 rounded-lg ${card.gradient} flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold mb-1">{card.value}</div>
                  <p className="text-xs text-muted-foreground">{card.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Manage your inventory with AI assistance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => navigate("/products/new")}
              >
                <Plus className="h-6 w-6" />
                <span>Add New Product</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => navigate("/products")}
              >
                <Package className="h-6 w-6" />
                <span>View All Products</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
              >
                <TrendingUp className="h-6 w-6" />
                <span>AI Insights</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Package, TrendingUp, BarChart3, Zap, ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="h-20 w-20 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <Package className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            Dynamic Product Intelligence
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            AI-Powered Universal Inventory & Warehouse Management for Any Business Sector
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button 
              size="lg" 
              className="gap-2 text-lg px-8"
              onClick={() => navigate("/auth")}
            >
              Get Started
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8"
              onClick={() => navigate("/auth")}
            >
              Sign In
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
            <div className="p-6 rounded-xl bg-card border hover:shadow-lg transition-all">
              <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4 mx-auto">
                <TrendingUp className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold mb-2">AI-Powered Insights</h3>
              <p className="text-sm text-muted-foreground">
                Smart predictions for stock levels, demand forecasting, and reorder recommendations
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card border hover:shadow-lg transition-all">
              <div className="h-12 w-12 rounded-lg bg-gradient-success flex items-center justify-center mb-4 mx-auto">
                <BarChart3 className="h-6 w-6 text-success-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Universal Compatibility</h3>
              <p className="text-sm text-muted-foreground">
                Works with any business sector - retail, pharma, manufacturing, and more
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card border hover:shadow-lg transition-all">
              <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4 mx-auto">
                <Zap className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Real-Time Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Monitor inventory, warehouse operations, and billing in real-time
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

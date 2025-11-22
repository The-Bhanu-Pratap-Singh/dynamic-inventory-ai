import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Package, TrendingUp, RefreshCw, Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [forecast, setForecast] = useState<string>("");
  const [forecastLoading, setForecastLoading] = useState(false);

  useEffect(() => {
    // Prevent loading if id is not a valid UUID format or is a route keyword
    if (id && id !== 'new' && id.length === 36) {
      loadProduct();
    } else if (id === 'new') {
      // If someone navigated to /products/new, redirect to the correct route
      navigate('/products/new');
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      const { data: productData, error: prodError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (prodError) throw prodError;
      if (!productData) {
        toast({
          title: "Product Not Found",
          description: "The requested product does not exist.",
          variant: "destructive",
        });
        navigate('/products');
        return;
      }

      setProduct(productData);

      const { data: variantsData } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', id);

      setVariants(variantsData || []);
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

  const loadForecast = async () => {
    if (!id) return;
    
    setForecastLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-demand-forecast', {
        body: { productId: id }
      });

      if (error) throw error;
      setForecast(data.forecast);
    } catch (error: any) {
      toast({
        title: "Forecast Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setForecastLoading(false);
    }
  };

  const handleReorder = async () => {
    toast({
      title: "Reorder Initiated",
      description: "Purchase order has been created for this product.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!product) return null;

  const stockStatus = product.current_stock <= product.reorder_level ? 'critical' : 
                      product.current_stock <= product.reorder_level * 2 ? 'warning' : 'healthy';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/products")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">{product.name}</h1>
                <p className="text-xs text-muted-foreground">{product.sku || 'No SKU'}</p>
              </div>
            </div>
            <Button onClick={handleReorder} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Reorder Now
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Current Stock</p>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-2xl font-bold">{product.current_stock}</p>
                {stockStatus === 'critical' && <AlertTriangle className="h-5 w-5 text-destructive" />}
                {stockStatus === 'healthy' && <CheckCircle className="h-5 w-5 text-success" />}
              </div>
              <Badge variant={stockStatus === 'critical' ? 'destructive' : 'secondary'} className="mt-2">
                {stockStatus}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Selling Price</p>
              <p className="text-2xl font-bold">₹{product.selling_price?.toLocaleString() || '-'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Cost Price</p>
              <p className="text-2xl font-bold">₹{product.cost_price?.toLocaleString() || '-'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Profit Margin</p>
              <p className="text-2xl font-bold text-success">
                {product.selling_price && product.cost_price 
                  ? `${(((product.selling_price - product.cost_price) / product.selling_price) * 100).toFixed(1)}%`
                  : '-'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="variants">Variants</TabsTrigger>
            <TabsTrigger value="forecast">AI Forecast</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-medium">{product.category || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Business Sector</p>
                    <p className="font-medium">{product.sector || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">HSN Code</p>
                    <p className="font-medium">{product.hsn_code || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tax Rate</p>
                    <p className="font-medium">{product.tax_rate ? `${product.tax_rate}%` : '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Reorder Level</p>
                    <p className="font-medium">{product.reorder_level}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">{new Date(product.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                {product.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="mt-2">{product.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="variants">
            <Card>
              <CardHeader>
                <CardTitle>Product Variants</CardTitle>
                <CardDescription>Different variations of this product</CardDescription>
              </CardHeader>
              <CardContent>
                {variants.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No variants available for this product</p>
                ) : (
                  <div className="space-y-3">
                    {variants.map((variant) => (
                      <div key={variant.id} className="border rounded-lg p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{variant.variant_name}: {variant.variant_value}</p>
                          {variant.sku && <p className="text-sm text-muted-foreground">SKU: {variant.sku}</p>}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">Stock: {variant.stock || 0}</p>
                          {variant.price_adjustment && (
                            <p className="text-sm text-muted-foreground">
                              +₹{variant.price_adjustment}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="forecast">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>AI Demand Forecast</CardTitle>
                    <CardDescription>Predictive analysis and reorder recommendations</CardDescription>
                  </div>
                  <Button onClick={loadForecast} disabled={forecastLoading}>
                    {forecastLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Generate Forecast
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {forecast ? (
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                    {forecast}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Click "Generate Forecast" to get AI-powered demand predictions
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ProductDetail;

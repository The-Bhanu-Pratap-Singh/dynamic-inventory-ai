import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Package, Loader2, Sparkles, TrendingUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const NewProduct = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState<'description' | 'price' | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    sector: "",
    description: "",
    hsn_code: "",
    cost_price: "",
    selling_price: "",
    current_stock: "",
    reorder_level: "10",
    tax_rate: "18",
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAIGenerateDescription = async () => {
    if (!formData.name || !formData.category) {
      toast({
        title: "Missing Information",
        description: "Please enter product name and category first",
        variant: "destructive",
      });
      return;
    }

    setAiLoading('description');
    try {
      const { data, error } = await supabase.functions.invoke('ai-product-assist', {
        body: {
          action: 'generate_description',
          productName: formData.name,
          category: formData.category,
          sector: formData.sector,
        },
      });

      if (error) throw error;

      if (data?.result) {
        handleChange('description', data.result);
        toast({
          title: "Success",
          description: "AI-generated description added",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAiLoading(null);
    }
  };

  const handleAIEstimatePrice = async () => {
    if (!formData.name || !formData.cost_price) {
      toast({
        title: "Missing Information",
        description: "Please enter product name and cost price first",
        variant: "destructive",
      });
      return;
    }

    setAiLoading('price');
    try {
      const { data, error } = await supabase.functions.invoke('ai-product-assist', {
        body: {
          action: 'estimate_price',
          productName: formData.name,
          category: formData.category,
          sector: formData.sector,
          costPrice: parseFloat(formData.cost_price),
        },
      });

      if (error) throw error;

      if (data?.result) {
        handleChange('selling_price', data.result);
        toast({
          title: "Success",
          description: "AI-estimated price added",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAiLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast({
        title: "Validation Error",
        description: "Product name is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("products").insert({
        name: formData.name,
        sku: formData.sku || null,
        category: formData.category || null,
        sector: formData.sector || null,
        description: formData.description || null,
        hsn_code: formData.hsn_code || null,
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
        selling_price: formData.selling_price ? parseFloat(formData.selling_price) : null,
        current_stock: formData.current_stock ? parseInt(formData.current_stock) : 0,
        reorder_level: formData.reorder_level ? parseInt(formData.reorder_level) : 10,
        tax_rate: formData.tax_rate ? parseFloat(formData.tax_rate) : 18,
        created_by: user?.id || null,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product added successfully",
      });
      
      navigate("/products");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/products")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
                <Package className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Add New Product</h1>
                <p className="text-xs text-muted-foreground">Create a new product entry</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Enter the basic product details</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Enter product name"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => handleChange('sku', e.target.value)}
                      placeholder="Product SKU"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="hsn_code">HSN Code</Label>
                    <Input
                      id="hsn_code"
                      value={formData.hsn_code}
                      onChange={(e) => handleChange('hsn_code', e.target.value)}
                      placeholder="HSN Code"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => handleChange('category', e.target.value)}
                      placeholder="e.g., Electronics"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="sector">Sector</Label>
                    <Select value={formData.sector} onValueChange={(value) => handleChange('sector', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sector" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="wholesale">Wholesale</SelectItem>
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="services">Services</SelectItem>
                        <SelectItem value="food">Food & Beverage</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <div className="flex gap-2">
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      placeholder="Product description"
                      rows={3}
                      className="flex-1"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAIGenerateDescription}
                    disabled={aiLoading === 'description'}
                    className="w-fit gap-2"
                  >
                    {aiLoading === 'description' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    AI Generate Description
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing & Tax</CardTitle>
                <CardDescription>Set pricing and tax information</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="cost_price">Cost Price (₹)</Label>
                    <Input
                      id="cost_price"
                      type="number"
                      step="0.01"
                      value={formData.cost_price}
                      onChange={(e) => handleChange('cost_price', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="selling_price">Selling Price (₹)</Label>
                    <Input
                      id="selling_price"
                      type="number"
                      step="0.01"
                      value={formData.selling_price}
                      onChange={(e) => handleChange('selling_price', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAIEstimatePrice}
                  disabled={aiLoading === 'price'}
                  className="w-fit gap-2"
                >
                  {aiLoading === 'price' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <TrendingUp className="h-4 w-4" />
                  )}
                  AI Estimate Price
                </Button>

                <div className="grid gap-2">
                  <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                  <Input
                    id="tax_rate"
                    type="number"
                    step="0.01"
                    value={formData.tax_rate}
                    onChange={(e) => handleChange('tax_rate', e.target.value)}
                    placeholder="18"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Stock Information */}
            <Card>
              <CardHeader>
                <CardTitle>Stock Information</CardTitle>
                <CardDescription>Manage inventory levels</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="current_stock">Current Stock</Label>
                    <Input
                      id="current_stock"
                      type="number"
                      value={formData.current_stock}
                      onChange={(e) => handleChange('current_stock', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="reorder_level">Reorder Level</Label>
                    <Input
                      id="reorder_level"
                      type="number"
                      value={formData.reorder_level}
                      onChange={(e) => handleChange('reorder_level', e.target.value)}
                      placeholder="10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/products")}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Product"
                )}
              </Button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default NewProduct;

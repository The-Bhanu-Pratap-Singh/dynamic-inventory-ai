import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Sparkles, Wand2, TrendingUp } from "lucide-react";

const NewProduct = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    description: "",
    costPrice: "",
    sellingPrice: "",
    currentStock: "",
    reorderLevel: "",
    hsnCode: "",
    taxRate: "",
    sector: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAIAssist = async (action: 'generate_description' | 'estimate_price') => {
    if (!formData.name) {
      toast({
        title: "Missing Information",
        description: "Please enter a product name first.",
        variant: "destructive",
      });
      return;
    }

    if (action === 'estimate_price' && !formData.costPrice) {
      toast({
        title: "Missing Information",
        description: "Please enter cost price first.",
        variant: "destructive",
      });
      return;
    }

    setAiLoading(action);

    try {
      const { data, error } = await supabase.functions.invoke('ai-product-assist', {
        body: {
          action,
          productName: formData.name,
          category: formData.category,
          sector: formData.sector,
          costPrice: formData.costPrice,
        }
      });

      if (error) throw error;

      if (action === 'generate_description') {
        handleChange('description', data.result);
        toast({
          title: "AI Generated",
          description: "Product description generated successfully!",
        });
      } else if (action === 'estimate_price') {
        const priceMatch = data.result.match(/[\d,]+\.?\d*/);
        if (priceMatch) {
          const price = priceMatch[0].replace(/,/g, '');
          handleChange('sellingPrice', price);
          toast({
            title: "AI Estimated",
            description: "Selling price estimated successfully!",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "AI Assist Failed",
        description: error.message || "Failed to get AI assistance",
        variant: "destructive",
      });
    } finally {
      setAiLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("You must be logged in to add products");
      }

      const { error } = await supabase.from("products").insert([
        {
          name: formData.name,
          sku: formData.sku || null,
          category: formData.category || null,
          description: formData.description || null,
          cost_price: formData.costPrice ? parseFloat(formData.costPrice) : null,
          selling_price: formData.sellingPrice ? parseFloat(formData.sellingPrice) : null,
          current_stock: formData.currentStock ? parseInt(formData.currentStock) : 0,
          reorder_level: formData.reorderLevel ? parseInt(formData.reorderLevel) : 10,
          hsn_code: formData.hsnCode || null,
          tax_rate: formData.taxRate ? parseFloat(formData.taxRate) : null,
          sector: formData.sector || null,
          created_by: user.id,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product added successfully!",
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
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/products")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Add New Product</h1>
              <p className="text-xs text-muted-foreground">Create a new inventory item</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <CardTitle>Product Information</CardTitle>
                <CardDescription>Fill in the details below</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => handleChange("sku", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => handleChange("category", e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sector">Business Sector</Label>
                    <Select value={formData.sector} onValueChange={(val) => handleChange("sector", val)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sector" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="pharma">Pharmaceutical</SelectItem>
                        <SelectItem value="electronics">Electronics</SelectItem>
                        <SelectItem value="apparel">Apparel</SelectItem>
                        <SelectItem value="food">Food & Beverage</SelectItem>
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="automotive">Automotive</SelectItem>
                        <SelectItem value="ecommerce">eCommerce</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="description">Description</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAIAssist('generate_description')}
                      disabled={aiLoading === 'generate_description'}
                    >
                      {aiLoading === 'generate_description' ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="mr-2 h-3 w-3" />
                          AI Suggest
                        </>
                      )}
                    </Button>
                  </div>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground">Pricing</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="costPrice">Cost Price (₹)</Label>
                    <Input
                      id="costPrice"
                      type="number"
                      step="0.01"
                      value={formData.costPrice}
                      onChange={(e) => handleChange("costPrice", e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sellingPrice">Selling Price (₹)</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAIAssist('estimate_price')}
                        disabled={aiLoading === 'estimate_price'}
                      >
                        {aiLoading === 'estimate_price' ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            Estimating...
                          </>
                        ) : (
                          <>
                            <TrendingUp className="mr-2 h-3 w-3" />
                            AI Estimate
                          </>
                        )}
                      </Button>
                    </div>
                    <Input
                      id="sellingPrice"
                      type="number"
                      step="0.01"
                      value={formData.sellingPrice}
                      onChange={(e) => handleChange("sellingPrice", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Stock & Tax */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground">Stock & Tax</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentStock">Current Stock</Label>
                    <Input
                      id="currentStock"
                      type="number"
                      value={formData.currentStock}
                      onChange={(e) => handleChange("currentStock", e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reorderLevel">Reorder Level</Label>
                    <Input
                      id="reorderLevel"
                      type="number"
                      value={formData.reorderLevel}
                      onChange={(e) => handleChange("reorderLevel", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hsnCode">HSN Code</Label>
                    <Input
                      id="hsnCode"
                      value={formData.hsnCode}
                      onChange={(e) => handleChange("hsnCode", e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      step="0.01"
                      value={formData.taxRate}
                      onChange={(e) => handleChange("taxRate", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/products")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Product
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default NewProduct;

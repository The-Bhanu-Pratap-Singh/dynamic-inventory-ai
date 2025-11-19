import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Search, Plus, Minus, Trash2, ShoppingCart, Loader2, Sparkles } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

const POS = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState({ name: "", phone: "" });
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discount, setDiscount] = useState(0);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (cart.length > 0) {
      loadAISuggestions();
    }
  }, [cart]);

  const loadProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('name');
    setProducts(data || []);
  };

  const loadAISuggestions = async () => {
    if (cart.length === 0) return;
    
    setSuggestionsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-billing-suggestions', {
        body: { cartItems: cart.map(item => ({ productId: item.productId })) }
      });

      if (error) throw error;
      setAiSuggestions(data.suggestions || []);
    } catch (error: any) {
      console.error('AI suggestions error:', error);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.selling_price || 0,
        taxRate: product.tax_rate || 0
      }]);
    }
  };

  const updateQuantity = (productId: string, change: number) => {
    setCart(cart.map(item =>
      item.productId === productId
        ? { ...item, quantity: Math.max(1, item.quantity + change) }
        : item
    ).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const taxAmount = cart.reduce((sum, item) => {
      const itemTotal = item.unitPrice * item.quantity;
      return sum + (itemTotal * (item.taxRate / 100));
    }, 0);
    const discountAmount = (subtotal * discount) / 100;
    const total = subtotal + taxAmount - discountAmount;

    return { subtotal, taxAmount, discountAmount, total };
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Add items to cart before checkout",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const totals = calculateTotals();
      const orderNumber = `ORD-${Date.now()}`;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('sales_orders')
        .insert({
          order_number: orderNumber,
          customer_name: customer.name || null,
          customer_phone: customer.phone || null,
          subtotal: totals.subtotal,
          tax_amount: totals.taxAmount,
          discount: totals.discountAmount,
          total_amount: totals.total,
          payment_method: paymentMethod,
          created_by: user.id
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items and sales transactions
      for (const item of cart) {
        await supabase.from('sales_order_items').insert({
          order_id: order.id,
          product_id: item.productId,
          product_name: item.productName,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          tax_rate: item.taxRate,
          tax_amount: (item.unitPrice * item.quantity * item.taxRate) / 100,
          total_amount: item.unitPrice * item.quantity
        });

        await supabase.from('sales_transactions').insert({
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_amount: item.unitPrice * item.quantity,
          created_by: user.id
        });

        // Update product stock
        const { data: currentProduct } = await supabase
          .from('products')
          .select('current_stock')
          .eq('id', item.productId)
          .single();

        if (currentProduct) {
          await supabase
            .from('products')
            .update({ current_stock: currentProduct.current_stock - item.quantity })
            .eq('id', item.productId);
        }
      }

      toast({
        title: "Order Completed",
        description: `Order ${orderNumber} has been created successfully`,
      });

      // Reset
      setCart([]);
      setCustomer({ name: "", phone: "" });
      setDiscount(0);
      setAiSuggestions([]);
    } catch (error: any) {
      toast({
        title: "Checkout Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
                <ShoppingCart className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Point of Sale</h1>
                <p className="text-xs text-muted-foreground">Create new sales order</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => addToCart(product)}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.category}</p>
                          <p className="text-lg font-bold mt-2">₹{product.selling_price?.toLocaleString()}</p>
                        </div>
                        <Badge variant={product.current_stock > product.reorder_level ? "secondary" : "destructive"}>
                          Stock: {product.current_stock}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            {/* AI Suggestions */}
            {aiSuggestions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {aiSuggestions.map((suggestion, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{suggestion.productName}</p>
                          <p className="text-xs text-muted-foreground">{suggestion.reason}</p>
                          <Badge variant="outline" className="mt-1">{suggestion.type}</Badge>
                        </div>
                        <Button size="sm" onClick={() => {
                          const product = products.find(p => p.id === suggestion.productId);
                          if (product) addToCart(product);
                        }}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Cart Section */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cart ({cart.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  {cart.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Cart is empty</p>
                  ) : (
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <div key={item.productId} className="flex items-center justify-between border-b pb-3">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.productName}</p>
                            <p className="text-xs text-muted-foreground">₹{item.unitPrice} × {item.quantity}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="icon" variant="outline" onClick={() => updateQuantity(item.productId, -1)}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button size="icon" variant="outline" onClick={() => updateQuantity(item.productId, 1)}>
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="destructive" onClick={() => removeFromCart(item.productId)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="customerName">Name (Optional)</Label>
                  <Input
                    id="customerName"
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">Phone (Optional)</Label>
                  <Input
                    id="customerPhone"
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="payment">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="wallet">Wallet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="discount">Discount (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                  />
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>₹{totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax:</span>
                    <span>₹{totals.taxAmount.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-success">
                      <span>Discount:</span>
                      <span>-₹{totals.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total:</span>
                    <span>₹{totals.total.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={loading || cart.length === 0}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Complete Order"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default POS;

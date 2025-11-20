import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Search, Plus, Minus, Trash2, ShoppingCart, Loader2, Sparkles, ScanLine, Download, Mail } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import Scanner from "@/components/Scanner";
import { downloadInvoice, getInvoiceBase64 } from "@/lib/invoiceGenerator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  const [showScanner, setShowScanner] = useState(false);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [invoiceEmail, setInvoiceEmail] = useState("");
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('name');
    setProducts(data || []);
  };

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
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

  const handleScanResult = async (code: string) => {
    try {
      const { data: product, error } = await supabase.from('products').select('*').eq('sku', code).single();
      if (error || !product) {
        toast({ title: "Product Not Found", variant: "destructive" });
        return;
      }
      addToCart(product);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const updateQuantity = (productId: string, change: number) => {
    setCart(cart.map(item =>
      item.productId === productId ? { ...item, quantity: Math.max(1, item.quantity + change) } : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const taxAmount = cart.reduce((sum, item) => sum + ((item.unitPrice * item.quantity) * (item.taxRate / 100)), 0);
    const discountAmount = (subtotal * discount) / 100;
    return { subtotal, taxAmount, discountAmount, total: subtotal + taxAmount - discountAmount };
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const totals = calculateTotals();
      const { data: orderData, error } = await supabase.from('sales_orders').insert({
        order_number: `ORD-${Date.now()}`,
        customer_name: customer.name || null,
        customer_phone: customer.phone || null,
        subtotal: totals.subtotal,
        tax_amount: totals.taxAmount,
        discount: totals.discountAmount,
        total_amount: totals.total,
        payment_method: paymentMethod,
        created_by: user.id,
      }).select().single();

      if (error) throw error;

      await supabase.from('sales_order_items').insert(cart.map(item => ({
        order_id: orderData.id,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        tax_rate: item.taxRate,
        tax_amount: (item.unitPrice * item.quantity * item.taxRate) / 100,
        total_amount: item.unitPrice * item.quantity,
      })));

      for (const item of cart) {
        const { data: product } = await supabase.from('products').select('current_stock').eq('id', item.productId).single();
        if (product) {
          await supabase.from('products').update({ current_stock: product.current_stock - item.quantity }).eq('id', item.productId);
        }
      }

      setLastOrderId(orderData.id);
      setCart([]);
      setCustomer({ name: "", phone: "" });
      setDiscount(0);
      setShowInvoiceDialog(true);
      toast({ title: "Success", description: "Order completed" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}><ArrowLeft className="h-5 w-5" /></Button>
            <Button variant="outline" size="icon" onClick={() => setShowScanner(true)}><ScanLine className="h-5 w-5" /></Button>
          </div>
          <h1 className="text-xl font-bold">Point of Sale</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Input placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="mb-4" />
            <ScrollArea className="h-[600px]">
              <div className="grid md:grid-cols-2 gap-4">
                {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map((product) => (
                  <Card key={product.id} onClick={() => addToCart(product)} className="cursor-pointer">
                    <CardContent className="p-4">
                      <h3 className="font-semibold">{product.name}</h3>
                      <div className="flex justify-between mt-2">
                        <span>₹{product.selling_price}</span>
                        <Badge>{product.current_stock} in stock</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
          <Card>
            <CardHeader><CardTitle>Cart</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <ScrollArea className="h-[300px]">
                {cart.map((item) => (
                  <div key={item.productId} className="flex items-center gap-2 p-2 border rounded mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.productName}</p>
                      <p className="text-xs">₹{item.unitPrice} × {item.quantity}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.productId, -1)}><Minus className="h-3 w-3" /></Button>
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.productId, 1)}><Plus className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeFromCart(item.productId)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                ))}
              </ScrollArea>
              <div className="space-y-2 border-t pt-4">
                <Input placeholder="Customer name" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
                <Input placeholder="Phone" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="number" placeholder="Discount %" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
                <div className="text-lg font-bold">Total: ₹{totals.total.toFixed(2)}</div>
                <Button onClick={handleCheckout} disabled={loading || cart.length === 0} className="w-full">
                  {loading ? <Loader2 className="animate-spin" /> : "Complete Order"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Scanner isOpen={showScanner} onClose={() => setShowScanner(false)} onScan={handleScanResult} />
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Order Completed</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <Button onClick={() => lastOrderId && downloadInvoice({ orderNumber: `ORD-${lastOrderId}`, items: [], subtotal: 0, taxAmount: 0, discount: 0, totalAmount: totals.total, date: new Date().toISOString() })} className="w-full">
              <Download className="h-4 w-4 mr-2" />Download PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default POS;

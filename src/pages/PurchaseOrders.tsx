import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, ShoppingCart, Search, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface POItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
}

const PurchaseOrders = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    vendor_id: "",
    expected_delivery: "",
    notes: "",
  });

  const [items, setItems] = useState<POItem[]>([{ product_id: "", product_name: "", quantity: 1, unit_price: 0, tax_rate: 0 }]);

  const { data: purchaseOrders, isLoading } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("*, vendors(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: vendors } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vendors").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*");
      if (error) throw error;
      return data;
    },
  });

  const createPO = useMutation({
    mutationFn: async () => {
      const validItems = items.filter((i) => i.product_id && i.quantity > 0);
      if (validItems.length === 0) throw new Error("Add at least one item");

      const subtotal = validItems.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
      const taxAmount = validItems.reduce((sum, i) => sum + (i.quantity * i.unit_price * i.tax_rate) / 100, 0);

      const { data: po, error: poError } = await supabase
        .from("purchase_orders")
        .insert({
          po_number: `PO-${Date.now()}`,
          vendor_id: formData.vendor_id || null,
          expected_delivery: formData.expected_delivery || null,
          notes: formData.notes,
          subtotal,
          cgst_amount: taxAmount / 2,
          sgst_amount: taxAmount / 2,
          total_amount: subtotal + taxAmount,
        })
        .select()
        .single();

      if (poError) throw poError;

      const itemsToInsert = validItems.map((item) => ({
        po_id: po.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        tax_amount: (item.quantity * item.unit_price * item.tax_rate) / 100,
        total_amount: item.quantity * item.unit_price * (1 + item.tax_rate / 100),
      }));

      const { error: itemsError } = await supabase.from("purchase_order_items").insert(itemsToInsert);
      if (itemsError) throw itemsError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      setIsDialogOpen(false);
      setFormData({ vendor_id: "", expected_delivery: "", notes: "" });
      setItems([{ product_id: "", product_name: "", quantity: 1, unit_price: 0, tax_rate: 0 }]);
      toast({ title: "Success", description: "Purchase order created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to create purchase order", variant: "destructive" });
    },
  });

  const updateItem = (index: number, field: keyof POItem, value: string | number) => {
    const newItems = [...items];
    if (field === "product_id") {
      const product = products?.find((p) => p.id === value);
      newItems[index] = {
        ...newItems[index],
        product_id: value as string,
        product_name: product?.name || "",
        unit_price: product?.cost_price || 0,
        tax_rate: product?.tax_rate || 0,
      };
    } else {
      (newItems[index] as any)[field] = value;
    }
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { product_id: "", product_name: "", quantity: 1, unit_price: 0, tax_rate: 0 }]);
  const removeItem = (index: number) => items.length > 1 && setItems(items.filter((_, i) => i !== index));

  const filteredPOs = purchaseOrders?.filter(
    (po) => po.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.vendors?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Purchase Orders</h1>
            <p className="text-muted-foreground">Manage vendor bills and incoming stock</p>
          </div>
        </div>

        <div className="flex justify-between items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Search orders..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />New Purchase Order</Button></DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create Purchase Order</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Vendor</Label>
                    <Select value={formData.vendor_id} onValueChange={(v) => setFormData({ ...formData, vendor_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                      <SelectContent>
                        {vendors?.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Expected Delivery</Label>
                    <Input type="date" value={formData.expected_delivery} onChange={(e) => setFormData({ ...formData, expected_delivery: e.target.value })} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>Items</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="h-4 w-4 mr-1" />Add Item</Button>
                  </div>
                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-4">
                          <Select value={item.product_id} onValueChange={(v) => updateItem(index, "product_id", v)}>
                            <SelectTrigger><SelectValue placeholder="Product" /></SelectTrigger>
                            <SelectContent>
                              {products?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 0)} />
                        </div>
                        <div className="col-span-2">
                          <Input type="number" placeholder="Price" value={item.unit_price} onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="col-span-2">
                          <Input type="number" placeholder="Tax %" value={item.tax_rate} onChange={(e) => updateItem(index, "tax_rate", parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="col-span-2">
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)} disabled={items.length === 1}>Remove</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div><Label>Notes</Label><Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} /></div>

                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex justify-between"><span>Subtotal:</span><span>₹{items.reduce((s, i) => s + i.quantity * i.unit_price, 0).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Tax:</span><span>₹{items.reduce((s, i) => s + (i.quantity * i.unit_price * i.tax_rate) / 100, 0).toLocaleString()}</span></div>
                  <div className="flex justify-between font-bold"><span>Total:</span><span>₹{items.reduce((s, i) => s + i.quantity * i.unit_price * (1 + i.tax_rate / 100), 0).toLocaleString()}</span></div>
                </div>

                <Button className="w-full" onClick={() => createPO.mutate()} disabled={createPO.isPending}>
                  {createPO.isPending ? "Creating..." : "Create Purchase Order"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" />All Purchase Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Expected Delivery</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPOs?.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium">{po.po_number}</TableCell>
                      <TableCell>{format(new Date(po.po_date), "dd/MM/yyyy")}</TableCell>
                      <TableCell>{po.vendors?.name || "-"}</TableCell>
                      <TableCell>{po.expected_delivery ? format(new Date(po.expected_delivery), "dd/MM/yyyy") : "-"}</TableCell>
                      <TableCell className="text-right">₹{po.total_amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          po.status === "received" ? "bg-green-100 text-green-800" :
                          po.status === "partial" ? "bg-blue-100 text-blue-800" :
                          po.status === "approved" ? "bg-purple-100 text-purple-800" :
                          "bg-yellow-100 text-yellow-800"
                        }`}>{po.status}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!filteredPOs || filteredPOs.length === 0) && (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No purchase orders found</TableCell></TableRow>
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

export default PurchaseOrders;

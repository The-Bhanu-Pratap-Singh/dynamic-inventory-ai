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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Wallet, Search, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

const PaymentVouchers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [receiptForm, setReceiptForm] = useState({
    party_type: "customer",
    party_id: "",
    amount: "",
    payment_method: "cash",
    reference_number: "",
    bank_account: "",
    notes: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    party_type: "vendor",
    party_id: "",
    amount: "",
    payment_method: "cash",
    reference_number: "",
    bank_account: "",
    notes: "",
  });

  const { data: payments, isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payments").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*");
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

  const createReceipt = useMutation({
    mutationFn: async (data: typeof receiptForm) => {
      const { error } = await supabase.from("payments").insert({
        payment_number: `REC-${Date.now()}`,
        payment_type: "receipt",
        party_type: data.party_type,
        party_id: data.party_id || null,
        amount: parseFloat(data.amount) || 0,
        payment_method: data.payment_method,
        reference_number: data.reference_number,
        bank_account: data.bank_account,
        notes: data.notes,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      setIsReceiptDialogOpen(false);
      setReceiptForm({ party_type: "customer", party_id: "", amount: "", payment_method: "cash", reference_number: "", bank_account: "", notes: "" });
      toast({ title: "Success", description: "Receipt created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create receipt", variant: "destructive" });
    },
  });

  const createPayment = useMutation({
    mutationFn: async (data: typeof paymentForm) => {
      const { error } = await supabase.from("payments").insert({
        payment_number: `PAY-${Date.now()}`,
        payment_type: "payment",
        party_type: data.party_type,
        party_id: data.party_id || null,
        amount: parseFloat(data.amount) || 0,
        payment_method: data.payment_method,
        reference_number: data.reference_number,
        bank_account: data.bank_account,
        notes: data.notes,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      setIsPaymentDialogOpen(false);
      setPaymentForm({ party_type: "vendor", party_id: "", amount: "", payment_method: "cash", reference_number: "", bank_account: "", notes: "" });
      toast({ title: "Success", description: "Payment voucher created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create payment voucher", variant: "destructive" });
    },
  });

  const receipts = payments?.filter((p) => p.payment_type === "receipt");
  const paymentVouchers = payments?.filter((p) => p.payment_type === "payment");

  const getPartyName = (partyType: string, partyId: string | null) => {
    if (!partyId) return "-";
    if (partyType === "customer") return customers?.find((c) => c.id === partyId)?.name || "-";
    if (partyType === "vendor") return vendors?.find((v) => v.id === partyId)?.name || "-";
    return "-";
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Payment Vouchers & Receipts</h1>
            <p className="text-muted-foreground">Record cash and bank transactions</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Search transactions..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>

        <Tabs defaultValue="receipts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="receipts" className="flex items-center gap-2"><ArrowDownLeft className="h-4 w-4" />Receipts</TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2"><ArrowUpRight className="h-4 w-4" />Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="receipts">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5" />Payment Receipts</CardTitle>
                <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
                  <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />New Receipt</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Create Payment Receipt</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Party Type</Label>
                        <Select value={receiptForm.party_type} onValueChange={(v) => setReceiptForm({ ...receiptForm, party_type: v, party_id: "" })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="customer">Customer</SelectItem>
                            <SelectItem value="vendor">Vendor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>{receiptForm.party_type === "customer" ? "Customer" : "Vendor"}</Label>
                        <Select value={receiptForm.party_id} onValueChange={(v) => setReceiptForm({ ...receiptForm, party_id: v })}>
                          <SelectTrigger><SelectValue placeholder="Select party" /></SelectTrigger>
                          <SelectContent>
                            {receiptForm.party_type === "customer"
                              ? customers?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)
                              : vendors?.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><Label>Amount</Label><Input type="number" value={receiptForm.amount} onChange={(e) => setReceiptForm({ ...receiptForm, amount: e.target.value })} /></div>
                        <div>
                          <Label>Payment Method</Label>
                          <Select value={receiptForm.payment_method} onValueChange={(v) => setReceiptForm({ ...receiptForm, payment_method: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="bank">Bank Transfer</SelectItem>
                              <SelectItem value="upi">UPI</SelectItem>
                              <SelectItem value="cheque">Cheque</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><Label>Reference No.</Label><Input value={receiptForm.reference_number} onChange={(e) => setReceiptForm({ ...receiptForm, reference_number: e.target.value })} /></div>
                        <div><Label>Bank Account</Label><Input value={receiptForm.bank_account} onChange={(e) => setReceiptForm({ ...receiptForm, bank_account: e.target.value })} /></div>
                      </div>
                      <div><Label>Notes</Label><Textarea value={receiptForm.notes} onChange={(e) => setReceiptForm({ ...receiptForm, notes: e.target.value })} /></div>
                      <Button className="w-full" onClick={() => createReceipt.mutate(receiptForm)} disabled={createReceipt.isPending}>
                        {createReceipt.isPending ? "Creating..." : "Create Receipt"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt No.</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Party</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receipts?.filter((r) => r.payment_number.toLowerCase().includes(searchTerm.toLowerCase())).map((receipt) => (
                      <TableRow key={receipt.id}>
                        <TableCell className="font-medium">{receipt.payment_number}</TableCell>
                        <TableCell>{format(new Date(receipt.payment_date), "dd/MM/yyyy")}</TableCell>
                        <TableCell>{getPartyName(receipt.party_type, receipt.party_id)}</TableCell>
                        <TableCell className="capitalize">{receipt.payment_method}</TableCell>
                        <TableCell className="text-right text-green-600">+₹{receipt.amount.toLocaleString()}</TableCell>
                        <TableCell><span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">{receipt.status}</span></TableCell>
                      </TableRow>
                    ))}
                    {(!receipts || receipts.length === 0) && (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No receipts found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5" />Payment Vouchers</CardTitle>
                <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                  <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />New Payment</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Create Payment Voucher</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Party Type</Label>
                        <Select value={paymentForm.party_type} onValueChange={(v) => setPaymentForm({ ...paymentForm, party_type: v, party_id: "" })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="vendor">Vendor</SelectItem>
                            <SelectItem value="customer">Customer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>{paymentForm.party_type === "vendor" ? "Vendor" : "Customer"}</Label>
                        <Select value={paymentForm.party_id} onValueChange={(v) => setPaymentForm({ ...paymentForm, party_id: v })}>
                          <SelectTrigger><SelectValue placeholder="Select party" /></SelectTrigger>
                          <SelectContent>
                            {paymentForm.party_type === "vendor"
                              ? vendors?.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)
                              : customers?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><Label>Amount</Label><Input type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} /></div>
                        <div>
                          <Label>Payment Method</Label>
                          <Select value={paymentForm.payment_method} onValueChange={(v) => setPaymentForm({ ...paymentForm, payment_method: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="bank">Bank Transfer</SelectItem>
                              <SelectItem value="upi">UPI</SelectItem>
                              <SelectItem value="cheque">Cheque</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><Label>Reference No.</Label><Input value={paymentForm.reference_number} onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })} /></div>
                        <div><Label>Bank Account</Label><Input value={paymentForm.bank_account} onChange={(e) => setPaymentForm({ ...paymentForm, bank_account: e.target.value })} /></div>
                      </div>
                      <div><Label>Notes</Label><Textarea value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} /></div>
                      <Button className="w-full" onClick={() => createPayment.mutate(paymentForm)} disabled={createPayment.isPending}>
                        {createPayment.isPending ? "Creating..." : "Create Payment"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Voucher No.</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Party</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentVouchers?.filter((p) => p.payment_number.toLowerCase().includes(searchTerm.toLowerCase())).map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.payment_number}</TableCell>
                        <TableCell>{format(new Date(payment.payment_date), "dd/MM/yyyy")}</TableCell>
                        <TableCell>{getPartyName(payment.party_type, payment.party_id)}</TableCell>
                        <TableCell className="capitalize">{payment.payment_method}</TableCell>
                        <TableCell className="text-right text-red-600">-₹{payment.amount.toLocaleString()}</TableCell>
                        <TableCell><span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">{payment.status}</span></TableCell>
                      </TableRow>
                    ))}
                    {(!paymentVouchers || paymentVouchers.length === 0) && (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No payment vouchers found</TableCell></TableRow>
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

export default PaymentVouchers;

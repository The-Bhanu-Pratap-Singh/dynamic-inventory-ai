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
import { ArrowLeft, Plus, FileText, Search, CreditCard, Receipt } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

const CreditDebitNotes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreditDialogOpen, setIsCreditDialogOpen] = useState(false);
  const [isDebitDialogOpen, setIsDebitDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [creditForm, setCreditForm] = useState({ customer_id: "", reason: "", subtotal: "", cgst_amount: "", sgst_amount: "" });
  const [debitForm, setDebitForm] = useState({ vendor_id: "", reason: "", subtotal: "", cgst_amount: "", sgst_amount: "" });

  const { data: creditNotes, isLoading: loadingCredits } = useQuery({
    queryKey: ["credit-notes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("credit_notes").select("*, customers(name)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: debitNotes, isLoading: loadingDebits } = useQuery({
    queryKey: ["debit-notes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("debit_notes").select("*, vendors(name)").order("created_at", { ascending: false });
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

  const createCreditNote = useMutation({
    mutationFn: async (data: typeof creditForm) => {
      const subtotal = parseFloat(data.subtotal) || 0;
      const cgst = parseFloat(data.cgst_amount) || 0;
      const sgst = parseFloat(data.sgst_amount) || 0;
      const { error } = await supabase.from("credit_notes").insert({
        credit_note_number: `CN-${Date.now()}`,
        customer_id: data.customer_id || null,
        reason: data.reason,
        subtotal,
        cgst_amount: cgst,
        sgst_amount: sgst,
        total_amount: subtotal + cgst + sgst,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-notes"] });
      setIsCreditDialogOpen(false);
      setCreditForm({ customer_id: "", reason: "", subtotal: "", cgst_amount: "", sgst_amount: "" });
      toast({ title: "Success", description: "Credit note created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create credit note", variant: "destructive" });
    },
  });

  const createDebitNote = useMutation({
    mutationFn: async (data: typeof debitForm) => {
      const subtotal = parseFloat(data.subtotal) || 0;
      const cgst = parseFloat(data.cgst_amount) || 0;
      const sgst = parseFloat(data.sgst_amount) || 0;
      const { error } = await supabase.from("debit_notes").insert({
        debit_note_number: `DN-${Date.now()}`,
        vendor_id: data.vendor_id || null,
        reason: data.reason,
        subtotal,
        cgst_amount: cgst,
        sgst_amount: sgst,
        total_amount: subtotal + cgst + sgst,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debit-notes"] });
      setIsDebitDialogOpen(false);
      setDebitForm({ vendor_id: "", reason: "", subtotal: "", cgst_amount: "", sgst_amount: "" });
      toast({ title: "Success", description: "Debit note created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create debit note", variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Credit & Debit Notes</h1>
            <p className="text-muted-foreground">Manage credit notes for customers and debit notes for vendors</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Search notes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>

        <Tabs defaultValue="credit" className="space-y-4">
          <TabsList>
            <TabsTrigger value="credit" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />Credit Notes
            </TabsTrigger>
            <TabsTrigger value="debit" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />Debit Notes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="credit">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Credit Notes</CardTitle>
                <Dialog open={isCreditDialogOpen} onOpenChange={setIsCreditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button><Plus className="h-4 w-4 mr-2" />New Credit Note</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Create Credit Note</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Customer</Label>
                        <Select value={creditForm.customer_id} onValueChange={(v) => setCreditForm({ ...creditForm, customer_id: v })}>
                          <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                          <SelectContent>
                            {customers?.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label>Reason</Label><Textarea value={creditForm.reason} onChange={(e) => setCreditForm({ ...creditForm, reason: e.target.value })} /></div>
                      <div className="grid grid-cols-3 gap-4">
                        <div><Label>Subtotal</Label><Input type="number" value={creditForm.subtotal} onChange={(e) => setCreditForm({ ...creditForm, subtotal: e.target.value })} /></div>
                        <div><Label>CGST</Label><Input type="number" value={creditForm.cgst_amount} onChange={(e) => setCreditForm({ ...creditForm, cgst_amount: e.target.value })} /></div>
                        <div><Label>SGST</Label><Input type="number" value={creditForm.sgst_amount} onChange={(e) => setCreditForm({ ...creditForm, sgst_amount: e.target.value })} /></div>
                      </div>
                      <Button className="w-full" onClick={() => createCreditNote.mutate(creditForm)} disabled={createCreditNote.isPending}>
                        {createCreditNote.isPending ? "Creating..." : "Create Credit Note"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Note No.</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {creditNotes?.filter((n) => n.credit_note_number.toLowerCase().includes(searchTerm.toLowerCase())).map((note) => (
                      <TableRow key={note.id}>
                        <TableCell className="font-medium">{note.credit_note_number}</TableCell>
                        <TableCell>{format(new Date(note.credit_note_date), "dd/MM/yyyy")}</TableCell>
                        <TableCell>{note.customers?.name || "-"}</TableCell>
                        <TableCell className="max-w-xs truncate">{note.reason || "-"}</TableCell>
                        <TableCell className="text-right">₹{note.total_amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${note.status === "approved" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>{note.status}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!creditNotes || creditNotes.length === 0) && (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No credit notes found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="debit">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Debit Notes</CardTitle>
                <Dialog open={isDebitDialogOpen} onOpenChange={setIsDebitDialogOpen}>
                  <DialogTrigger asChild>
                    <Button><Plus className="h-4 w-4 mr-2" />New Debit Note</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Create Debit Note</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Vendor</Label>
                        <Select value={debitForm.vendor_id} onValueChange={(v) => setDebitForm({ ...debitForm, vendor_id: v })}>
                          <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                          <SelectContent>
                            {vendors?.map((v) => (<SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label>Reason</Label><Textarea value={debitForm.reason} onChange={(e) => setDebitForm({ ...debitForm, reason: e.target.value })} /></div>
                      <div className="grid grid-cols-3 gap-4">
                        <div><Label>Subtotal</Label><Input type="number" value={debitForm.subtotal} onChange={(e) => setDebitForm({ ...debitForm, subtotal: e.target.value })} /></div>
                        <div><Label>CGST</Label><Input type="number" value={debitForm.cgst_amount} onChange={(e) => setDebitForm({ ...debitForm, cgst_amount: e.target.value })} /></div>
                        <div><Label>SGST</Label><Input type="number" value={debitForm.sgst_amount} onChange={(e) => setDebitForm({ ...debitForm, sgst_amount: e.target.value })} /></div>
                      </div>
                      <Button className="w-full" onClick={() => createDebitNote.mutate(debitForm)} disabled={createDebitNote.isPending}>
                        {createDebitNote.isPending ? "Creating..." : "Create Debit Note"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Note No.</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {debitNotes?.filter((n) => n.debit_note_number.toLowerCase().includes(searchTerm.toLowerCase())).map((note) => (
                      <TableRow key={note.id}>
                        <TableCell className="font-medium">{note.debit_note_number}</TableCell>
                        <TableCell>{format(new Date(note.debit_note_date), "dd/MM/yyyy")}</TableCell>
                        <TableCell>{note.vendors?.name || "-"}</TableCell>
                        <TableCell className="max-w-xs truncate">{note.reason || "-"}</TableCell>
                        <TableCell className="text-right">₹{note.total_amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${note.status === "approved" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>{note.status}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!debitNotes || debitNotes.length === 0) && (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No debit notes found</TableCell></TableRow>
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

export default CreditDebitNotes;

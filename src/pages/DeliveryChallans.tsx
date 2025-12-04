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
import { ArrowLeft, Plus, Truck, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

const DeliveryChallans = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    customer_id: "",
    vehicle_number: "",
    driver_name: "",
    transport_mode: "road",
    delivery_address: "",
    notes: "",
  });

  const { data: challans, isLoading } = useQuery({
    queryKey: ["delivery-challans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_challans")
        .select("*, customers(name)")
        .order("created_at", { ascending: false });
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

  const createChallan = useMutation({
    mutationFn: async (data: typeof formData) => {
      const challanNumber = `DC-${Date.now()}`;
      const { error } = await supabase.from("delivery_challans").insert({
        challan_number: challanNumber,
        customer_id: data.customer_id || null,
        vehicle_number: data.vehicle_number,
        driver_name: data.driver_name,
        transport_mode: data.transport_mode,
        delivery_address: data.delivery_address,
        notes: data.notes,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-challans"] });
      setIsDialogOpen(false);
      setFormData({ customer_id: "", vehicle_number: "", driver_name: "", transport_mode: "road", delivery_address: "", notes: "" });
      toast({ title: "Success", description: "Delivery challan created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create delivery challan", variant: "destructive" });
    },
  });

  const filteredChallans = challans?.filter(
    (c) => c.challan_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Delivery Challans</h1>
            <p className="text-muted-foreground">Manage delivery challans for goods dispatch</p>
          </div>
        </div>

        <div className="flex justify-between items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search challans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />New Challan</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Delivery Challan</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Customer</Label>
                  <Select value={formData.customer_id} onValueChange={(v) => setFormData({ ...formData, customer_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                    <SelectContent>
                      {customers?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Vehicle Number</Label>
                    <Input value={formData.vehicle_number} onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })} />
                  </div>
                  <div>
                    <Label>Driver Name</Label>
                    <Input value={formData.driver_name} onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Transport Mode</Label>
                  <Select value={formData.transport_mode} onValueChange={(v) => setFormData({ ...formData, transport_mode: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="road">Road</SelectItem>
                      <SelectItem value="rail">Rail</SelectItem>
                      <SelectItem value="air">Air</SelectItem>
                      <SelectItem value="ship">Ship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Delivery Address</Label>
                  <Textarea value={formData.delivery_address} onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })} />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                </div>
                <Button className="w-full" onClick={() => createChallan.mutate(formData)} disabled={createChallan.isPending}>
                  {createChallan.isPending ? "Creating..." : "Create Challan"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              All Challans
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Challan No.</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredChallans?.map((challan) => (
                    <TableRow key={challan.id}>
                      <TableCell className="font-medium">{challan.challan_number}</TableCell>
                      <TableCell>{format(new Date(challan.challan_date), "dd/MM/yyyy")}</TableCell>
                      <TableCell>{challan.customers?.name || "-"}</TableCell>
                      <TableCell>{challan.vehicle_number || "-"}</TableCell>
                      <TableCell>{challan.driver_name || "-"}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          challan.status === "delivered" ? "bg-green-100 text-green-800" :
                          challan.status === "in_transit" ? "bg-blue-100 text-blue-800" :
                          "bg-yellow-100 text-yellow-800"
                        }`}>
                          {challan.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!filteredChallans || filteredChallans.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No delivery challans found
                      </TableCell>
                    </TableRow>
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

export default DeliveryChallans;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Package, Plus, QrCode, Loader2, ScanLine } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import QRCode from "qrcode";
import Scanner from "@/components/Scanner";

const Warehouse = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLocation, setNewLocation] = useState({
    warehouse_name: "",
    rack_number: "",
    bin_number: "",
    capacity: 100
  });
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('warehouse_locations')
        .select('*')
        .order('warehouse_name');

      if (error) throw error;
      setLocations(data || []);
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

  const handleAddLocation = async () => {
    if (!newLocation.warehouse_name || !newLocation.rack_number || !newLocation.bin_number) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const locationCode = `${newLocation.warehouse_name}-R${newLocation.rack_number}-B${newLocation.bin_number}`;
      
      // Generate QR code
      const qrCodeData = await QRCode.toDataURL(locationCode);
      
      const { error } = await supabase
        .from('warehouse_locations')
        .insert({
          ...newLocation,
          qr_code: qrCodeData
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Warehouse location added successfully",
      });

      setNewLocation({ warehouse_name: "", rack_number: "", bin_number: "", capacity: 100 });
      loadLocations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const showQRCode = async (location: any) => {
    if (location.qr_code) {
      setQrCodeUrl(location.qr_code);
    } else {
      const locationCode = `${location.warehouse_name}-R${location.rack_number}-B${location.bin_number}`;
      const qrCodeData = await QRCode.toDataURL(locationCode);
      setQrCodeUrl(qrCodeData);
    }
  };

  const handleScanResult = async (code: string) => {
    const location = locations.find(loc => 
      `${loc.warehouse_name}-R${loc.rack_number}-B${loc.bin_number}` === code
    );

    if (location) {
      await showQRCode(location);
      toast({
        title: "Location Found",
        description: `${location.warehouse_name} - Rack ${location.rack_number} - Bin ${location.bin_number}`,
      });
    } else {
      toast({
        title: "Location Not Found",
        description: "No warehouse location found with this code",
        variant: "destructive",
      });
    }
  };

  const getUsageColor = (usage: number): "default" | "destructive" | "outline" | "secondary" => {
    if (usage >= 90) return 'destructive';
    if (usage >= 70) return 'secondary';
    return 'secondary';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setShowScanner(true)}>
                  <ScanLine className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
                  <Package className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Warehouse Management</h1>
                  <p className="text-xs text-muted-foreground">Manage storage locations and inventory</p>
                </div>
              </div>
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Location
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Warehouse Location</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="warehouse">Warehouse Name *</Label>
                    <Input
                      id="warehouse"
                      value={newLocation.warehouse_name}
                      onChange={(e) => setNewLocation({ ...newLocation, warehouse_name: e.target.value })}
                      placeholder="e.g., Main Warehouse"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="rack">Rack Number *</Label>
                      <Input
                        id="rack"
                        value={newLocation.rack_number}
                        onChange={(e) => setNewLocation({ ...newLocation, rack_number: e.target.value })}
                        placeholder="e.g., A1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bin">Bin Number *</Label>
                      <Input
                        id="bin"
                        value={newLocation.bin_number}
                        onChange={(e) => setNewLocation({ ...newLocation, bin_number: e.target.value })}
                        placeholder="e.g., 01"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={newLocation.capacity}
                      onChange={(e) => setNewLocation({ ...newLocation, capacity: parseInt(e.target.value) })}
                    />
                  </div>
                  <Button onClick={handleAddLocation} className="w-full">
                    Create Location
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Locations</p>
              <p className="text-2xl font-bold">{locations.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Capacity</p>
              <p className="text-2xl font-bold">
                {locations.reduce((sum, loc) => sum + loc.capacity, 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Usage</p>
              <p className="text-2xl font-bold">
                {locations.reduce((sum, loc) => sum + loc.current_usage, 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Locations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((location) => {
            const usagePercent = (location.current_usage / location.capacity) * 100;
            return (
              <Card key={location.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {location.warehouse_name}
                      </CardTitle>
                      <CardDescription>
                        Rack {location.rack_number} - Bin {location.bin_number}
                      </CardDescription>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => showQRCode(location)}
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Location QR Code</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col items-center gap-4 py-4">
                          {qrCodeUrl && (
                            <>
                              <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
                              <p className="text-sm text-center">
                                {location.warehouse_name}-R{location.rack_number}-B{location.bin_number}
                              </p>
                              <a
                                href={qrCodeUrl}
                                download={`location-qr-${location.id}.png`}
                              >
                                <Button>Download QR Code</Button>
                              </a>
                            </>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Capacity:</span>
                      <span className="font-medium">{location.capacity} units</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Current Usage:</span>
                      <span className="font-medium">{location.current_usage} units</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Utilization</span>
                        <span>{usagePercent.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            usagePercent >= 90 ? 'bg-destructive' : 
                            usagePercent >= 70 ? 'bg-orange-500' : 'bg-primary'
                          }`}
                          style={{ width: `${Math.min(usagePercent, 100)}%` }}
                        />
                      </div>
                    </div>
                    <Badge variant={getUsageColor(usagePercent)} className="w-full justify-center">
                      {usagePercent >= 90 ? 'Almost Full' : 
                       usagePercent >= 70 ? 'High Usage' : 'Available'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {locations.length === 0 && (
          <Card>
            <CardContent className="py-16 text-center">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No warehouse locations yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first location to start managing inventory
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      <Scanner 
        isOpen={showScanner} 
        onClose={() => setShowScanner(false)} 
        onScan={handleScanResult} 
      />
    </div>
  );
};

export default Warehouse;

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { BusinessDetails, emptyBusiness, fetchBusiness, GSTIN_REGEX } from "@/lib/business";

const BusinessSettings = () => {
  const [form, setForm] = useState<BusinessDetails>(emptyBusiness);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBusiness().then((b) => { if (b) setForm(b); setLoading(false); });
  }, []);

  const set = (k: keyof BusinessDetails) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let v = e.target.value;
    if (k === "gstin") v = v.toUpperCase().trim();
    setForm((f) => {
      const next = { ...f, [k]: v };
      if (k === "gstin" && v.length >= 2) next.state_code = v.slice(0, 2);
      return next;
    });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!GSTIN_REGEX.test(form.gstin)) {
      toast.error("GSTIN looks wrong. It should be 15 characters, e.g. 27ABCDE1234F1Z5");
      return;
    }
    setSaving(true);
    const { id, ...fields } = form;
    const payload = { ...fields, is_main: true, updated_at: new Date().toISOString() };
    const res = id
      ? await supabase.from("branches").update(payload).eq("id", id).select().single()
      : await supabase.from("branches").insert(payload).select().single();
    setSaving(false);
    if (res.error) {
      toast.error(res.error.message.includes("row-level") ? "Only an Admin can change business details." : res.error.message);
      return;
    }
    setForm((f) => ({ ...f, id: res.data.id }));
    toast.success("Business details saved. Invoices and GST reports will now use this GSTIN.");
  };

  if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Business & GSTIN</CardTitle>
          <CardDescription>These details print on every invoice and fill your GSTR-1 / GSTR-3B exports.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="name">Business name</Label>
              <Input id="name" value={form.name} onChange={set("name")} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gstin">GSTIN</Label>
              <Input id="gstin" value={form.gstin} onChange={set("gstin")} maxLength={15} placeholder="27ABCDE1234F1Z5" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state_code">State code</Label>
              <Input id="state_code" value={form.state_code} onChange={set("state_code")} maxLength={2} />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" value={form.address} onChange={set("address")} />
            </div>
            <div className="space-y-2"><Label htmlFor="city">City</Label><Input id="city" value={form.city} onChange={set("city")} /></div>
            <div className="space-y-2"><Label htmlFor="state">State</Label><Input id="state" value={form.state} onChange={set("state")} /></div>
            <div className="space-y-2"><Label htmlFor="pincode">Pincode</Label><Input id="pincode" value={form.pincode} onChange={set("pincode")} /></div>
            <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" value={form.phone} onChange={set("phone")} /></div>
            <div className="sm:col-span-2 space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={form.email} onChange={set("email")} /></div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save details</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessSettings;

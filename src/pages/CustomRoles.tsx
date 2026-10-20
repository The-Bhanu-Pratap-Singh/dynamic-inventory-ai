import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, X } from "lucide-react";

export const PERMISSIONS = [
  { key: "products.view", label: "View products" },
  { key: "products.edit", label: "Add / edit products" },
  { key: "inventory.manage", label: "Manage warehouse stock" },
  { key: "pos.bill", label: "Create bills (POS)" },
  { key: "purchases.manage", label: "Purchase orders & vendor bills" },
  { key: "customers.manage", label: "Manage customers" },
  { key: "vendors.manage", label: "Manage vendors" },
  { key: "accounts.view", label: "View accounts (P&L, balance sheet)" },
  { key: "accounts.edit", label: "Post journal entries & payments" },
  { key: "gst.reports", label: "GST reports & exports" },
  { key: "settings.manage", label: "Business settings" },
];

interface CustomRole { id: string; name: string; description: string | null; permissions: string[] }
interface AppUser { id: string; full_name: string | null }

const CustomRoles = () => {
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [assignments, setAssignments] = useState<{ id: string; user_id: string; custom_role_id: string }[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [perms, setPerms] = useState<string[]>([]);
  const [assignUser, setAssignUser] = useState("");
  const [assignRole, setAssignRole] = useState("");

  const load = async () => {
    const [r, u, a] = await Promise.all([
      supabase.from("custom_roles").select("*").order("name"),
      supabase.rpc("get_users_with_roles"),
      supabase.from("user_custom_roles").select("id,user_id,custom_role_id"),
    ]);
    if (u.error) toast.error("Only admins can manage roles.");
    setRoles((r.data as CustomRole[]) || []);
    setUsers((u.data as AppUser[]) || []);
    setAssignments(a.data || []);
  };
  useEffect(() => { load(); }, []);

  const createRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const { error } = await supabase.from("custom_roles").insert({ name: name.trim(), description, permissions: perms });
    if (error) return toast.error(error.message);
    setName(""); setDescription(""); setPerms([]);
    toast.success("Role created");
    load();
  };

  const togglePerm = async (role: CustomRole, key: string) => {
    const next = role.permissions.includes(key) ? role.permissions.filter((p) => p !== key) : [...role.permissions, key];
    const { error } = await supabase.from("custom_roles").update({ permissions: next }).eq("id", role.id);
    if (error) return toast.error(error.message);
    load();
  };

  const deleteRole = async (id: string) => {
    const { error } = await supabase.from("custom_roles").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const assign = async () => {
    if (!assignUser || !assignRole) return;
    const { error } = await supabase.from("user_custom_roles").insert({ user_id: assignUser, custom_role_id: assignRole });
    if (error) return toast.error(error.message.includes("duplicate") ? "Already assigned" : error.message);
    toast.success("Role assigned");
    load();
  };

  const unassign = async (id: string) => {
    await supabase.from("user_custom_roles").delete().eq("id", id);
    load();
  };

  const userName = (id: string) => users.find((u) => u.id === id)?.full_name || id.slice(0, 8);

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold">Custom Roles</h1>
        <p className="text-muted-foreground">Create your own roles (e.g. "Salesman", "Branch Accountant") and pick exactly what they can do.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>New role</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={createRole} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="rname">Role name</Label><Input id="rname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Salesman" /></div>
              <div className="space-y-2"><Label htmlFor="rdesc">Description</Label><Input id="rdesc" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
              <div className="grid sm:grid-cols-2 gap-2">
                {PERMISSIONS.map((p) => (
                  <label key={p.key} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={perms.includes(p.key)} onCheckedChange={() => setPerms((s) => s.includes(p.key) ? s.filter((x) => x !== p.key) : [...s, p.key])} />
                    {p.label}
                  </label>
                ))}
              </div>
              <Button type="submit">Create role</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Assign to team member</CardTitle><CardDescription>One person can have several custom roles.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <Select value={assignUser} onValueChange={setAssignUser}>
              <SelectTrigger><SelectValue placeholder="Choose person" /></SelectTrigger>
              <SelectContent>{users.map((u) => <SelectItem key={u.id} value={u.id}>{u.full_name || u.id.slice(0, 8)}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={assignRole} onValueChange={setAssignRole}>
              <SelectTrigger><SelectValue placeholder="Choose role" /></SelectTrigger>
              <SelectContent>{roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
            </Select>
            <Button onClick={assign} disabled={!assignUser || !assignRole}>Assign</Button>
            <div className="space-y-2">
              {assignments.map((a) => (
                <div key={a.id} className="flex items-center justify-between text-sm border rounded-md px-3 py-2">
                  <span>{userName(a.user_id)} → <Badge variant="secondary">{roles.find((r) => r.id === a.custom_role_id)?.name}</Badge></span>
                  <Button size="icon" variant="ghost" onClick={() => unassign(a.id)}><X className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {roles.map((role) => (
        <Card key={role.id}>
          <CardHeader className="flex flex-row items-start justify-between">
            <div><CardTitle>{role.name}</CardTitle>{role.description && <CardDescription>{role.description}</CardDescription>}</div>
            <Button size="icon" variant="ghost" onClick={() => deleteRole(role.id)}><Trash2 className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-3 gap-2">
            {PERMISSIONS.map((p) => (
              <label key={p.key} className="flex items-center gap-2 text-sm">
                <Checkbox checked={role.permissions.includes(p.key)} onCheckedChange={() => togglePerm(role, p.key)} />
                {p.label}
              </label>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CustomRoles;

import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard, Users, Building2, Package, Warehouse, Receipt, Shield, KeyRound, Settings,
  ShoppingCart, FileText, Truck, BookOpen, Wallet, CreditCard, Brain, BarChart3, LogOut,
} from "lucide-react";

const groups = [
  { label: "Overview", items: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "AI Insights", url: "/ai-insights", icon: Brain },
    { title: "Analytics", url: "/analytics", icon: BarChart3 },
  ]},
  { label: "Manage", items: [
    { title: "Customers", url: "/customers", icon: Users },
    { title: "Vendors", url: "/vendors", icon: Building2 },
    { title: "Products", url: "/products", icon: Package },
    { title: "Inventory", url: "/warehouse", icon: Warehouse },
  ]},
  { label: "Billing & Accounts", items: [
    { title: "POS / Invoice", url: "/pos", icon: CreditCard },
    { title: "Purchase Orders", url: "/purchase-orders", icon: ShoppingCart },
    { title: "Quotations", url: "/quotations", icon: FileText },
    { title: "Delivery Challans", url: "/delivery-challans", icon: Truck },
    { title: "Credit/Debit Notes", url: "/credit-debit-notes", icon: Receipt },
    { title: "Payments", url: "/payment-vouchers", icon: Wallet },
    { title: "Accounting", url: "/accounting", icon: BookOpen },
    { title: "GST Reports", url: "/gst-reports", icon: Receipt },
  ]},
  { label: "Admin", items: [
    { title: "Role Management", url: "/roles", icon: Shield },
    { title: "Custom Roles", url: "/roles/custom", icon: KeyRound },
    { title: "Business & GSTIN", url: "/settings/business", icon: Settings },
  ]},
];

function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="h-8 w-8 shrink-0 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Package className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && <span className="font-bold">DPI</span>}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((g) => (
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel>{g.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                      <NavLink to={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Sign out" onClick={async () => { await supabase.auth.signOut(); navigate("/auth"); }}>
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Sign out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth"); else setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => { if (!session) navigate("/auth"); });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  if (!ready) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center border-b bg-card/50 sticky top-0 z-20">
            <SidebarTrigger className="ml-2" />
          </header>
          <main className="flex-1"><Outlet /></main>
        </div>
      </div>
    </SidebarProvider>
  );
}

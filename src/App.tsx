import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import NewProduct from "./pages/NewProduct";
import BulkImport from "./pages/BulkImport";
import AIInsights from "./pages/AIInsights";
import ProductDetail from "./pages/ProductDetail";
import Analytics from "./pages/Analytics";
import POS from "./pages/POS";
import Warehouse from "./pages/Warehouse";
import RoleManagement from "./pages/RoleManagement";
import Customers from "./pages/Customers";
import Vendors from "./pages/Vendors";
import Accounting from "./pages/Accounting";
import GSTReports from "./pages/GSTReports";
import Quotations from "./pages/Quotations";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/new" element={<NewProduct />} />
          <Route path="/products/bulk-import" element={<BulkImport />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/ai-insights" element={<AIInsights />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/warehouse" element={<Warehouse />} />
          <Route path="/roles" element={<RoleManagement />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/accounting" element={<Accounting />} />
          <Route path="/gst-reports" element={<GSTReports />} />
          <Route path="/quotations" element={<Quotations />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

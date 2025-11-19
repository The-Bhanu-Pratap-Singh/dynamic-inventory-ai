-- Create warehouse locations table
CREATE TABLE IF NOT EXISTS public.warehouse_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  warehouse_name TEXT NOT NULL,
  rack_number TEXT NOT NULL,
  bin_number TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 100,
  current_usage INTEGER NOT NULL DEFAULT 0,
  qr_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(warehouse_name, rack_number, bin_number)
);

-- Create product storage mapping
CREATE TABLE IF NOT EXISTS public.product_storage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.warehouse_locations(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sales orders table for POS
CREATE TABLE IF NOT EXISTS public.sales_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT,
  customer_phone TEXT,
  subtotal NUMERIC NOT NULL,
  tax_amount NUMERIC NOT NULL,
  discount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sales order items
CREATE TABLE IF NOT EXISTS public.sales_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  tax_rate NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.warehouse_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_storage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for warehouse_locations
CREATE POLICY "Authenticated users can view locations"
  ON public.warehouse_locations FOR SELECT USING (true);

CREATE POLICY "Admins and managers can manage locations"
  ON public.warehouse_locations FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'store_manager'::app_role));

-- RLS Policies for product_storage
CREATE POLICY "Authenticated users can view storage"
  ON public.product_storage FOR SELECT USING (true);

CREATE POLICY "Warehouse staff can manage storage"
  ON public.product_storage FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'store_manager'::app_role) OR
    has_role(auth.uid(), 'warehouse_staff'::app_role)
  );

-- RLS Policies for sales_orders
CREATE POLICY "Authenticated users can view orders"
  ON public.sales_orders FOR SELECT USING (true);

CREATE POLICY "Staff can create orders"
  ON public.sales_orders FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'store_manager'::app_role)
  );

-- RLS Policies for sales_order_items
CREATE POLICY "Authenticated users can view order items"
  ON public.sales_order_items FOR SELECT USING (true);

CREATE POLICY "Staff can create order items"
  ON public.sales_order_items FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'store_manager'::app_role)
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_storage_product ON public.product_storage(product_id);
CREATE INDEX IF NOT EXISTS idx_product_storage_location ON public.product_storage(location_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_date ON public.sales_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_order_items_order ON public.sales_order_items(order_id);
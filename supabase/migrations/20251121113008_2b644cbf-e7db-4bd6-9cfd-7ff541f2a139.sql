-- Fix PUBLIC_DATA_EXPOSURE: Restrict sales order access to admin and store_manager roles only
DROP POLICY IF EXISTS "Authenticated users can view orders" ON public.sales_orders;
DROP POLICY IF EXISTS "Authenticated users can view order items" ON public.sales_order_items;

-- Restrict sales_orders SELECT to admin and store_manager only
CREATE POLICY "Admin and managers view orders"
ON public.sales_orders FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'store_manager'::app_role)
);

-- Restrict sales_order_items SELECT to admin and store_manager only
CREATE POLICY "Admin and managers view order items"
ON public.sales_order_items FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'store_manager'::app_role)
);
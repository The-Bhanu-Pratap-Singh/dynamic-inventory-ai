-- Create sales transactions table for demand forecasting and analytics
CREATE TABLE IF NOT EXISTS public.sales_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sales_transactions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view transactions
CREATE POLICY "Authenticated users can view sales transactions"
  ON public.sales_transactions
  FOR SELECT
  USING (true);

-- Allow admins and managers to create transactions
CREATE POLICY "Admins and managers can create transactions"
  ON public.sales_transactions
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'store_manager'::app_role)
  );

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_sales_transactions_product_id ON public.sales_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_date ON public.sales_transactions(transaction_date DESC);
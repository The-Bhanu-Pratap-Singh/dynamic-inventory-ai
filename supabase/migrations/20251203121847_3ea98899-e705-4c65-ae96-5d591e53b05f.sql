-- Create customers table for receivables tracking
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  gstin TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  state_code TEXT,
  pincode TEXT,
  credit_limit NUMERIC DEFAULT 0,
  outstanding_balance NUMERIC DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create vendors table for payables tracking
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  gstin TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  state_code TEXT,
  pincode TEXT,
  payment_terms INTEGER DEFAULT 30,
  outstanding_balance NUMERIC DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create ledgers table (chart of accounts)
CREATE TABLE public.ledgers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'income', 'expense')),
  parent_id UUID REFERENCES public.ledgers(id),
  opening_balance NUMERIC DEFAULT 0,
  current_balance NUMERIC DEFAULT 0,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create journal_entries table
CREATE TABLE public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_number TEXT NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  reference_type TEXT,
  reference_id UUID,
  total_debit NUMERIC NOT NULL DEFAULT 0,
  total_credit NUMERIC NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'posted' CHECK (status IN ('draft', 'posted', 'cancelled')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create journal_entry_lines table
CREATE TABLE public.journal_entry_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id UUID REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  ledger_id UUID REFERENCES public.ledgers(id),
  debit_amount NUMERIC DEFAULT 0,
  credit_amount NUMERIC DEFAULT 0,
  narration TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create quotations table
CREATE TABLE public.quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number TEXT NOT NULL,
  customer_id UUID REFERENCES public.customers(id),
  quotation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  cgst_amount NUMERIC DEFAULT 0,
  sgst_amount NUMERIC DEFAULT 0,
  igst_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired', 'converted')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create quotation_items table
CREATE TABLE public.quotation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  hsn_code TEXT,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  tax_rate NUMERIC DEFAULT 0,
  cgst_rate NUMERIC DEFAULT 0,
  sgst_rate NUMERIC DEFAULT 0,
  igst_rate NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create delivery_challans table
CREATE TABLE public.delivery_challans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challan_number TEXT NOT NULL,
  customer_id UUID REFERENCES public.customers(id),
  challan_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sales_order_id UUID REFERENCES public.sales_orders(id),
  vehicle_number TEXT,
  driver_name TEXT,
  transport_mode TEXT,
  delivery_address TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'dispatched', 'delivered', 'cancelled')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create delivery_challan_items table
CREATE TABLE public.delivery_challan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challan_id UUID REFERENCES public.delivery_challans(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create credit_notes table
CREATE TABLE public.credit_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_note_number TEXT NOT NULL,
  customer_id UUID REFERENCES public.customers(id),
  original_invoice_id UUID REFERENCES public.sales_orders(id),
  credit_note_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reason TEXT,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  cgst_amount NUMERIC DEFAULT 0,
  sgst_amount NUMERIC DEFAULT 0,
  igst_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'adjusted', 'cancelled')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create debit_notes table
CREATE TABLE public.debit_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debit_note_number TEXT NOT NULL,
  vendor_id UUID REFERENCES public.vendors(id),
  original_purchase_id UUID,
  debit_note_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reason TEXT,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  cgst_amount NUMERIC DEFAULT 0,
  sgst_amount NUMERIC DEFAULT 0,
  igst_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'adjusted', 'cancelled')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create branches table for multi-GSTIN support
CREATE TABLE public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  gstin TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  state_code TEXT,
  pincode TEXT,
  phone TEXT,
  email TEXT,
  is_main BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_number TEXT NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('receipt', 'payment')),
  party_type TEXT NOT NULL CHECK (party_type IN ('customer', 'vendor')),
  party_id UUID,
  amount NUMERIC NOT NULL,
  payment_method TEXT,
  reference_number TEXT,
  bank_account TEXT,
  notes TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_challans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_challan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customers
CREATE POLICY "Authenticated users can view customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Admin and managers can manage customers" ON public.customers FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'store_manager'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

-- RLS Policies for vendors
CREATE POLICY "Authenticated users can view vendors" ON public.vendors FOR SELECT USING (true);
CREATE POLICY "Admin and managers can manage vendors" ON public.vendors FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'store_manager'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

-- RLS Policies for ledgers
CREATE POLICY "Authenticated users can view ledgers" ON public.ledgers FOR SELECT USING (true);
CREATE POLICY "Accountants and admin can manage ledgers" ON public.ledgers FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

-- RLS Policies for journal entries
CREATE POLICY "Accountants and admin can view journal entries" ON public.journal_entries FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role) OR has_role(auth.uid(), 'store_manager'::app_role));
CREATE POLICY "Accountants and admin can manage journal entries" ON public.journal_entries FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

-- RLS Policies for journal entry lines
CREATE POLICY "Accountants and admin can view journal entry lines" ON public.journal_entry_lines FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role) OR has_role(auth.uid(), 'store_manager'::app_role));
CREATE POLICY "Accountants and admin can manage journal entry lines" ON public.journal_entry_lines FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

-- RLS Policies for quotations
CREATE POLICY "Authenticated users can view quotations" ON public.quotations FOR SELECT USING (true);
CREATE POLICY "Admin and managers can manage quotations" ON public.quotations FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'store_manager'::app_role));

-- RLS Policies for quotation items
CREATE POLICY "Authenticated users can view quotation items" ON public.quotation_items FOR SELECT USING (true);
CREATE POLICY "Admin and managers can manage quotation items" ON public.quotation_items FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'store_manager'::app_role));

-- RLS Policies for delivery challans
CREATE POLICY "Authenticated users can view delivery challans" ON public.delivery_challans FOR SELECT USING (true);
CREATE POLICY "Admin and managers can manage delivery challans" ON public.delivery_challans FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'store_manager'::app_role) OR has_role(auth.uid(), 'warehouse_staff'::app_role));

-- RLS Policies for delivery challan items
CREATE POLICY "Authenticated users can view delivery challan items" ON public.delivery_challan_items FOR SELECT USING (true);
CREATE POLICY "Admin and managers can manage delivery challan items" ON public.delivery_challan_items FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'store_manager'::app_role) OR has_role(auth.uid(), 'warehouse_staff'::app_role));

-- RLS Policies for credit notes
CREATE POLICY "Admin and accountants can view credit notes" ON public.credit_notes FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role) OR has_role(auth.uid(), 'store_manager'::app_role));
CREATE POLICY "Admin and accountants can manage credit notes" ON public.credit_notes FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

-- RLS Policies for debit notes
CREATE POLICY "Admin and accountants can view debit notes" ON public.debit_notes FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role) OR has_role(auth.uid(), 'store_manager'::app_role));
CREATE POLICY "Admin and accountants can manage debit notes" ON public.debit_notes FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

-- RLS Policies for branches
CREATE POLICY "Authenticated users can view branches" ON public.branches FOR SELECT USING (true);
CREATE POLICY "Admin can manage branches" ON public.branches FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for payments
CREATE POLICY "Admin and accountants can view payments" ON public.payments FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role) OR has_role(auth.uid(), 'store_manager'::app_role));
CREATE POLICY "Admin and accountants can manage payments" ON public.payments FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

-- Insert default ledgers (chart of accounts)
INSERT INTO public.ledgers (name, code, type, is_system) VALUES
('Cash', 'CASH001', 'asset', true),
('Bank Account', 'BANK001', 'asset', true),
('Accounts Receivable', 'AR001', 'asset', true),
('Inventory', 'INV001', 'asset', true),
('Accounts Payable', 'AP001', 'liability', true),
('GST Payable', 'GST001', 'liability', true),
('Sales Revenue', 'SALES001', 'income', true),
('Cost of Goods Sold', 'COGS001', 'expense', true),
('Purchase', 'PURCH001', 'expense', true),
('GST Input Credit', 'GSTINP001', 'asset', true),
('Capital', 'CAP001', 'equity', true),
('Discount Given', 'DISC001', 'expense', true),
('Discount Received', 'DISCR001', 'income', true);
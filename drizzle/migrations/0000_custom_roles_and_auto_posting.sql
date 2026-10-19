DROP POLICY IF EXISTS "Prevent self-assigned admin roles" ON public.user_roles;

CREATE TABLE public.custom_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  permissions text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_roles TO authenticated;
GRANT ALL ON public.custom_roles TO service_role;
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view custom roles" ON public.custom_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage custom roles" ON public.custom_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.user_custom_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  custom_role_id uuid NOT NULL REFERENCES public.custom_roles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, custom_role_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_custom_roles TO authenticated;
GRANT ALL ON public.user_custom_roles TO service_role;
ALTER TABLE public.user_custom_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own custom roles" ON public.user_custom_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage user custom roles" ON public.user_custom_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.post_to_ledger(_name text, _type text, _amount numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF coalesce(_amount,0) = 0 THEN RETURN; END IF;
  UPDATE ledgers SET current_balance = coalesce(current_balance,0) + _amount, updated_at = now()
    WHERE name = _name AND is_system = true;
  IF NOT FOUND THEN
    INSERT INTO ledgers(name, type, opening_balance, current_balance, is_system)
    VALUES (_name, _type, 0, _amount, true);
  END IF;
END $$;
REVOKE EXECUTE ON FUNCTION public.post_to_ledger(text,text,numeric) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.post_sales_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM post_to_ledger('Cash / Bank','asset', NEW.total_amount);
  PERFORM post_to_ledger('Sales','income', NEW.subtotal - coalesce(NEW.discount,0));
  PERFORM post_to_ledger('Output GST Payable','liability', NEW.tax_amount);
  RETURN NEW;
END $$;
CREATE TRIGGER trg_post_sales_order AFTER INSERT ON public.sales_orders
  FOR EACH ROW EXECUTE FUNCTION public.post_sales_order();

CREATE OR REPLACE FUNCTION public.post_purchase_bill()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE tax numeric := coalesce(NEW.cgst_amount,0)+coalesce(NEW.sgst_amount,0)+coalesce(NEW.igst_amount,0);
BEGIN
  IF NEW.status = 'received' AND coalesce(OLD.status,'') <> 'received' THEN
    PERFORM post_to_ledger('Purchases','expense', NEW.subtotal);
    PERFORM post_to_ledger('Input GST Credit','asset', tax);
    PERFORM post_to_ledger('Accounts Payable','liability', NEW.total_amount);
    UPDATE products p SET current_stock = coalesce(p.current_stock,0) + i.quantity
      FROM purchase_order_items i WHERE i.po_id = NEW.id AND i.product_id = p.id;
    UPDATE purchase_order_items SET received_quantity = quantity WHERE po_id = NEW.id;
    IF NEW.vendor_id IS NOT NULL THEN
      UPDATE vendors SET outstanding_balance = coalesce(outstanding_balance,0) + NEW.total_amount WHERE id = NEW.vendor_id;
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_post_purchase_bill AFTER UPDATE OF status ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.post_purchase_bill();
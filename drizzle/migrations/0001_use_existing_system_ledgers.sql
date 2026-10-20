CREATE OR REPLACE FUNCTION public.post_sales_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM post_to_ledger(CASE WHEN NEW.payment_method = 'cash' THEN 'Cash' ELSE 'Bank Account' END,'asset', NEW.total_amount);
  PERFORM post_to_ledger('Sales Revenue','income', NEW.subtotal - coalesce(NEW.discount,0));
  PERFORM post_to_ledger('GST Payable','liability', NEW.tax_amount);
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.post_purchase_bill()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE tax numeric := coalesce(NEW.cgst_amount,0)+coalesce(NEW.sgst_amount,0)+coalesce(NEW.igst_amount,0);
BEGIN
  IF NEW.status = 'received' AND coalesce(OLD.status,'') <> 'received' THEN
    PERFORM post_to_ledger('Purchase','expense', NEW.subtotal);
    PERFORM post_to_ledger('GST Input Credit','asset', tax);
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
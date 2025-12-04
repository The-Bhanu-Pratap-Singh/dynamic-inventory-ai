export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          resource: string
          resource_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource: string
          resource_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource?: string
          resource_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      branches: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          email: string | null
          gstin: string | null
          id: string
          is_main: boolean | null
          name: string
          phone: string | null
          pincode: string | null
          state: string | null
          state_code: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          is_main?: boolean | null
          name: string
          phone?: string | null
          pincode?: string | null
          state?: string | null
          state_code?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          is_main?: boolean | null
          name?: string
          phone?: string | null
          pincode?: string | null
          state?: string | null
          state_code?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      credit_notes: {
        Row: {
          cgst_amount: number | null
          created_at: string | null
          created_by: string | null
          credit_note_date: string
          credit_note_number: string
          customer_id: string | null
          id: string
          igst_amount: number | null
          original_invoice_id: string | null
          reason: string | null
          sgst_amount: number | null
          status: string | null
          subtotal: number
          total_amount: number
        }
        Insert: {
          cgst_amount?: number | null
          created_at?: string | null
          created_by?: string | null
          credit_note_date?: string
          credit_note_number: string
          customer_id?: string | null
          id?: string
          igst_amount?: number | null
          original_invoice_id?: string | null
          reason?: string | null
          sgst_amount?: number | null
          status?: string | null
          subtotal?: number
          total_amount?: number
        }
        Update: {
          cgst_amount?: number | null
          created_at?: string | null
          created_by?: string | null
          credit_note_date?: string
          credit_note_number?: string
          customer_id?: string | null
          id?: string
          igst_amount?: number | null
          original_invoice_id?: string | null
          reason?: string | null
          sgst_amount?: number | null
          status?: string | null
          subtotal?: number
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "credit_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_notes_original_invoice_id_fkey"
            columns: ["original_invoice_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          created_by: string | null
          credit_limit: number | null
          email: string | null
          gstin: string | null
          id: string
          name: string
          outstanding_balance: number | null
          phone: string | null
          pincode: string | null
          state: string | null
          state_code: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_limit?: number | null
          email?: string | null
          gstin?: string | null
          id?: string
          name: string
          outstanding_balance?: number | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          state_code?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_limit?: number | null
          email?: string | null
          gstin?: string | null
          id?: string
          name?: string
          outstanding_balance?: number | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          state_code?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      debit_notes: {
        Row: {
          cgst_amount: number | null
          created_at: string | null
          created_by: string | null
          debit_note_date: string
          debit_note_number: string
          id: string
          igst_amount: number | null
          original_purchase_id: string | null
          reason: string | null
          sgst_amount: number | null
          status: string | null
          subtotal: number
          total_amount: number
          vendor_id: string | null
        }
        Insert: {
          cgst_amount?: number | null
          created_at?: string | null
          created_by?: string | null
          debit_note_date?: string
          debit_note_number: string
          id?: string
          igst_amount?: number | null
          original_purchase_id?: string | null
          reason?: string | null
          sgst_amount?: number | null
          status?: string | null
          subtotal?: number
          total_amount?: number
          vendor_id?: string | null
        }
        Update: {
          cgst_amount?: number | null
          created_at?: string | null
          created_by?: string | null
          debit_note_date?: string
          debit_note_number?: string
          id?: string
          igst_amount?: number | null
          original_purchase_id?: string | null
          reason?: string | null
          sgst_amount?: number | null
          status?: string | null
          subtotal?: number
          total_amount?: number
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "debit_notes_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_challan_items: {
        Row: {
          challan_id: string | null
          created_at: string | null
          id: string
          product_id: string | null
          product_name: string
          quantity: number
        }
        Insert: {
          challan_id?: string | null
          created_at?: string | null
          id?: string
          product_id?: string | null
          product_name: string
          quantity: number
        }
        Update: {
          challan_id?: string | null
          created_at?: string | null
          id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "delivery_challan_items_challan_id_fkey"
            columns: ["challan_id"]
            isOneToOne: false
            referencedRelation: "delivery_challans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_challan_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_challans: {
        Row: {
          challan_date: string
          challan_number: string
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          delivery_address: string | null
          driver_name: string | null
          id: string
          notes: string | null
          sales_order_id: string | null
          status: string | null
          transport_mode: string | null
          vehicle_number: string | null
        }
        Insert: {
          challan_date?: string
          challan_number: string
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          delivery_address?: string | null
          driver_name?: string | null
          id?: string
          notes?: string | null
          sales_order_id?: string | null
          status?: string | null
          transport_mode?: string | null
          vehicle_number?: string | null
        }
        Update: {
          challan_date?: string
          challan_number?: string
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          delivery_address?: string | null
          driver_name?: string | null
          id?: string
          notes?: string | null
          sales_order_id?: string | null
          status?: string | null
          transport_mode?: string | null
          vehicle_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_challans_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_challans_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          entry_date: string
          entry_number: string
          id: string
          reference_id: string | null
          reference_type: string | null
          status: string | null
          total_credit: number
          total_debit: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          entry_date?: string
          entry_number: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string | null
          total_credit?: number
          total_debit?: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          entry_date?: string
          entry_number?: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string | null
          total_credit?: number
          total_debit?: number
        }
        Relationships: []
      }
      journal_entry_lines: {
        Row: {
          created_at: string | null
          credit_amount: number | null
          debit_amount: number | null
          id: string
          journal_entry_id: string | null
          ledger_id: string | null
          narration: string | null
        }
        Insert: {
          created_at?: string | null
          credit_amount?: number | null
          debit_amount?: number | null
          id?: string
          journal_entry_id?: string | null
          ledger_id?: string | null
          narration?: string | null
        }
        Update: {
          created_at?: string | null
          credit_amount?: number | null
          debit_amount?: number | null
          id?: string
          journal_entry_id?: string | null
          ledger_id?: string | null
          narration?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entry_lines_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_lines_ledger_id_fkey"
            columns: ["ledger_id"]
            isOneToOne: false
            referencedRelation: "ledgers"
            referencedColumns: ["id"]
          },
        ]
      }
      ledgers: {
        Row: {
          code: string | null
          created_at: string | null
          current_balance: number | null
          id: string
          is_system: boolean | null
          name: string
          opening_balance: number | null
          parent_id: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          current_balance?: number | null
          id?: string
          is_system?: boolean | null
          name: string
          opening_balance?: number | null
          parent_id?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          current_balance?: number | null
          id?: string
          is_system?: boolean | null
          name?: string
          opening_balance?: number | null
          parent_id?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledgers_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "ledgers"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          bank_account: string | null
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          party_id: string | null
          party_type: string
          payment_date: string
          payment_method: string | null
          payment_number: string
          payment_type: string
          reference_number: string | null
          status: string | null
        }
        Insert: {
          amount: number
          bank_account?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          party_id?: string | null
          party_type: string
          payment_date?: string
          payment_method?: string | null
          payment_number: string
          payment_type: string
          reference_number?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          bank_account?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          party_id?: string | null
          party_type?: string
          payment_date?: string
          payment_method?: string | null
          payment_number?: string
          payment_type?: string
          reference_number?: string | null
          status?: string | null
        }
        Relationships: []
      }
      product_storage: {
        Row: {
          created_at: string
          id: string
          location_id: string
          product_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          location_id: string
          product_id: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          location_id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_storage_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "warehouse_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_storage_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          created_at: string
          id: string
          price_adjustment: number | null
          product_id: string
          sku: string | null
          stock: number | null
          variant_name: string
          variant_value: string
        }
        Insert: {
          created_at?: string
          id?: string
          price_adjustment?: number | null
          product_id: string
          sku?: string | null
          stock?: number | null
          variant_name: string
          variant_value: string
        }
        Update: {
          created_at?: string
          id?: string
          price_adjustment?: number | null
          product_id?: string
          sku?: string | null
          stock?: number | null
          variant_name?: string
          variant_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          cost_price: number | null
          created_at: string
          created_by: string | null
          current_stock: number | null
          description: string | null
          hsn_code: string | null
          id: string
          image_url: string | null
          name: string
          reorder_level: number | null
          sector: string | null
          selling_price: number | null
          sku: string | null
          tax_rate: number | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          cost_price?: number | null
          created_at?: string
          created_by?: string | null
          current_stock?: number | null
          description?: string | null
          hsn_code?: string | null
          id?: string
          image_url?: string | null
          name: string
          reorder_level?: number | null
          sector?: string | null
          selling_price?: number | null
          sku?: string | null
          tax_rate?: number | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          cost_price?: number | null
          created_at?: string
          created_by?: string | null
          current_stock?: number | null
          description?: string | null
          hsn_code?: string | null
          id?: string
          image_url?: string | null
          name?: string
          reorder_level?: number | null
          sector?: string | null
          selling_price?: number | null
          sku?: string | null
          tax_rate?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          business_type: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          business_type?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          business_type?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          created_at: string | null
          id: string
          po_id: string | null
          product_id: string | null
          product_name: string
          quantity: number
          received_quantity: number | null
          tax_amount: number | null
          tax_rate: number | null
          total_amount: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          po_id?: string | null
          product_id?: string | null
          product_name: string
          quantity: number
          received_quantity?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          po_id?: string | null
          product_id?: string | null
          product_name?: string
          quantity?: number
          received_quantity?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          cgst_amount: number | null
          created_at: string | null
          created_by: string | null
          expected_delivery: string | null
          id: string
          igst_amount: number | null
          notes: string | null
          po_date: string
          po_number: string
          sgst_amount: number | null
          status: string | null
          subtotal: number
          total_amount: number
          vendor_id: string | null
        }
        Insert: {
          cgst_amount?: number | null
          created_at?: string | null
          created_by?: string | null
          expected_delivery?: string | null
          id?: string
          igst_amount?: number | null
          notes?: string | null
          po_date?: string
          po_number: string
          sgst_amount?: number | null
          status?: string | null
          subtotal?: number
          total_amount?: number
          vendor_id?: string | null
        }
        Update: {
          cgst_amount?: number | null
          created_at?: string | null
          created_by?: string | null
          expected_delivery?: string | null
          id?: string
          igst_amount?: number | null
          notes?: string | null
          po_date?: string
          po_number?: string
          sgst_amount?: number | null
          status?: string | null
          subtotal?: number
          total_amount?: number
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_items: {
        Row: {
          cgst_rate: number | null
          created_at: string | null
          hsn_code: string | null
          id: string
          igst_rate: number | null
          product_id: string | null
          product_name: string
          quantity: number
          quotation_id: string | null
          sgst_rate: number | null
          tax_amount: number | null
          tax_rate: number | null
          total_amount: number
          unit_price: number
        }
        Insert: {
          cgst_rate?: number | null
          created_at?: string | null
          hsn_code?: string | null
          id?: string
          igst_rate?: number | null
          product_id?: string | null
          product_name: string
          quantity: number
          quotation_id?: string | null
          sgst_rate?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount: number
          unit_price: number
        }
        Update: {
          cgst_rate?: number | null
          created_at?: string | null
          hsn_code?: string | null
          id?: string
          igst_rate?: number | null
          product_id?: string | null
          product_name?: string
          quantity?: number
          quotation_id?: string | null
          sgst_rate?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          cgst_amount: number | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          id: string
          igst_amount: number | null
          notes: string | null
          quotation_date: string
          quotation_number: string
          sgst_amount: number | null
          status: string | null
          subtotal: number
          total_amount: number
          valid_until: string | null
        }
        Insert: {
          cgst_amount?: number | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          id?: string
          igst_amount?: number | null
          notes?: string | null
          quotation_date?: string
          quotation_number: string
          sgst_amount?: number | null
          status?: string | null
          subtotal?: number
          total_amount?: number
          valid_until?: string | null
        }
        Update: {
          cgst_amount?: number | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          id?: string
          igst_amount?: number | null
          notes?: string | null
          quotation_date?: string
          quotation_number?: string
          sgst_amount?: number | null
          status?: string | null
          subtotal?: number
          total_amount?: number
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          tax_amount: number
          tax_rate: number
          total_amount: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          tax_amount?: number
          tax_rate?: number
          total_amount: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          tax_amount?: number
          tax_rate?: number
          total_amount?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_orders: {
        Row: {
          created_at: string
          created_by: string | null
          customer_name: string | null
          customer_phone: string | null
          discount: number | null
          id: string
          order_number: string
          payment_method: string | null
          status: string
          subtotal: number
          tax_amount: number
          total_amount: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount?: number | null
          id?: string
          order_number: string
          payment_method?: string | null
          status?: string
          subtotal: number
          tax_amount: number
          total_amount: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount?: number | null
          id?: string
          order_number?: string
          payment_method?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
        }
        Relationships: []
      }
      sales_transactions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          product_id: string
          quantity: number
          total_amount: number
          transaction_date: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          product_id: string
          quantity: number
          total_amount: number
          transaction_date?: string
          unit_price: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          product_id?: string
          quantity?: number
          total_amount?: number
          transaction_date?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendors: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          gstin: string | null
          id: string
          name: string
          outstanding_balance: number | null
          payment_terms: number | null
          phone: string | null
          pincode: string | null
          state: string | null
          state_code: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          name: string
          outstanding_balance?: number | null
          payment_terms?: number | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          state_code?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          name?: string
          outstanding_balance?: number | null
          payment_terms?: number | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          state_code?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      warehouse_locations: {
        Row: {
          bin_number: string
          capacity: number
          created_at: string
          current_usage: number
          id: string
          qr_code: string | null
          rack_number: string
          warehouse_name: string
        }
        Insert: {
          bin_number: string
          capacity?: number
          created_at?: string
          current_usage?: number
          id?: string
          qr_code?: string | null
          rack_number: string
          warehouse_name: string
        }
        Update: {
          bin_number?: string
          capacity?: number
          created_at?: string
          current_usage?: number
          id?: string
          qr_code?: string | null
          rack_number?: string
          warehouse_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_user_role: {
        Args: {
          target_role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: Json
      }
      get_users_with_roles: {
        Args: never
        Returns: {
          full_name: string
          id: string
          roles: Json
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      remove_user_role: {
        Args: {
          target_role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "store_manager" | "accountant" | "warehouse_staff"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "store_manager", "accountant", "warehouse_staff"],
    },
  },
} as const

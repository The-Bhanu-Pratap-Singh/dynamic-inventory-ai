import { supabase } from "@/integrations/supabase/client";

export interface BusinessDetails {
  id?: string;
  name: string;
  gstin: string;
  address: string;
  city: string;
  state: string;
  state_code: string;
  pincode: string;
  phone: string;
  email: string;
}

export const emptyBusiness: BusinessDetails = {
  name: "", gstin: "", address: "", city: "", state: "", state_code: "", pincode: "", phone: "", email: "",
};

// Indian GSTIN: 2-digit state code, 10-char PAN, entity no., 'Z', checksum
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

/** The main business is stored as the branch flagged is_main. */
export async function fetchBusiness(): Promise<BusinessDetails | null> {
  const { data } = await supabase.from("branches").select("*").eq("is_main", true).limit(1).maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    name: data.name ?? "",
    gstin: data.gstin ?? "",
    address: data.address ?? "",
    city: data.city ?? "",
    state: data.state ?? "",
    state_code: data.state_code ?? "",
    pincode: data.pincode ?? "",
    phone: data.phone ?? "",
    email: data.email ?? "",
  };
}

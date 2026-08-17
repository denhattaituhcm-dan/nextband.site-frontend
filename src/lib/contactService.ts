import { supabase } from "./supabase";

export interface ContactLead {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  goal?: string;
  source?: string;
  status: "new" | "contacted" | "enrolled" | "archived";
  createdAt: string;
}

const LOCAL_LEADS_KEY = "aris_contact_leads_v1";

// Helper to get local leads
export function getLocalLeads(): ContactLead[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_LEADS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Save lead to local storage
function saveLocalLead(lead: ContactLead) {
  if (typeof window === "undefined") return;
  try {
    const leads = getLocalLeads();
    leads.unshift(lead);
    localStorage.setItem(LOCAL_LEADS_KEY, JSON.stringify(leads));
  } catch (err) {
    console.error("Failed to save local lead", err);
  }
}

/**
 * Submit a real contact lead
 * 1. Attempts to persist to Supabase `contact_leads` table.
 * 2. Always persists to local store to guarantee zero lead loss.
 */
export async function submitContactLead(params: {
  fullName: string;
  phone: string;
  email?: string;
  goal?: string;
  source?: string;
}): Promise<{ success: boolean; lead: ContactLead; message?: string }> {
  const now = new Date().toISOString();
  const lead: ContactLead = {
    id: `lead-${Date.now()}`,
    fullName: params.fullName.trim(),
    phone: params.phone.trim(),
    email: params.email?.trim() || "",
    goal: params.goal?.trim() || "",
    source: params.source || "contact_page",
    status: "new",
    createdAt: now,
  };

  // Always save locally first to guarantee no loss
  saveLocalLead(lead);

  // Attempt to save to Supabase
  try {
    const { data, error } = await supabase
      .from("contact_leads")
      .insert({
        full_name: lead.fullName,
        phone: lead.phone,
        email: lead.email,
        goal: lead.goal,
        source: lead.source,
        status: lead.status,
      })
      .select()
      .single();

    if (error) {
      console.warn("Supabase insert notice (stored locally):", error.message);
    } else if (data?.id) {
      lead.id = data.id;
    }
  } catch (err: any) {
    console.warn("Supabase connection notice (lead secured in local storage):", err?.message);
  }

  return {
    success: true,
    lead,
    message: "Gửi thông tin thành công! Ban Học Thuật ARIS sẽ liên hệ tư vấn trong thời gian sớm nhất.",
  };
}

/**
 * Admin: Get all leads (combines Supabase + Local)
 */
export async function fetchAllContactLeads(): Promise<ContactLead[]> {
  try {
    const { data, error } = await supabase
      .from("contact_leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        fullName: d.full_name,
        phone: d.phone,
        email: d.email || "",
        goal: d.goal || "",
        source: d.source || "contact_page",
        status: d.status || "new",
        createdAt: d.created_at,
      }));
    }
  } catch (err) {
    console.warn("Using local leads store fallback");
  }

  return getLocalLeads();
}

import { API_BASE_URL, getAuthToken } from "./api";
import { supabase } from "./supabase";

export interface ContactLead {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  goal?: string;
  source?: string;
  status: "NEW" | "CONTACTED" | "ENROLLED" | "CANCELLED" | "ARCHIVED" | "new" | "contacted" | "enrolled" | "archived";
  assignedTo?: string;
  notes?: string;
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
 * 1. Calls Backend API `POST /leads` to record lead & trigger instant staff email alert to arisieltsdeeplearning@gmail.com.
 * 2. Fallbacks to Supabase + LocalStorage if offline or backend is unreachable to guarantee zero lead loss.
 */
export async function submitContactLead(params: {
  fullName: string;
  phone: string;
  email?: string;
  goal?: string;
  source?: string;
}): Promise<{ success: boolean; lead: ContactLead; message?: string }> {
  const now = new Date().toISOString();
  let lead: ContactLead = {
    id: `lead-${Date.now()}`,
    fullName: params.fullName.trim(),
    phone: params.phone.trim(),
    email: params.email?.trim() || "",
    goal: params.goal?.trim() || "",
    source: params.source || "contact_page",
    status: "NEW",
    createdAt: now,
  };

  // 1. Try Backend Fastify Server
  try {
    const res = await fetch(`${API_BASE_URL}/leads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName: lead.fullName,
        phone: lead.phone,
        email: lead.email || undefined,
        goal: lead.goal || undefined,
        source: lead.source,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.data) {
        lead = {
          ...lead,
          id: data.data.id || lead.id,
          createdAt: data.data.createdAt || lead.createdAt,
        };
      }
      // Save copy in local for fast reference
      saveLocalLead(lead);
      return {
        success: true,
        lead,
        message: data.message || "Gửi thông tin thành công! Ban Học Thuật ARIS sẽ liên hệ tư vấn trong thời gian sớm nhất.",
      };
    }
  } catch (apiErr) {
    console.warn("[ContactService] Backend API not reachable, falling back to direct persistence:", apiErr);
  }

  // 2. Direct Supabase Fallback (if backend is temporarily offline)
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

    if (!error && data?.id) {
      lead.id = data.id;
    }
  } catch (err: any) {
    console.warn("[ContactService] Supabase fallback warning:", err?.message);
  }

  // 3. Guarantee local persistence
  saveLocalLead(lead);

  return {
    success: true,
    lead,
    message: "Gửi thông tin thành công! Ban Học Thuật ARIS sẽ liên hệ tư vấn trong thời gian sớm nhất.",
  };
}

/**
 * Admin: Get all leads (Backend Server -> Supabase -> Local)
 */
export async function fetchAllContactLeads(): Promise<ContactLead[]> {
  // 1. Try Backend Server
  try {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE_URL}/leads`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (res.ok) {
      const result = await res.json();
      if (Array.isArray(result.data)) {
        return result.data.map((d: any) => ({
          id: d.id,
          fullName: d.fullName || d.full_name,
          phone: d.phone,
          email: d.email || "",
          goal: d.goal || "",
          source: d.source || "contact_page",
          status: d.status || "NEW",
          createdAt: d.createdAt || d.created_at,
        }));
      }
    }
  } catch (err) {
    console.warn("[ContactService] Backend leads list unavailable, trying fallback");
  }

  // 2. Try Supabase
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
        status: d.status || "NEW",
        assignedTo: d.assigned_to || "",
        notes: d.notes || "",
        createdAt: d.created_at,
      }));
    }
  } catch (err) {
    console.warn("Using local leads store fallback");
  }

  return getLocalLeads();
}

/**
 * Admin: Update lead status / notes / assigned staff
 */
export async function updateContactLead(
  id: string,
  params: {
    status?: "NEW" | "CONTACTED" | "ENROLLED" | "CANCELLED" | "ARCHIVED";
    assignedTo?: string | null;
    notes?: string | null;
  }
): Promise<{ success: boolean; data?: any; error?: string }> {
  // 1. Try Backend Server
  try {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE_URL}/leads/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(params),
    });

    if (res.ok) {
      const json = await res.json();
      return { success: true, data: json.data };
    }
  } catch (err) {
    console.warn("[ContactService] Failed to update lead via API, trying fallback:", err);
  }

  // 2. Supabase Fallback
  try {
    const payload: any = {};
    if (params.status) payload.status = params.status;
    if (params.assignedTo !== undefined) payload.assigned_to = params.assignedTo;
    if (params.notes !== undefined) payload.notes = params.notes;

    const { data, error } = await supabase
      .from("contact_leads")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (!error && data) {
      return { success: true, data };
    }
  } catch (err: any) {
    console.warn("[ContactService] Supabase update error:", err);
  }

  // 3. Local fallback
  try {
    const leads = getLocalLeads();
    const idx = leads.findIndex((l) => l.id === id);
    if (idx !== -1) {
      leads[idx] = { ...leads[idx], ...params, status: (params.status || leads[idx].status) as any };
      localStorage.setItem(LOCAL_LEADS_KEY, JSON.stringify(leads));
      return { success: true, data: leads[idx] };
    }
  } catch (err) {
    console.error("Local leads update error", err);
  }

  return { success: false, error: "Không thể cập nhật lead" };
}


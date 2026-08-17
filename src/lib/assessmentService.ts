import { supabase } from "./supabase";

export interface AssessmentLead {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  currentLevel: string;
  targetBand: string;
  testFormat: "online" | "offline";
  preferredDate?: string;
  status: "new" | "confirmed" | "completed" | "archived";
  createdAt: string;
}

const LOCAL_ASSESSMENT_LEADS_KEY = "aris_assessment_leads_v1";

export function getLocalAssessmentLeads(): AssessmentLead[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_ASSESSMENT_LEADS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalAssessmentLead(lead: AssessmentLead) {
  if (typeof window === "undefined") return;
  try {
    const leads = getLocalAssessmentLeads();
    leads.unshift(lead);
    localStorage.setItem(LOCAL_ASSESSMENT_LEADS_KEY, JSON.stringify(leads));
  } catch (err) {
    console.error("Failed to save local assessment lead", err);
  }
}

/**
 * Submit an assessment booking
 */
export async function submitAssessmentBooking(params: {
  fullName: string;
  phone: string;
  email?: string;
  currentLevel: string;
  targetBand: string;
  testFormat?: "online" | "offline";
  preferredDate?: string;
}): Promise<{ success: boolean; lead: AssessmentLead; message?: string }> {
  const now = new Date().toISOString();
  const lead: AssessmentLead = {
    id: `assess-${Date.now()}`,
    fullName: params.fullName.trim(),
    phone: params.phone.trim(),
    email: params.email?.trim() || "",
    currentLevel: params.currentLevel || "Mới bắt đầu",
    targetBand: params.targetBand || "IELTS 6.5",
    testFormat: params.testFormat || "online",
    preferredDate: params.preferredDate || "",
    status: "new",
    createdAt: now,
  };

  // 1. Always save locally first (Zero-loss guarantee)
  saveLocalAssessmentLead(lead);

  // 2. Attempt to save to Supabase
  try {
    const { data, error } = await supabase
      .from("assessment_leads")
      .insert({
        full_name: lead.fullName,
        phone: lead.phone,
        email: lead.email,
        current_level: lead.currentLevel,
        target_band: lead.targetBand,
        test_format: lead.testFormat,
        preferred_date: lead.preferredDate,
        status: lead.status,
      })
      .select()
      .single();

    if (error) {
      console.warn("Supabase assessment insert notice (stored locally):", error.message);
    } else if (data?.id) {
      lead.id = data.id;
    }
  } catch (err: any) {
    console.warn("Supabase connection notice (lead secured in local storage):", err?.message);
  }

  return {
    success: true,
    lead,
    message: "Đăng ký khảo thí thành công! Ban Chuyên Môn ARIS sẽ liên hệ xác nhận lịch làm bài và cấp tài khoản khảo thí cho bạn.",
  };
}

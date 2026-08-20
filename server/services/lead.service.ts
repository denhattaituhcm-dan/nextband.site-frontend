import { PrismaClient, LeadStatus } from "@prisma/client";
import { CreateLeadInput, UpdateLeadInput, ListLeadsQuery } from "../schemas/lead.schema.js";
import { leadNotificationService } from "./leadNotification.service.js";

export class LeadService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new contact lead and trigger instant notification
   */
  async createLead(input: CreateLeadInput) {
    const lead = await this.prisma.contactLead.create({
      data: {
        fullName: input.fullName,
        phone: input.phone,
        email: input.email && input.email.length > 0 ? input.email : null,
        goal: input.goal && input.goal.length > 0 ? input.goal : null,
        source: input.source || "contact_page",
        status: LeadStatus.NEW,
      },
    });

    // Asynchronously dispatch instant email notification (won't block HTTP response)
    leadNotificationService.notifyNewLead({
      id: lead.id,
      fullName: lead.fullName,
      phone: lead.phone,
      email: lead.email,
      goal: lead.goal,
      source: lead.source,
      createdAt: lead.createdAt,
    }).catch((err) => {
      console.error("[LeadService] Notification trigger error:", err);
    });

    return lead;
  }

  /**
   * List leads with pagination and search filters
   */
  async listLeads(query: ListLeadsQuery) {
    const { page, limit, status, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.contactLead.count({ where }),
      this.prisma.contactLead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get single lead by ID
   */
  async getLeadById(id: string) {
    return this.prisma.contactLead.findUnique({
      where: { id },
    });
  }

  /**
   * Update lead status / notes / assigned staff
   */
  async updateLead(id: string, input: UpdateLeadInput) {
    const data: any = {};
    if (input.status !== undefined) data.status = input.status as LeadStatus;
    if (input.assignedTo !== undefined) data.assignedTo = input.assignedTo;
    if (input.notes !== undefined) data.notes = input.notes;

    return this.prisma.contactLead.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete lead
   */
  async deleteLead(id: string) {
    return this.prisma.contactLead.delete({
      where: { id },
    });
  }
}

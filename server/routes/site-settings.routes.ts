import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { authenticate, requireRoles } from "../middlewares/auth.middleware.js";

const SETTINGS_KEY = "global";

const strictInt = (min: number, max: number) =>
  z.preprocess((val) => {
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (trimmed === "") return undefined;
      const num = Number(trimmed);
      return Number.isInteger(num) ? num : val;
    }
    return val;
  }, z.number().int().min(min).max(max).optional());

const strictFloat = (min: number, max: number) =>
  z.preprocess((val) => {
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (trimmed === "") return undefined;
      const num = Number(trimmed);
      return Number.isFinite(num) ? num : val;
    }
    return val;
  }, z.number().min(min).max(max).optional());

const updateSiteSettingsSchema = z
  .object({
    id: z.string().optional(),
    key: z.string().optional(),
    value: z.record(z.unknown()).optional(),
    siteName: z.string().max(255).optional(),
    logoUrl: z.string().max(5000).nullable().optional(),
    zaloLink: z.string().max(500).nullable().optional(),
    completedLessonsStat: z.string().max(50).nullable().optional(),
    authTagline: z.string().max(120).nullable().optional(),
    authFeatureOneTitle: z.string().max(120).nullable().optional(),
    authFeatureOneDescription: z.string().max(160).nullable().optional(),
    authFeatureTwoTitle: z.string().max(120).nullable().optional(),
    authFeatureTwoDescription: z.string().max(160).nullable().optional(),
    highlightPresent: z.string().max(20).nullable().optional(),
    highlightAbsent: z.string().max(20).nullable().optional(),
    highlightInactive: z.string().max(20).nullable().optional(),
    sloganText: z.string().max(100).nullable().optional(),
    sloganFontFamily: z.string().max(191).nullable().optional(),
    sloganFontWeight: z.enum(["light", "regular", "bold"]).optional(),
    sloganDesktopSize: strictInt(20, 96),
    sloganMobileSize: strictInt(14, 72),
    sloganColor: z.string().max(20).nullable().optional(),
    sloganAlign: z.enum(["left", "center", "right"]).optional(),
    sloganLineHeight: strictFloat(1, 2),
    heroDescriptionText: z.string().max(300).nullable().optional(),
    heroDescriptionFontFamily: z.string().max(191).nullable().optional(),
    heroDescriptionFontWeight: z.enum(["light", "regular", "bold"]).optional(),
    heroDescriptionDesktopSize: strictInt(14, 56),
    heroDescriptionMobileSize: strictInt(12, 40),
    heroDescriptionColor: z.string().max(20).nullable().optional(),
    heroDescriptionAlign: z.enum(["left", "center", "right"]).optional(),
    heroDescriptionLineHeight: strictFloat(1, 2.2),
    updatedBy: z.string().optional(),
    updatedAt: z.union([z.string(), z.date()]).optional(),
    createdAt: z.union([z.string(), z.date()]).optional(),
  })
  .strict({
    message: "Dữ liệu gửi lên chứa trường cài đặt không được hỗ trợ",
  });

function normalizeSettings(record: any) {
  const val =
    record && typeof record.value === "object" && record.value !== null
      ? record.value
      : record || {};
  return {
    id: record?.id || "global",
    siteName: val.siteName || "NextBand",
    logoUrl: val.logoUrl || "",
    zaloLink: val.zaloLink || "https://zalo.me",
    completedLessonsStat: val.completedLessonsStat || "5,000+",
    authTagline: val.authTagline || "Nền tảng học IELTS hiện đại",
    authFeatureOneTitle: val.authFeatureOneTitle || "Khóa học chất lượng",
    authFeatureOneDescription:
      val.authFeatureOneDescription ||
      "Hàng trăm bài học từ cơ bản đến nâng cao",
    authFeatureTwoTitle: val.authFeatureTwoTitle || "Giáo viên uy tín",
    authFeatureTwoDescription:
      val.authFeatureTwoDescription || "Đội ngũ giáo viên giàu kinh nghiệm",
    highlightPresent: val.highlightPresent || "#fff7a5",
    highlightAbsent: val.highlightAbsent || "#ffd7d7",
    highlightInactive: val.highlightInactive || "#e5e7eb",
    sloganText: val.sloganText || "Khám phá khóa học IELTS",
    sloganFontFamily: val.sloganFontFamily || "Be Vietnam Pro",
    sloganFontWeight: val.sloganFontWeight || "bold",
    sloganDesktopSize: Number(val.sloganDesktopSize ?? 56),
    sloganMobileSize: Number(val.sloganMobileSize ?? 34),
    sloganColor: val.sloganColor || "#0f172a",
    sloganAlign: val.sloganAlign || "left",
    sloganLineHeight: Number(val.sloganLineHeight ?? 1.2),
    heroDescriptionText:
      val.heroDescriptionText ||
      "Nâng cao kỹ năng tiếng Anh của bạn với các khóa học được thiết kế bởi đội ngũ giáo viên giàu kinh nghiệm.",
    heroDescriptionFontFamily: val.heroDescriptionFontFamily || "Be Vietnam Pro",
    heroDescriptionFontWeight: val.heroDescriptionFontWeight || "regular",
    heroDescriptionDesktopSize: Number(val.heroDescriptionDesktopSize ?? 30),
    heroDescriptionMobileSize: Number(val.heroDescriptionMobileSize ?? 20),
    heroDescriptionColor: val.heroDescriptionColor || "#64748b",
    heroDescriptionAlign: val.heroDescriptionAlign || "left",
    heroDescriptionLineHeight: Number(val.heroDescriptionLineHeight ?? 1.6),
    updatedAt: record?.updatedAt || new Date().toISOString(),
  };
}

const siteSettingsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/", async () => {
    let setting = await fastify.prisma.siteSettings.findFirst({
      where: { key: SETTINGS_KEY },
    });
    if (!setting) {
      setting = await fastify.prisma.siteSettings.create({
        data: {
          key: SETTINGS_KEY,
          value: normalizeSettings({}),
        },
      });
    }
    return normalizeSettings(setting);
  });

  fastify.put(
    "/",
    { preHandler: [authenticate, requireRoles("admin")] },
    async (request, reply) => {
      const parseResult = updateSiteSettingsSchema.safeParse(request.body);
      if (!parseResult.success) {
        const issues = parseResult.error.issues;
        const unrecognizedKeys = issues
          .filter((i) => i.code === "unrecognized_keys")
          .flatMap((i: any) => i.keys || []);

        const errorMsg =
          unrecognizedKeys.length > 0
            ? `Trường không được hỗ trợ: ${unrecognizedKeys.join(", ")}`
            : issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");

        return reply.status(400).send({
          error: errorMsg,
          details: issues,
        });
      }

      const body = parseResult.data;
      let current = await fastify.prisma.siteSettings.findFirst({
        where: { key: SETTINGS_KEY },
      });

      const currentValue =
        current && typeof current.value === "object" && current.value !== null
          ? (current.value as Record<string, unknown>)
          : {};

      const newValue = {
        ...currentValue,
        ...Object.fromEntries(
          Object.entries(body).filter(([, val]) => val !== undefined),
        ),
      };

      const updated = current
        ? await fastify.prisma.siteSettings.update({
            where: { id: current.id },
            data: { value: newValue as any },
          })
        : await fastify.prisma.siteSettings.create({
            data: { key: SETTINGS_KEY, value: newValue as any },
          });

      return normalizeSettings(updated);
    },
  );
};

export default siteSettingsRoutes;

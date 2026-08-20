import { FastifyPluginAsync, FastifyRequest } from "fastify";
import { createWriteStream, existsSync, mkdirSync, unlinkSync } from "fs";
import { join, extname } from "path";
import { pipeline } from "stream/promises";
import { randomUUID } from "crypto";
import { authenticate, requireRoles } from "../middlewares/auth.middleware.js";
import { env } from "../config/env.js";
import { toFileUrl } from "../utils/file.js";
import { AuthorizationService, AuthorizationError } from "../services/authorization.service.js";

// Allowed file types
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
  "audio/webm",
];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_AUDIO_TYPES];

// Get upload directory path
function getUploadDir(subDir?: string): string {
  const baseDir = join(process.cwd(), env.UPLOAD_DIR);
  const targetDir = subDir ? join(baseDir, subDir) : baseDir;

  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }

  return targetDir;
}

// Generate unique filename
function generateFileName(originalName: string): string {
  const ext = extname(originalName);
  return `${Date.now()}-${randomUUID()}${ext}`;
}

const uploadsRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /uploads - Upload single file
  fastify.post(
    "/",
    { preHandler: authenticate },
    async (request: FastifyRequest, reply) => {
      const data = await (request as any).file();

      if (!data) {
        return reply
          .status(400)
          .send({ error: "Không có tệp nào được tải lên" });
      }

      // Check file type
      if (!ALLOWED_TYPES.includes(data.mimetype)) {
        return reply.status(400).send({
          error: "Loại tệp không hợp lệ",
          allowedTypes: ALLOWED_TYPES,
        });
      }

      // Determine subdirectory based on file type
      const isImage = ALLOWED_IMAGE_TYPES.includes(data.mimetype);
      const subDir = isImage ? "images" : "audio";

      const uploadDir = getUploadDir(subDir);
      const fileName = generateFileName(data.filename);
      const filePath = join(uploadDir, fileName);

      try {
        // Save file
        await pipeline(data.file, createWriteStream(filePath));

        // Generate URL (full URL để FE dùng trực tiếp)
        const relativePath = `/uploads/${subDir}/${fileName}`;

        return {
          url: toFileUrl(relativePath),
          fileName,
          mimeType: data.mimetype,
          size: data.file.bytesRead,
        };
      } catch (err) {
        fastify.log.error(err);
        return reply.status(500).send({ error: "Tải tệp lên thất bại" });
      }
    },
  );

  // POST /uploads/image - Upload image specifically
  fastify.post(
    "/image",
    { preHandler: authenticate },
    async (request: FastifyRequest, reply) => {
      const data = await (request as any).file();

      if (!data) {
        return reply
          .status(400)
          .send({ error: "Không có tệp nào được tải lên" });
      }

      if (!ALLOWED_IMAGE_TYPES.includes(data.mimetype)) {
        return reply.status(400).send({
          error: "Loại hình ảnh không hợp lệ",
          allowedTypes: ALLOWED_IMAGE_TYPES,
        });
      }

      const uploadDir = getUploadDir("images");
      const fileName = generateFileName(data.filename);
      const filePath = join(uploadDir, fileName);

      try {
        await pipeline(data.file, createWriteStream(filePath));

        return {
          url: toFileUrl(`/uploads/images/${fileName}`),
          fileName,
          mimeType: data.mimetype,
        };
      } catch (err) {
        fastify.log.error(err);
        return reply.status(500).send({ error: "Tải tệp lên thất bại" });
      }
    },
  );

  // POST /uploads/audio - Upload audio specifically
  fastify.post(
    "/audio",
    { preHandler: authenticate },
    async (request: FastifyRequest, reply) => {
      const data = await (request as any).file();

      if (!data) {
        return reply
          .status(400)
          .send({ error: "Không có tệp nào được tải lên" });
      }

      if (!ALLOWED_AUDIO_TYPES.includes(data.mimetype)) {
        return reply.status(400).send({
          error: "Loại âm thanh không hợp lệ",
          allowedTypes: ALLOWED_AUDIO_TYPES,
        });
      }

      const uploadDir = getUploadDir("audio");
      const fileName = generateFileName(data.filename);
      const filePath = join(uploadDir, fileName);

      try {
        await pipeline(data.file, createWriteStream(filePath));

        return {
          url: toFileUrl(`/uploads/audio/${fileName}`),
          fileName,
          mimeType: data.mimetype,
        };
      } catch (err) {
        fastify.log.error(err);
        return reply.status(500).send({ error: "Failed to upload file" });
      }
    },
  );

  // DELETE /uploads - Delete file (admin only)
  fastify.delete(
    "/",
    { preHandler: [authenticate, requireRoles("admin")] },
    async (request, reply) => {
      const { url } = (request.body || {}) as { url?: string };

      if (!url || typeof url !== "string") {
        return reply.status(400).send({ error: "Yêu cầu URL tệp cần xóa" });
      }

      // Decode URL safely to prevent encoded path traversal like %2e%2e
      let decodedUrl: string;
      try {
        decodedUrl = decodeURIComponent(url);
        // Second decode in case of double-encoding %252e
        if (decodedUrl.includes("%")) {
          try {
            decodedUrl = decodeURIComponent(decodedUrl);
          } catch {
            // keep previous decoded
          }
        }
      } catch {
        return reply.status(400).send({ error: "URL không hợp lệ" });
      }

      // Check if URL contains obvious path traversal patterns before regex
      if (decodedUrl.includes("..") || decodedUrl.includes(":\\") || decodedUrl.includes(":/")) {
        // Return 400 immediately on traversal attempt
        return reply.status(400).send({ error: "Đường dẫn chứa ký tự không hợp lệ" });
      }

      // Parse file path from URL
      const match = decodedUrl.match(/\/uploads\/(images|audio)\/(.+)/);
      if (!match) {
        return reply.status(400).send({ error: "URL tệp không đúng định dạng /uploads/(images|audio)/..." });
      }

      const [, subDir, rawFileName] = match;
      const baseUploadDir = join(process.cwd(), env.UPLOAD_DIR);
      const authService = new AuthorizationService(fastify.prisma);

      let filePath: string;
      try {
        filePath = authService.validateUploadPathBoundary({
          subDir,
          rawFileName,
          baseUploadDir,
        });
      } catch (err: any) {
        const statusCode = err instanceof AuthorizationError ? err.statusCode : 400;
        return reply.status(statusCode).send({ error: err.message || "Tệp không hợp lệ" });
      }

      try {
        if (existsSync(filePath)) {
          unlinkSync(filePath);
          return { success: true, message: "Đã xóa tệp thành công" };
        } else {
          return reply.status(404).send({ error: "Không tìm thấy tệp" });
        }
      } catch (err) {
        fastify.log.error(err);
        return reply.status(500).send({ error: "Xóa tệp thất bại" });
      }
    },
  );
};

export default uploadsRoutes;

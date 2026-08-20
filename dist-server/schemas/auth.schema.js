import { z } from "zod";
export const loginSchema = z.object({
    email: z.string().email("Định dạng email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});
export const registerSchema = z.object({
    email: z.string().email("Định dạng email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
    fullName: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
});
export const googleLoginSchema = z.object({
    credential: z.string().min(1, "Yêu cầu thông tin xác thực"),
});

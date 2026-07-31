# Dead Code Summary

Total findings:
- Files: 23
- Components: 19
- Functions: 8
- Variables: 5
- Legacy code: 4

---

# CATEGORY 1: SAFE TO REMOVE

| Path | Type | Reason | Confidence |
|---|---|---|---|
| `src/components/courses/CourseFilters.tsx` | Unused Component File | Component lọc khóa học không được import hoặc sử dụng ở bất kỳ đâu trong `src/` | 100% |
| `src/layouts/AuthLayout.tsx` | Unused Layout File | Component Layout cho trang Auth không được import trong `App.tsx` hay router | 100% |
| `src/hooks/useServerPagination.ts` | Unused Hook File | Custom hook phân trang server side không có import hay call sites nào | 100% |
| `src/components/ui/alert.tsx` | Unused UI Component | Component UI Shadcn (nhầm lẫn với `alert-dialog.tsx`), 0 references | 100% |
| `src/components/ui/aspect-ratio.tsx` | Unused UI Component | Component UI Shadcn không được import | 100% |
| `src/components/ui/breadcrumb.tsx` | Unused UI Component | Component UI Shadcn không được import | 100% |
| `src/components/ui/calendar.tsx` | Unused UI Component | Component UI Shadcn không được import | 100% |
| `src/components/ui/carousel.tsx` | Unused UI Component | Component UI Shadcn không được import | 100% |
| `src/components/ui/chart.tsx` | Unused UI Component | Component UI Shadcn chứa Recharts wrapper không được import | 100% |
| `src/components/ui/collapsible.tsx` | Unused UI Component | Component UI Shadcn không được import | 100% |
| `src/components/ui/command.tsx` | Unused UI Component | Component UI Shadcn (CmdK) không được import | 100% |
| `src/components/ui/context-menu.tsx` | Unused UI Component | Component UI Shadcn không được import | 100% |
| `src/components/ui/drawer.tsx` | Unused UI Component | Component UI Shadcn (Vaul) không được import | 100% |
| `src/components/ui/hover-card.tsx` | Unused UI Component | Component UI Shadcn không được import | 100% |
| `src/components/ui/input-otp.tsx` | Unused UI Component | Component UI Shadcn không được import | 100% |
| `src/components/ui/menubar.tsx` | Unused UI Component | Component UI Shadcn không được import | 100% |
| `src/components/ui/navigation-menu.tsx` | Unused UI Component | Component UI Shadcn không được import | 100% |
| `src/components/ui/pagination.tsx` | Unused UI Component | Component UI Shadcn (khác với `DataTablePagination` và `QuestionPagination`) 0 references | 100% |
| `src/components/ui/resizable.tsx` | Unused UI Component | Component UI Shadcn không được import | 100% |
| `src/components/ui/use-toast.ts` | Unused Re-export Stub | Re-export stub 4 dòng từ `@/hooks/use-toast`, không có nơi nào import từ path này | 100% |
| `src/lib/api.ts` -> `authApi.verifyPassword` | Unused API Helper | Hàm stub trả về `{ valid: true }`, không có reference | 100% |
| `src/lib/api.ts` -> `enrollmentsApi.enroll` | Unused API Helper | Hàm đăng ký khóa học cho user hiện tại không được gọi (UI dùng `enrollUser`) | 100% |
| `src/lib/api.ts` -> `enrollmentsApi.updateProgress` | Unused API Helper | Hàm cập nhật % tiến độ không được gọi ở đâu | 100% |
| `src/lib/api.ts` -> `enrollmentsApi.unenroll` | Unused API Helper | Hàm trùng lặp với `enrollmentsApi.delete`, không được gọi ở đâu | 100% |
| `src/lib/api.ts` -> `statsApi.getMonthlyAttendance` | Unused API Helper | Hàm stub trả về dữ liệu ảo điểm danh tháng, không được gọi ở đâu | 100% |
| `package.json` -> `axios` | Unused Dependency | Thư viện HTTP client dư thừa, dự án dùng `fetch` & `@supabase/supabase-js` | 100% |
| `package.json` -> `jwt-decode` | Unused Dependency | Thư viện decode JWT không có import nào trong `src/` | 100% |
| `package.json` -> `lovable-tagger` | Unused Dev Dependency | Thư viện dev tagger không được import hay cấu hình trong `vite.config.ts` | 100% |

---

# CATEGORY 2: REVIEW REQUIRED

| Path | Type | Risk | Why |
|---|---|---|---|
| `src/hooks/useAuth.tsx` (dòng 167-185 & check `localStorage`) | Hardcoded Mock Auth Bypass | Medium | Hàm `signIn` ghi đè hoàn toàn Supabase Auth bằng mock user `nextband_mock_user` để test local. Nếu xóa mà chưa cấu hình Auth thật thì sẽ không login được |
| `src/App.tsx` (dòng 288) | Duplicate Unreachable Route | Low | Route `/admin/teachers` bị định nghĩa trùng 2 lần. Route thứ nhất (dòng 232) render `AdminTeachers`, làm route redirect thứ hai (dòng 288) không bao giờ chạy tới |
| `.env` & `src/main.tsx` | Missing Env Variable | Low | Variable `VITE_GOOGLE_CLIENT_ID` được tham chiếu trong `main.tsx` nhưng chưa được khai báo trong `.env` |
| `package.json` (`recharts`, `vaul`, `cmdk`, `embla-carousel-react`, `input-otp`, `react-resizable-panels`, `@radix-ui/*`) | Unused Dependencies via Dead UI Components | Low | Các gói npm này chỉ được dùng bởi các UI Component Shadcn chết (Category 1). Nếu xóa các UI component đó thì các gói npm này trở thành dead dependencies |

---

# CATEGORY 3: FRAMEWORK DEPENDENCY

| Path | Reason |
|---|---|
| `vite.config.ts` | Cấu hình build & alias `@` for Vite (Bắt buộc) |
| `vitest.config.ts` | Cấu hình test runner Vitest |
| `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json` | Cấu hình TypeScript compiler |
| `tailwind.config.ts` / `postcss.config.js` | Cấu hình TailwindCSS v3 & Autoprefixer |
| `eslint.config.js` | Cấu hình Linter cho JS/TS |
| `components.json` | Cấu hình CLI cho Shadcn UI generator |
| `index.html` | Entry HTML file của Vite app |
| `src/main.tsx` | Entry React mounting script |
| `src/vite-env.d.ts` | Type declarations cho Vite environment |
| `src/integrations/` | Thư mục trống tạo sẵn bởi framework/starter template |

---

# CATEGORY 4: LEGACY SYSTEM

| Path | Old Purpose | Current Status |
|---|---|---|
| `etl_migration.mjs` | Script ETL migrate dữ liệu từ MySQL/SQL dump cũ sang Supabase | Script chạy 1 lần ở root, chứa hardcoded credentials Supabase & đường dẫn local `d:\handover...` |
| `seed.mjs` | Script seed dữ liệu 9 khóa học ban đầu | Script chạy 1 lần ở root, chứa hardcoded credentials Supabase |
| `upload_assets.mjs` | Script upload file audio/image local lên Supabase Storage | Script chạy 1 lần ở root, chứa hardcoded credentials & đường dẫn local `d:\handover...` |
| `schema.sql` | SQL file chứa DDL khởi tạo DB schema ban đầu | SQL script lưu giữ lịch sử DB, không dùng trong runtime |
| `src/pages/admin/LogViewer.tsx` & `src/lib/api.ts` (`logsApi`) | Trang xem log server thời gian thực của kiến trúc backend cũ | `logsApi` hiện trả về chuỗi cố định `"Log Viewer is disabled in serverless deployment."` do chuyển sang Supabase serverless |

---

## Additional Analysis

### Nhóm 1: Các File & Component UI Shadcn không sử dụng (`src/components/ui/*`, `CourseFilters.tsx`, `AuthLayout.tsx`, `useServerPagination.ts`)
1. **Mục đích ban đầu & Hiện trạng**: 
   - Được tạo tự động khi khởi tạo dự án hoặc chạy Shadcn UI CLI (`npx shadcn@latest add --all`).
   - Hiện trạng: Hoàn toàn không được import ở bất kỳ đâu trong `src/`.
2. **Tại sao là Dead Code**: 
   - Không có import graph nào dẫn tới các file này.
3. **Rủi ro tác động**: 
   - Xóa an toàn 100%, giúp giảm số lượng file, rút ngắn thời gian build và giảm kích thước bundle.
4. **Phương án xử lý**: 
   - Xóa các file component và hook này khỏi cây thư mục.

### Nhóm 2: Các Script Migration & Root Data Seed (`etl_migration.mjs`, `seed.mjs`, `upload_assets.mjs`, `schema.sql`)
1. **Mục đích ban đầu & Hiện trạng**: 
   - Là các công cụ hỗ trợ chuyển đổi dữ liệu (ETL), khởi tạo DB và upload tài nguyên đợt đầu khi dev dựng hệ thống.
   - Hiện trạng: Nằm ở root directory, có chứa hardcoded API key (Anon JWT) và đường dẫn tuyệt đối Windows local.
2. **Tại sao là Legacy Code**: 
   - Không thuộc luồng build của Vite (không được khai báo trong `package.json` scripts hay `vite.config.ts`).
3. **Rủi ro tác động**: 
   - Giữ lại gây rủi ro bảo mật (lộ JWT key/đường dẫn hệ thống) và gây rác codebase. Xóa không ảnh hưởng ứng dụng web.
4. **Phương án xử lý**: 
   - Xóa bỏ hoặc lưu trữ riêng vào thư mục tài liệu/devops bên ngoài dự án app.

### Nhóm 3: Hệ thống Log Viewer cũ (`LogViewer.tsx` & `logsApi`)
1. **Mục đích ban đầu & Hiện trạng**: 
   - Đọc file log trên server Express/Node.js cũ.
   - Hiện trạng: Dự án đã chuyển sang Supabase Serverless, `logsApi` trả về chuỗi thông báo "Log Viewer is disabled in serverless deployment".
2. **Tại sao là Legacy Code**: 
   - Tính năng bị vô hiệu hóa hoàn toàn về mặt kỹ thuật.
3. **Rủi ro tác động**: 
   - Trang `/admin/logs` vẫn có route nhưng chỉ hiển thị thông báo log đã bị disable.
4. **Phương án xử lý**: 
   - Nếu không có kế hoạch tích hợp Supabase Log Drains hay dịch vụ log bên thứ 3, có thể xóa trang `LogViewer.tsx`, gỡ route `/admin/logs` và gỡ `logsApi`.

### Nhóm 4: Mock Authentication & Duplicate Route (`useAuth.tsx` & `App.tsx`)
1. **Mục đích ban đầu & Hiện trạng**: 
   - Mock Auth trong `useAuth.tsx` dùng để bypass login khi test UI local mà không cần mật khẩu Supabase thật.
   - Route `/admin/teachers` bị khai báo 2 lần trong `App.tsx` (1 lần render `AdminTeachers`, 1 lần `Navigate` sang `/admin/users?role=teacher`).
2. **Tại sao là Review Required**: 
   - Mock Auth nếu vô tình đẩy lên Production sẽ làm mất tính bảo mật của tính năng đăng nhập.
   - Route trùng làm code khó bảo trì.
3. **Rủi ro tác động**: 
   - Cần đảm bảo hệ thống Auth thật của Supabase đã sẵn sàng trước khi gỡ bypass mock auth.
4. **Phương án xử lý**: 
   - Xóa dòng route thừa (dòng 288 `App.tsx`).
   - Chuyển cơ chế Mock Auth thành flag điều kiện môi trường (`import.meta.env.DEV`) thay vì mặc định ghi đè.

---

## Cleanup Priority

### P0: Có thể xóa an toàn (Safe to Delete Immediately)
- `src/components/courses/CourseFilters.tsx`
- `src/layouts/AuthLayout.tsx`
- `src/hooks/useServerPagination.ts`
- 17 file Shadcn UI Components không dùng: `alert.tsx`, `aspect-ratio.tsx`, `breadcrumb.tsx`, `calendar.tsx`, `carousel.tsx`, `chart.tsx`, `collapsible.tsx`, `command.tsx`, `context-menu.tsx`, `drawer.tsx`, `hover-card.tsx`, `input-otp.tsx`, `menubar.tsx`, `navigation-menu.tsx`, `pagination.tsx`, `resizable.tsx`, `use-toast.ts`
- 5 hàm API không dùng trong `src/lib/api.ts`: `authApi.verifyPassword`, `enrollmentsApi.enroll`, `enrollmentsApi.updateProgress`, `enrollmentsApi.unenroll`, `statsApi.getMonthlyAttendance`
- 3 npm dependencies dư thừa trong `package.json`: `axios`, `jwt-decode`, `lovable-tagger`
- Dòng route thừa `/admin/teachers` (dòng 288 trong `src/App.tsx`)

### P1: Cần review trước khi xóa (Review Required)
- `etl_migration.mjs`, `seed.mjs`, `upload_assets.mjs` (Lưu archive devops trước khi xóa khỏi root)
- `src/pages/admin/LogViewer.tsx` & `logsApi` (Xác nhận xem có cần tính năng Log Viewer trên Cloud Supabase không trước khi gỡ)
- Mock authentication bypass trong `src/hooks/useAuth.tsx` (Chuyển thành dev flag `import.meta.env.DEV`)
- Các gói npm UI phụ thuộc (`recharts`, `vaul`, `cmdk`, `embla-carousel-react`, `input-otp`, `react-resizable-panels`) sau khi xóa các UI components ở P0

### P2: Giữ lại vì có khả năng dùng (Keep / Low Priority)
- `schema.sql` (Giữ lại làm tài liệu tham khảo DB Schema)
- Thư mục `src/integrations/` (Giữ lại nếu có kế hoạch kết nối thêm dịch vụ bên thứ 3)

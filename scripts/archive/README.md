# Legacy Scripts Archive

Thư mục này lưu trữ các script lịch sử được sử dụng trong giai đoạn đầu khởi tạo hệ thống và migration dữ liệu sang Supabase.

> ⚠️ **CẢNH BÁO BẢO MẬT & VẬN HÀNH**:
> - Các script trong thư mục này chứa API Key (Anon JWT) cũ và đường dẫn file cục bộ trên máy dev.
> - KHÔNG thực thi các script này trực tiếp trên môi trường Production mà không thay thế thông tin cấu hình qua biến môi trường.

---

### Danh sách script lưu trữ:

1. **`etl_migration.mjs`**
   - **Mục đích**: Script ETL đọc SQL dump MySQL cũ (`nextband_backup.sql`) và parse/insert dữ liệu ban đầu sang Supabase Database.
   - **Thời điểm sử dụng**: Khởi tạo database đợt đầu.

2. **`seed.mjs`**
   - **Mục đích**: Script seed danh sách 9 khóa học IELTS ban đầu (Dreamer, Builder, Master, Placement Test, ...) vào bảng `courses`.
   - **Thời điểm sử dụng**: Khởi tạo master data cho hệ thống.

3. **`upload_assets.mjs`**
   - **Mục đích**: Script quét thư mục local chứa file audio và image bài học (`uploads/audio`, `uploads/images`) để upload lên Supabase Storage bucket.
   - **Thời điểm sử dụng**: Migrate tài nguyên phương tiện đợt đầu.

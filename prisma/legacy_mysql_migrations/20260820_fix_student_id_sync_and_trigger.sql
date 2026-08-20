-- ============================================================================
-- ARIS / NEXTBAND - DATABASE IDENTITY NORMALIZATION & RLS POLICIES
-- Date: 2026-08-20
-- Target: Supabase PostgreSQL (auth schema & public schema)
-- ============================================================================

-- 1. ĐỒNG BỘ AN TOÀN BẢNG PROFILES (CASE-INSENSITIVE EMAIL)
UPDATE public.profiles p
SET user_id = u.id
FROM auth.users u
WHERE LOWER(TRIM(p.email)) = LOWER(TRIM(u.email))
  AND (p.user_id IS NULL OR p.user_id != u.id);

-- 2. XÓA BẢN GHI TRÙNG LẶP TRƯỚC KHI SYNC CLASS_STUDENTS (CHỐNG UNIQUE VIOLATION)
DELETE FROM public.class_students cs_old
USING auth.users u, public.profiles p, public.class_students cs_new
WHERE LOWER(TRIM(u.email)) = 'denhattaituhcm@gmail.com'
  AND LOWER(TRIM(p.email)) = LOWER(TRIM(u.email))
  AND cs_old.student_id IN (p.id, p.user_id)
  AND cs_new.student_id = u.id
  AND cs_old.class_id = cs_new.class_id
  AND cs_old.id != cs_new.id;

-- 3. CẬP NHẬT AN TOÀN STUDENT_ID SANG AUTH.USERS.ID CHO TÀI KHOẢN KẸT
UPDATE public.class_students cs
SET student_id = u.id
FROM auth.users u
JOIN public.profiles p ON (p.id = cs.student_id OR p.user_id = cs.student_id OR LOWER(TRIM(p.email)) = LOWER(TRIM(u.email)))
WHERE LOWER(TRIM(u.email)) = 'denhattaituhcm@gmail.com'
  AND cs.student_id != u.id;

-- 4. THIẾT LẬP TRIGGER AUTO-CLAIM TỰ ĐỘNG CHUẨN HÓA EMAIL TRÊN AUTH.USERS
CREATE OR REPLACE FUNCTION public.handle_user_auto_claim()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    -- Sync profiles
    UPDATE public.profiles
    SET user_id = NEW.id
    WHERE LOWER(TRIM(email)) = LOWER(TRIM(NEW.email))
      AND (user_id IS NULL OR user_id != NEW.id);

    -- Sync class_students
    UPDATE public.class_students cs
    SET student_id = NEW.id
    FROM public.profiles p
    WHERE LOWER(TRIM(p.email)) = LOWER(TRIM(NEW.email))
      AND (cs.student_id = p.id OR cs.student_id = p.user_id)
      AND cs.student_id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_auto_claim ON auth.users;
CREATE TRIGGER on_auth_user_created_auto_claim
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_auto_claim();

-- 5. BỔ SUNG ĐẦY ĐỦ RLS POLICIES CHO TẦNG 2 FALLBACK (CLASS_STUDENTS, CLASSES, COURSES)
ALTER TABLE public.class_students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow student read own classes" ON public.class_students;
CREATE POLICY "Allow student read own classes" 
ON public.class_students FOR SELECT 
TO authenticated
USING (
  student_id = auth.uid() 
  OR 
  student_id IN (
    SELECT id FROM public.profiles 
    WHERE LOWER(TRIM(email)) = LOWER(TRIM(auth.jwt() ->> 'email')) OR user_id = auth.uid()
  )
);

-- Cấp quyền đọc thông tin lớp cho authenticated user
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read classes" ON public.classes;
CREATE POLICY "Allow authenticated read classes" 
ON public.classes FOR SELECT 
TO authenticated 
USING (true);

-- Cấp quyền đọc thông tin khóa học cho authenticated user
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read courses" ON public.courses;
CREATE POLICY "Allow authenticated read courses" 
ON public.courses FOR SELECT 
TO authenticated 
USING (true);

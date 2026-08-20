-- =============================================
-- ENUMS
-- =============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'student');
CREATE TYPE public.exam_section_type AS ENUM ('listening', 'reading', 'writing', 'speaking', 'general');
CREATE TYPE public.question_type AS ENUM ('multiple_choice', 'fill_blank', 'matching', 'essay', 'speaking', 'short_answer', 'true_false_not_given', 'yes_no_not_given');
CREATE TYPE public.submission_status AS ENUM ('in_progress', 'submitted', 'graded');

-- =============================================
-- TABLES
-- =============================================

CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'student'::app_role,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  level TEXT NOT NULL DEFAULT 'beginner'::text,
  teacher_id UUID,
  price NUMERIC DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  syllabus JSONB DEFAULT '[]'::jsonb,
  slug TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL,
  student_id UUID NOT NULL,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  progress_percent INTEGER DEFAULT 0
);

CREATE TABLE public.exams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  week INTEGER DEFAULT 1,
  duration_minutes INTEGER DEFAULT 60,
  is_published BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  exam_type TEXT NOT NULL DEFAULT 'ielts'::text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.exam_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID NOT NULL,
  section_type exam_section_type NOT NULL,
  title TEXT NOT NULL,
  instructions TEXT,
  content JSONB DEFAULT '[]'::jsonb,
  audio_url TEXT,
  duration_minutes INTEGER,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.question_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID NOT NULL,
  title TEXT,
  instructions TEXT,
  passage TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL,
  question_type question_type NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT,
  points INTEGER DEFAULT 1,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.exam_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID NOT NULL,
  student_id UUID NOT NULL,
  status submission_status DEFAULT 'in_progress'::submission_status,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  total_score NUMERIC,
  graded_by UUID,
  graded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL,
  question_id UUID NOT NULL,
  answer_text TEXT,
  audio_url TEXT,
  score NUMERIC,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.highlights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID NOT NULL,
  student_id UUID NOT NULL,
  start_index INTEGER NOT NULL,
  end_index INTEGER NOT NULL,
  color TEXT DEFAULT 'yellow'::text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- FOREIGN KEYS
-- =============================================
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE public.courses ADD CONSTRAINT courses_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id);
ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);
ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id);
ALTER TABLE public.exams ADD CONSTRAINT exams_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);
ALTER TABLE public.exam_sections ADD CONSTRAINT exam_sections_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id);
ALTER TABLE public.question_groups ADD CONSTRAINT question_groups_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.exam_sections(id);
ALTER TABLE public.questions ADD CONSTRAINT questions_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.question_groups(id);
ALTER TABLE public.exam_submissions ADD CONSTRAINT exam_submissions_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id);
ALTER TABLE public.exam_submissions ADD CONSTRAINT exam_submissions_student_id_profiles_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(user_id);
ALTER TABLE public.answers ADD CONSTRAINT answers_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.exam_submissions(id);
ALTER TABLE public.answers ADD CONSTRAINT answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id);
ALTER TABLE public.highlights ADD CONSTRAINT highlights_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.exam_sections(id);
ALTER TABLE public.highlights ADD CONSTRAINT highlights_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id);

-- =============================================
-- RLS (Row Level Security)
-- =============================================

-- Disable restrictive RLS or grant full access to authenticated users across system tables
-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated full access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile or admins manage all" ON public.profiles;

CREATE POLICY "Users can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile or admins manage all" ON public.profiles FOR UPDATE USING (
  (auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role)
) WITH CHECK (
  (auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role)
);

-- user_roles (P0.1: Locked down - Student read-only for own role, admin/service write only)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated full access to user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles or admins/teachers view all" ON public.user_roles;
DROP POLICY IF EXISTS "Admins only can manage user_roles" ON public.user_roles;

CREATE POLICY "Users can view own roles or admins/teachers view all" ON public.user_roles FOR SELECT USING (
  (auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role)
);
CREATE POLICY "Admins only can manage user_roles" ON public.user_roles FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role)
) WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);

-- courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated full access to courses" ON public.courses;
DROP POLICY IF EXISTS "Allow anon select courses" ON public.courses;
DROP POLICY IF EXISTS "courses_select_policy" ON public.courses;
DROP POLICY IF EXISTS "courses_admin_write_policy" ON public.courses;
CREATE POLICY "courses_select_policy" ON public.courses FOR SELECT USING (
  is_published = true 
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'teacher'::app_role)
  OR EXISTS (SELECT 1 FROM public.enrollments en WHERE en.course_id = courses.id AND en.student_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.class_students cs JOIN public.classes c ON cs.class_id = c.id WHERE c.course_id = courses.id AND cs.student_id = auth.uid())
);
CREATE POLICY "courses_admin_write_policy" ON public.courses FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role)
) WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);

-- classes
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated full access to classes" ON public.classes;
DROP POLICY IF EXISTS "Allow anon select classes" ON public.classes;
DROP POLICY IF EXISTS "classes_select_policy" ON public.classes;
DROP POLICY IF EXISTS "classes_write_policy" ON public.classes;
CREATE POLICY "classes_select_policy" ON public.classes FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR teacher_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.class_students cs WHERE cs.class_id = classes.id AND cs.student_id = auth.uid())
);
CREATE POLICY "classes_write_policy" ON public.classes FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (has_role(auth.uid(), 'teacher'::app_role) AND teacher_id = auth.uid())
) WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR (has_role(auth.uid(), 'teacher'::app_role) AND teacher_id = auth.uid())
);

-- enrollments
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated full access to enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Users can view own enrollments or admins/teachers can view all" ON public.enrollments;
DROP POLICY IF EXISTS "Users can enroll themselves or admins can enroll anyone" ON public.enrollments;
DROP POLICY IF EXISTS "Users can update own enrollments or admins can update any" ON public.enrollments;
DROP POLICY IF EXISTS "Users can delete own enrollments or admins can delete any" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_select_policy" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_admin_write_policy" ON public.enrollments;
CREATE POLICY "enrollments_select_policy" ON public.enrollments FOR SELECT USING (
  student_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'teacher'::app_role)
);
CREATE POLICY "enrollments_admin_write_policy" ON public.enrollments FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role)
) WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);

-- exams
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins and teachers can manage exams" ON public.exams FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));
CREATE POLICY "Published exams viewable by enrolled students" ON public.exams FOR SELECT USING ((is_published = true) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));

-- exam_sections
ALTER TABLE public.exam_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins and teachers can manage sections" ON public.exam_sections FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));
CREATE POLICY "Sections viewable by authorized users only" ON public.exam_sections FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role) OR (
    EXISTS (
      SELECT 1 FROM exams e
      JOIN enrollments en ON en.course_id = e.course_id
      JOIN exam_submissions es ON es.exam_id = e.id AND es.student_id = auth.uid()
      WHERE e.id = exam_sections.exam_id AND en.student_id = auth.uid() AND e.is_published = true
    )
  )
);

-- exam_submissions (P0.3: Locked - Students cannot fabricate scores/status)
ALTER TABLE public.exam_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins and teachers can manage submissions" ON public.exam_submissions;
DROP POLICY IF EXISTS "Students can create own submissions" ON public.exam_submissions;
DROP POLICY IF EXISTS "Students can update own in-progress submissions" ON public.exam_submissions;
DROP POLICY IF EXISTS "Students can view own submissions" ON public.exam_submissions;

CREATE POLICY "Admins and teachers can manage submissions" ON public.exam_submissions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));
CREATE POLICY "Students can create own in-progress submissions" ON public.exam_submissions FOR INSERT WITH CHECK (
  student_id = auth.uid() AND (status = 'in_progress'::submission_status) AND (total_score IS NULL) AND (correct_answers IS NULL)
);
CREATE POLICY "Students can view own submissions" ON public.exam_submissions FOR SELECT USING (
  (student_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role)
);

-- question_groups
ALTER TABLE public.question_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins and teachers can manage groups" ON public.question_groups FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));
CREATE POLICY "Groups viewable with section access" ON public.question_groups FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role) OR (
    EXISTS (
      SELECT 1 FROM exam_sections es
      JOIN exams e ON es.exam_id = e.id
      WHERE es.id = question_groups.section_id
      AND e.is_published = true
      AND (
        e.is_open = true
        OR EXISTS (
          SELECT 1 FROM enrollments en
          WHERE en.course_id = e.course_id AND en.student_id = auth.uid()
        )
      )
    )
  )
);

-- questions (P0.2: Private table - Admin & Teacher only directly)
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins and teachers can manage questions" ON public.questions;
DROP POLICY IF EXISTS "Questions viewable by all" ON public.questions;

CREATE POLICY "Admins and teachers can manage questions" ON public.questions FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role)
);

-- Safe View for Students: filtered by enrollment / assignment / published exam
CREATE OR REPLACE VIEW public.student_exam_questions_view AS
SELECT
  q.id,
  q.group_id,
  q.question_type,
  q.question_text,
  q.options,
  q.points,
  q.order_index,
  q.audio_url,
  q.created_at,
  q.updated_at
FROM public.questions q
JOIN public.question_groups qg ON q.group_id = qg.id
JOIN public.exam_sections es ON qg.section_id = es.id
JOIN public.exams e ON es.exam_id = e.id
WHERE e.is_published = true
  AND (
    e.is_open = true
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'teacher'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.enrollments en
      WHERE en.course_id = e.course_id AND en.student_id = auth.uid()
    )
  );

GRANT SELECT ON public.student_exam_questions_view TO authenticated;

-- answers (P0.3: Students can only save answer_text / audio_url)
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins and teachers can manage answers" ON public.answers;
DROP POLICY IF EXISTS "Students can manage own answers" ON public.answers;
DROP POLICY IF EXISTS "Students can view own answers" ON public.answers;

CREATE POLICY "Admins and teachers can manage answers" ON public.answers FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));
CREATE POLICY "Students can upsert own answers in progress" ON public.answers FOR ALL USING (
  EXISTS (
    SELECT 1 FROM exam_submissions
    WHERE exam_submissions.id = answers.submission_id
    AND exam_submissions.student_id = auth.uid()
    AND exam_submissions.status = 'in_progress'::submission_status
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM exam_submissions
    WHERE exam_submissions.id = answers.submission_id
    AND exam_submissions.student_id = auth.uid()
    AND exam_submissions.status = 'in_progress'::submission_status
  )
  AND (score IS NULL)
);

CREATE POLICY "Students can view own answers" ON public.answers FOR SELECT USING (
  (EXISTS (
    SELECT 1 FROM exam_submissions
    WHERE exam_submissions.id = answers.submission_id
    AND exam_submissions.student_id = auth.uid()
  )) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role)
);

-- highlights
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can manage own highlights" ON public.highlights FOR ALL USING (student_id = auth.uid());

-- =============================================
-- FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS text[] LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT COALESCE(array_agg(role::text), ARRAY[]::TEXT[]) FROM public.user_roles WHERE user_id = _user_id;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_create_user(text, text, text, text, text, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_user(text, text, text, text, text, text) TO service_role, postgres;

CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_email text,
  p_full_name text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_gender text DEFAULT NULL,
  p_role text DEFAULT 'student',
  p_password text DEFAULT 'nextband123'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_new_id uuid := gen_random_uuid();
  v_existing_id uuid;
  v_result json;
  v_encrypted_pw text;
BEGIN
  -- Defense-in-depth: Caller check
  IF (COALESCE(auth.role(), '') <> 'service_role' AND current_user <> 'postgres' AND NOT has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'Access denied: caller does not have admin privileges' USING ERRCODE = '42501';
  END IF;

  -- 1. Check if user already exists in auth.users or profiles (Idempotency Check)
  SELECT id INTO v_existing_id FROM auth.users WHERE email = p_email LIMIT 1;
  IF v_existing_id IS NULL THEN
    SELECT user_id INTO v_existing_id FROM public.profiles WHERE email = p_email LIMIT 1;
  END IF;

  IF v_existing_id IS NOT NULL THEN
    -- Update existing profile & role without creating duplicates
    UPDATE public.profiles
    SET full_name = COALESCE(p_full_name, full_name),
        phone = COALESCE(p_phone, phone),
        gender = COALESCE(p_gender, gender),
        is_active = true,
        updated_at = now()
    WHERE user_id = v_existing_id OR id = v_existing_id;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_existing_id, p_role::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    SELECT row_to_json(p) INTO v_result FROM public.profiles p WHERE user_id = v_existing_id OR id = v_existing_id LIMIT 1;
    RETURN v_result;
  END IF;

  -- 2. Create Root Identity in auth.users with encrypted password
  v_encrypted_pw := extensions.crypt(COALESCE(p_password, 'nextband123'), extensions.gen_salt('bf'));

  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud,
    created_at, updated_at
  ) VALUES (
    v_new_id,
    '00000000-0000-0000-0000-000000000000',
    p_email,
    v_encrypted_pw,
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object('full_name', p_full_name),
    false,
    'authenticated',
    'authenticated',
    now(),
    now()
  );

  -- 3. Create or update profile record matching auth.users(id)
  INSERT INTO public.profiles (id, user_id, email, full_name, phone, gender, is_active)
  VALUES (v_new_id, v_new_id, p_email, p_full_name, p_phone, p_gender, true)
  ON CONFLICT (user_id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      phone = EXCLUDED.phone,
      gender = EXCLUDED.gender;

  -- 4. Create user role mapping
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_new_id, p_role::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  SELECT row_to_json(p) INTO v_result FROM public.profiles p WHERE user_id = v_new_id;
  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  -- Atomic PostgreSQL transaction rollback automatically cleans up auth.users, profiles, and user_roles
  RAISE;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =============================================
-- ADDITIONAL TABLES (classes & notifications)
-- =============================================

CREATE TABLE IF NOT EXISTS public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  teacher_id uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  description text,
  start_date date,
  end_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  recipient_role text DEFAULT 'student',
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  entity_type text,
  entity_id text,
  action_url text,
  priority text DEFAULT 'info',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

-- =============================================
-- STORAGE BUCKETS
-- =============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('course-thumbnails', 'course-thumbnails', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('exam-assets', 'exam-assets', true);

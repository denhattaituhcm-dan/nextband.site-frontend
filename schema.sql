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
CREATE POLICY "Allow authenticated full access to profiles" ON public.profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anon select profiles" ON public.profiles;
CREATE POLICY "Allow anon select profiles" ON public.profiles FOR SELECT TO anon USING (true);

-- user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated full access to user_roles" ON public.user_roles;
CREATE POLICY "Allow authenticated full access to user_roles" ON public.user_roles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated full access to courses" ON public.courses;
CREATE POLICY "Allow authenticated full access to courses" ON public.courses FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anon select courses" ON public.courses;
CREATE POLICY "Allow anon select courses" ON public.courses FOR SELECT TO anon USING (true);

-- classes
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated full access to classes" ON public.classes;
CREATE POLICY "Allow authenticated full access to classes" ON public.classes FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anon select classes" ON public.classes;
CREATE POLICY "Allow anon select classes" ON public.classes FOR SELECT TO anon USING (true);

-- enrollments
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated full access to enrollments" ON public.enrollments;
CREATE POLICY "Allow authenticated full access to enrollments" ON public.enrollments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can view own enrollments or admins/teachers can view all" ON public.enrollments FOR SELECT USING ((auth.uid() = student_id) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));
CREATE POLICY "Users can enroll themselves or admins can enroll anyone" ON public.enrollments FOR INSERT WITH CHECK ((auth.uid() = student_id) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can update own enrollments or admins can update any" ON public.enrollments FOR UPDATE USING ((auth.uid() = student_id) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can delete own enrollments or admins can delete any" ON public.enrollments FOR DELETE USING ((auth.uid() = student_id) OR has_role(auth.uid(), 'admin'::app_role));

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

-- exam_submissions
ALTER TABLE public.exam_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins and teachers can manage submissions" ON public.exam_submissions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));
CREATE POLICY "Students can create own submissions" ON public.exam_submissions FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "Students can update own in-progress submissions" ON public.exam_submissions FOR UPDATE USING ((student_id = auth.uid()) AND (status = 'in_progress'::submission_status));
CREATE POLICY "Students can view own submissions" ON public.exam_submissions FOR SELECT USING ((student_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));

-- question_groups
ALTER TABLE public.question_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins and teachers can manage groups" ON public.question_groups FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));
CREATE POLICY "Groups viewable with section access" ON public.question_groups FOR SELECT USING (true);

-- questions
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins and teachers can manage questions" ON public.questions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));
CREATE POLICY "Questions viewable by all" ON public.questions FOR SELECT USING (true);

-- answers
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins and teachers can manage answers" ON public.answers FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));
CREATE POLICY "Students can manage own answers" ON public.answers FOR ALL USING (
  EXISTS (
    SELECT 1 FROM exam_submissions
    WHERE exam_submissions.id = answers.submission_id
    AND exam_submissions.student_id = auth.uid()
    AND exam_submissions.status = 'in_progress'::submission_status
  )
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

CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_email text,
  p_full_name text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_gender text DEFAULT NULL,
  p_role text DEFAULT 'student'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_id uuid := gen_random_uuid();
  v_existing_id uuid;
  v_result json;
BEGIN
  SELECT id INTO v_existing_id FROM public.profiles WHERE email = p_email LIMIT 1;
  
  IF v_existing_id IS NOT NULL THEN
    UPDATE public.profiles
    SET full_name = COALESCE(p_full_name, full_name),
        phone = COALESCE(p_phone, phone),
        gender = COALESCE(p_gender, gender),
        is_active = true,
        updated_at = now()
    WHERE id = v_existing_id;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_existing_id, p_role::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    SELECT row_to_json(p) INTO v_result FROM public.profiles p WHERE id = v_existing_id;
    RETURN v_result;
  END IF;

  INSERT INTO public.profiles (id, user_id, email, full_name, phone, gender, is_active)
  VALUES (v_new_id, v_new_id, p_email, p_full_name, p_phone, p_gender, true);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_new_id, p_role::app_role)
  ON CONFLICT DO NOTHING;

  SELECT row_to_json(p) INTO v_result FROM public.profiles p WHERE id = v_new_id;
  RETURN v_result;
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
-- STORAGE BUCKETS
-- =============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('course-thumbnails', 'course-thumbnails', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('exam-assets', 'exam-assets', true);

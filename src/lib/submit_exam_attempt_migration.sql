-- ============================================================================
-- ANTI-CHEATING & ATOMIC SUBMISSION RPC MIGRATION
-- 1. Create secure exam questions view for students (hiding correct_answer)
-- 2. Create authoritative submit_exam_attempt RPC running as SECURITY DEFINER
-- ============================================================================

-- A. Public Exam Questions View for Students (Excludes correct_answer)
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
FROM public.questions q;

-- Grant access to authenticated users
GRANT SELECT ON public.student_exam_questions_view TO authenticated;

-- B. Authoritative Submit Exam Attempt RPC
CREATE OR REPLACE FUNCTION public.submit_exam_attempt(
  p_submission_id UUID,
  p_answers JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_submission public.exam_submissions;
  v_student_id UUID;
  v_item JSONB;
  v_q_id UUID;
  v_ans_text TEXT;
  v_audio_url TEXT;
  v_correct_answer TEXT;
  v_q_type question_type;
  v_points NUMERIC;
  v_score NUMERIC;
  v_correct_count INT := 0;
  v_total_questions INT := 0;
  v_total_score NUMERIC := 0;
  v_has_manual BOOLEAN := false;
  v_final_status submission_status;
BEGIN
  -- 1. Explicit Authorization Check
  v_student_id := auth.uid();
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED: User must be authenticated';
  END IF;

  -- 2. Fetch submission and verify ownership
  SELECT * INTO v_submission
  FROM public.exam_submissions
  WHERE id = p_submission_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: Submission not found';
  END IF;

  IF v_submission.student_id <> v_student_id THEN
    RAISE EXCEPTION 'FORBIDDEN: You do not own this submission';
  END IF;

  -- 3. Idempotent Recovery: If already submitted/graded, return existing result
  IF v_submission.status IN ('submitted'::submission_status, 'graded'::submission_status) THEN
    RETURN jsonb_build_object(
      'id', v_submission.id,
      'status', v_submission.status,
      'total_score', v_submission.total_score,
      'correct_answers', v_submission.correct_answers,
      'total_questions', v_submission.total_questions,
      'submitted_at', v_submission.submitted_at
    );
  END IF;

  -- 4. Loop through submitted answers, persist, and perform authoritative grading
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_answers)
  LOOP
    v_q_id := (v_item->>'questionId')::UUID;
    v_ans_text := v_item->>'answerText';
    v_audio_url := v_item->>'audioUrl';

    -- Query private question data
    SELECT question_type, correct_answer, points
    INTO v_q_type, v_correct_answer, v_points
    FROM public.questions
    WHERE id = v_q_id;

    v_points := COALESCE(v_points, 1);
    v_score := 0;

    -- Evaluate Objective vs Manual Questions
    IF v_q_type IN ('essay', 'speaking') THEN
      v_has_manual := true;
    ELSIF v_q_type IN ('multiple_choice', 'true_false_not_given', 'yes_no_not_given', 'short_answer', 'fill_blank', 'matching', 'listening') THEN
      v_total_questions := v_total_questions + 1;
      
      IF v_correct_answer IS NOT NULL AND TRIM(v_correct_answer) <> '' AND v_ans_text IS NOT NULL THEN
        -- Case-insensitive basic matching or exact matching
        IF LOWER(TRIM(v_ans_text)) = LOWER(TRIM(v_correct_answer)) THEN
          v_score := v_points;
          v_correct_count := v_correct_count + 1;
          v_total_score := v_total_score + v_score;
        END IF;
      END IF;
    ELSE
      v_has_manual := true;
    END IF;

    -- Upsert Answer row
    INSERT INTO public.answers (submission_id, question_id, answer_text, audio_url, score, updated_at)
    VALUES (p_submission_id, v_q_id, v_ans_text, v_audio_url, v_score, now())
    ON CONFLICT (submission_id, question_id) DO UPDATE
    SET answer_text = EXCLUDED.answer_text,
        audio_url = EXCLUDED.audio_url,
        score = EXCLUDED.score,
        updated_at = now();
  END LOOP;

  -- 5. Determine final status
  IF v_has_manual THEN
    v_final_status := 'submitted'::submission_status;
  ELSE
    v_final_status := 'graded'::submission_status;
  END IF;

  -- 6. Atomic update of exam_submissions
  UPDATE public.exam_submissions
  SET status = v_final_status,
      submitted_at = now(),
      correct_answers = v_correct_count,
      total_questions = v_total_questions,
      total_score = v_total_score
  WHERE id = p_submission_id
  RETURNING * INTO v_submission;

  RETURN jsonb_build_object(
    'id', v_submission.id,
    'status', v_submission.status,
    'total_score', v_submission.total_score,
    'correct_answers', v_submission.correct_answers,
    'total_questions', v_submission.total_questions,
    'submitted_at', v_submission.submitted_at
  );
END;
$$;

-- Revoke default execute and grant to authenticated
REVOKE EXECUTE ON FUNCTION public.submit_exam_attempt(UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_exam_attempt(UUID, JSONB) TO authenticated;

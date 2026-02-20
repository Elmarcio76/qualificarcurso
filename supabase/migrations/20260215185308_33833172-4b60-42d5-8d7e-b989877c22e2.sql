-- Create a secure view that excludes correct_answer
CREATE VIEW public.exam_questions_public
WITH (security_invoker = on) AS
  SELECT id, course_id, question, options, order_index
  FROM public.exam_questions;

-- Drop existing policies on exam_questions
DROP POLICY IF EXISTS "Enrolled users read questions" ON public.exam_questions;

-- Restrict base table SELECT to admin only
CREATE POLICY "Admin only read exam_questions" ON public.exam_questions
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Remove client-side INSERT on exam_results (will use edge function)
DROP POLICY IF EXISTS "Users insert own results" ON public.exam_results;

-- Remove client-side INSERT on certificates (edge function will handle)
DROP POLICY IF EXISTS "Users insert own certificates" ON public.certificates;
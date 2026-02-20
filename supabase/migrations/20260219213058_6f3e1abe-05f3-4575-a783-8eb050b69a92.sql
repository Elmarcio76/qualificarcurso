
-- 1. Fix certificates: make SELECT PERMISSIVE so public verification works
DROP POLICY IF EXISTS "Public verify certificate by number" ON public.certificates;
DROP POLICY IF EXISTS "Users read own certificates" ON public.certificates;

CREATE POLICY "Anyone can read certificates"
ON public.certificates FOR SELECT
USING (true);

-- Add INSERT policy for certificates (admin only from client; edge function uses service role)
CREATE POLICY "Admin insert certificates"
ON public.certificates FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Recreate exam_questions_public view with security_invoker so base table RLS applies
DROP VIEW IF EXISTS public.exam_questions_public;
CREATE VIEW public.exam_questions_public
WITH (security_invoker = on) AS
SELECT id, course_id, questaonum, proposicaoquestao, opcao1, opcao2, opcao3, opcao4, opcao5
FROM public.exam_questions;

-- 3. Add SELECT policy for enrolled users with available exam on exam_questions
CREATE POLICY "Enrolled users read exam questions"
ON public.exam_questions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE enrollments.course_id = exam_questions.course_id
    AND enrollments.user_id = auth.uid()
    AND enrollments.exam_available_after <= now()
  )
);

-- 4. Add INSERT policy for exam_results (authenticated users, own records only)
CREATE POLICY "Users insert own exam results"
ON public.exam_results FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 5. Add INSERT policy for profiles (fallback for trigger)
CREATE POLICY "Users insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

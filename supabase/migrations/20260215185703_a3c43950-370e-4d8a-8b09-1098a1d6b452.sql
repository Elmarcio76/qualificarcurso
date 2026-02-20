-- Drop the view first (depends on the table)
DROP VIEW IF EXISTS public.exam_questions_public;

-- Drop existing table and recreate with new schema
DROP TABLE IF EXISTS public.exam_questions;

CREATE TABLE public.exam_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid NOT NULL REFERENCES public.courses(id),
  questaonum smallint NOT NULL CHECK (questaonum BETWEEN 1 AND 10),
  proposicaoquestao text NOT NULL,
  opcao1 text NOT NULL,
  opcao2 text NOT NULL,
  opcao3 text NOT NULL,
  opcao4 text NOT NULL,
  opcao5 text NOT NULL,
  opcao_correta smallint NOT NULL CHECK (opcao_correta BETWEEN 1 AND 5),
  UNIQUE(course_id, questaonum)
);

ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin manage questions" ON public.exam_questions
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Base table SELECT restricted to admin only (students use the view)
CREATE POLICY "Admin only read exam_questions" ON public.exam_questions
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Secure view without opcao_correta
CREATE VIEW public.exam_questions_public
WITH (security_invoker = on) AS
  SELECT id, course_id, questaonum, proposicaoquestao, opcao1, opcao2, opcao3, opcao4, opcao5
  FROM public.exam_questions;
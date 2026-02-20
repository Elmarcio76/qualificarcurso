-- Remove duplicate payments keeping only the oldest per (user_id, course_id, stripe_session_id)
DELETE FROM public.payments
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, course_id, stripe_session_id) id
  FROM public.payments
  ORDER BY user_id, course_id, stripe_session_id, created_at ASC
);

-- Add unique index to prevent future duplicate payments per session
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_unique_session_course 
ON public.payments (stripe_session_id, user_id, course_id) 
WHERE stripe_session_id IS NOT NULL;
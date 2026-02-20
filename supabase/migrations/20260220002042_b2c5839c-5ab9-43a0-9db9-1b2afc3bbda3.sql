
-- Table to track checkout attempts (abandoned carts)
CREATE TABLE public.checkout_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  user_email text NOT NULL,
  user_name text,
  user_phone text,
  course_titles text NOT NULL,
  course_ids text NOT NULL,
  total_amount numeric NOT NULL DEFAULT 0,
  stripe_session_id text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone
);

ALTER TABLE public.checkout_attempts ENABLE ROW LEVEL SECURITY;

-- Only admins can read
CREATE POLICY "Admin read checkout_attempts"
  ON public.checkout_attempts
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role inserts/updates (from edge functions)
CREATE POLICY "Service insert checkout_attempts"
  ON public.checkout_attempts
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service update checkout_attempts"
  ON public.checkout_attempts
  FOR UPDATE
  USING (true);

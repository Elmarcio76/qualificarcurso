-- Remove the permissive INSERT policy that allows users to self-enroll
DROP POLICY IF EXISTS "System insert enrollments" ON public.enrollments;

-- Create a restrictive policy that only allows service_role (server-side) inserts
-- This ensures enrollments can only be created by edge functions using service_role key
CREATE POLICY "Service role insert enrollments"
ON public.enrollments
FOR INSERT
TO service_role
WITH CHECK (true);

-- Also restrict certificates to owner/admin only (currently public)
DROP POLICY IF EXISTS "Anyone can read certificates" ON public.certificates;

CREATE POLICY "Owner or admin read certificates"
ON public.certificates
FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Restore public read access for certificate verification
DROP POLICY IF EXISTS "Owner or admin read certificates" ON public.certificates;

CREATE POLICY "Anyone can read certificates"
ON public.certificates
FOR SELECT
USING (true);
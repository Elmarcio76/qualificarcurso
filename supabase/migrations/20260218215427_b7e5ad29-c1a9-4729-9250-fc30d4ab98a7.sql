
-- Add certificate_number column to certificates table
ALTER TABLE public.certificates 
ADD COLUMN certificate_number text UNIQUE;

-- Create a function to generate a unique certificate number (6-8 digits)
CREATE OR REPLACE FUNCTION public.generate_certificate_number()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_number text;
  num_digits int;
BEGIN
  LOOP
    -- Random between 6 and 8 digits
    num_digits := 6 + floor(random() * 3)::int;
    new_number := lpad(floor(random() * power(10, num_digits))::bigint::text, num_digits, '0');
    -- Ensure it's not all zeros and is truly the right length
    IF length(new_number) >= 6 AND length(new_number) <= 10 AND new_number::bigint > 0 THEN
      -- Check uniqueness
      IF NOT EXISTS (SELECT 1 FROM public.certificates WHERE certificate_number = new_number) THEN
        RETURN new_number;
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- Backfill existing certificates with generated numbers
UPDATE public.certificates
SET certificate_number = public.generate_certificate_number()
WHERE certificate_number IS NULL;

-- Make the column NOT NULL after backfill
ALTER TABLE public.certificates
ALTER COLUMN certificate_number SET NOT NULL;

-- Allow public (unauthenticated) to verify certificates by number
CREATE POLICY "Public verify certificate by number"
ON public.certificates
FOR SELECT
USING (true);

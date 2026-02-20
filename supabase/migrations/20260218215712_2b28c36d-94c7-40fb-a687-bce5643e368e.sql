
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
    num_digits := 6 + floor(random() * 5)::int; -- 6 to 10 digits
    new_number := lpad((floor(random() * (power(10, num_digits) - power(10, num_digits - 1))) + power(10, num_digits - 1))::bigint::text, num_digits, '0');
    IF NOT EXISTS (SELECT 1 FROM public.certificates WHERE certificate_number = new_number) THEN
      RETURN new_number;
    END IF;
  END LOOP;
END;
$$;

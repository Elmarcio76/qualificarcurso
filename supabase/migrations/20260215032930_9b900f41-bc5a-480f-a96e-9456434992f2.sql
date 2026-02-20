
-- Remove the public read policy for coupons
DROP POLICY IF EXISTS "Anyone can read active coupons" ON public.coupons;

-- Only admins can access coupons table directly
-- (The "Admin manage coupons" ALL policy already exists)

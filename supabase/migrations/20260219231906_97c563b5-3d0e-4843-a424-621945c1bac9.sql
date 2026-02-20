
ALTER TABLE public.coupons ADD COLUMN max_uses integer DEFAULT NULL;
ALTER TABLE public.coupons ADD COLUMN times_used integer NOT NULL DEFAULT 0;

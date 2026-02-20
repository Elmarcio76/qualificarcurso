-- Fix existing enrollments that were created with old 30-day default
UPDATE public.enrollments 
SET exam_available_after = enrolled_at + interval '20 days'
WHERE (exam_available_after - enrolled_at) > interval '20 days 1 hour';
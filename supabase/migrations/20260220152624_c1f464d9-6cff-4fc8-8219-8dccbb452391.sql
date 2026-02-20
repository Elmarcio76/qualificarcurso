-- Reset Eliton's failed exam attempts (score < 7)
DELETE FROM public.exam_results 
WHERE user_id = '324e9bc1-e60e-4601-831f-17491acedfc9' 
AND score < 7;

-- Remove inconsistent certificate (generated with score 2)
DELETE FROM public.certificates 
WHERE user_id = '324e9bc1-e60e-4601-831f-17491acedfc9' 
AND course_id = '5b01bcae-04b0-4621-89a7-f6a00a2aeb69';
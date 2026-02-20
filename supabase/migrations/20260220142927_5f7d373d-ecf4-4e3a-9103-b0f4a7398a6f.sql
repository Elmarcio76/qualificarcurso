UPDATE enrollments 
SET enrolled_at = now() - interval '25 days',
    exam_available_after = now() - interval '5 days'
WHERE id IN ('d342f6b8-ae32-4793-93bd-e4f9a5599f2a', '0972eab9-e730-4aff-b32a-5bb716dc161c');
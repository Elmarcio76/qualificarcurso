INSERT INTO enrollments (user_id, course_id, exam_available_after) VALUES 
('324e9bc1-e60e-4601-831f-17491acedfc9', '5b01bcae-04b0-4621-89a7-f6a00a2aeb69', now()),
('324e9bc1-e60e-4601-831f-17491acedfc9', '06cdfdf2-4ffd-465e-ab3f-dfce38596890', now()),
('324e9bc1-e60e-4601-831f-17491acedfc9', '0f6b6774-78f1-44ce-8563-c77aa77e96c6', now())
ON CONFLICT DO NOTHING;
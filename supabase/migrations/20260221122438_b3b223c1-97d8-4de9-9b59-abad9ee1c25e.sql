INSERT INTO public.profiles (id, user_id, name, cpf, phone, created_at, updated_at) VALUES
  ('7ab6e864-54aa-4c99-bfef-f07a1ead7723', 'c3ccd7d1-0836-4a2a-b14f-9ac758548d1e', '', NULL, '', '2026-02-21 11:15:20.316071+00', '2026-02-21 11:15:20.316071+00'),
  ('442c6bb9-bb23-4bca-851e-3860c6a4684d', '0a541d38-d942-40ba-a2c3-ab3b3ec576f7', '', NULL, '', '2026-02-21 11:15:20.316071+00', '2026-02-21 11:15:20.316071+00'),
  ('5f27d798-0c05-4646-a199-dee49dcfdf40', '93f6e0d4-0a44-45fa-b812-ab7736d2925b', '', NULL, '', '2026-02-21 11:15:20.316071+00', '2026-02-21 11:15:20.316071+00')
ON CONFLICT DO NOTHING;
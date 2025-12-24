-- Seed data for universities
INSERT INTO university ("id", "name", "logo", "slug") VALUES (1, 'Universidade de São Paulo', 'aa', 'USP');
INSERT INTO university ("id", "name", "logo", "slug") VALUES (2, 'Universidade de UFSCar', 'aa', 'UFSCar');

-- Reset sequence to continue from 3
SELECT setval('university_id_seq', 3, false);

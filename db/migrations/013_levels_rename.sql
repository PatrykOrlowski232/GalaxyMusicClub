-- Piętra: VIP → Piętro 2, usuń Parter
USE galaxy;

UPDATE levels SET name = 'Piętro 2' WHERE id = 3 AND name IN ('VIP', 'vip');

-- Przenieś ewentualne powiązania z Parteru (id=1) na Piętro 1 (id=2)
UPDATE parties SET level_id = 2 WHERE level_id = 1;
UPDATE lounges SET level_id = 2 WHERE level_id = 1;

DELETE FROM levels WHERE id = 1 AND name = 'Parter';

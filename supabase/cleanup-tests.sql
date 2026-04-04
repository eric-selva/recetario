-- Limpia datos creados por tests E2E
-- Ejecutar en Supabase SQL Editor

-- Borrar shopping_list entries de recetas de test
DELETE FROM shopping_list
WHERE recipe_id IN (SELECT id FROM recipes WHERE title LIKE 'Test Recipe %');

-- Borrar recetas de test (cascade borra ingredients y steps)
DELETE FROM recipes WHERE title LIKE 'Test Recipe %';

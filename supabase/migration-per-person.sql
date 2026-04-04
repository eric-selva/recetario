-- ================================================
-- Migración: cantidades por persona + servings en shopping_list
-- Ejecutar en Supabase Dashboard → SQL Editor → New query
-- ================================================

-- 1. Dividir todas las cantidades de ingredientes entre el número de servings de su receta
-- Solo los que tienen quantity > 0 y unit distinto de 'al gusto'/'pizca'
UPDATE ingredients i
SET quantity = ROUND((i.quantity / r.servings)::numeric, 2)
FROM recipes r
WHERE i.recipe_id = r.id
  AND i.quantity > 0
  AND i.unit NOT IN ('al gusto', 'pizca');

-- 2. Poner servings = 1 en todas las recetas (las cantidades ya son por persona)
UPDATE recipes SET servings = 1;

-- 3. Añadir columna servings a shopping_list (raciones elegidas por el usuario)
ALTER TABLE shopping_list ADD COLUMN IF NOT EXISTS servings INT NOT NULL DEFAULT 4;

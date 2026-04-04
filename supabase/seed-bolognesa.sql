-- Seed: Espaguetis a la Boloñesa
-- Ejecutar en Supabase SQL Editor

-- Insert recipe
INSERT INTO recipes (id, title, description, image_url, meal_type, prep_time, servings)
VALUES (
  gen_random_uuid(),
  'Espaguetis a la Boloñesa',
  'La clasica receta italiana de pasta con salsa de carne, tomate y verduras. Cocinada a fuego lento para un sabor intenso.',
  'https://images.unsplash.com/photo-1622973536968-3ead9e780960?w=800&q=80',
  'comida',
  90,
  2
);

-- Get the recipe ID
DO $$
DECLARE
  recipe_uuid UUID;
BEGIN
  SELECT id INTO recipe_uuid FROM recipes WHERE title = 'Espaguetis a la Boloñesa' LIMIT 1;

  -- Insert ingredients
  INSERT INTO ingredients (recipe_id, name, quantity, unit, "order") VALUES
    (recipe_uuid, 'Espaguetis', 150, 'g', 0),
    (recipe_uuid, 'Carne picada (ternera y cerdo)', 250, 'g', 1),
    (recipe_uuid, 'Passata de tomate', 375, 'g', 2),
    (recipe_uuid, 'Zanahoria', 100, 'g', 3),
    (recipe_uuid, 'Cebolla', 50, 'g', 4),
    (recipe_uuid, 'Apio', 1, 'unidad', 5),
    (recipe_uuid, 'Ajo', 1, 'unidad', 6),
    (recipe_uuid, 'Aceite de oliva', 1, 'cucharada', 7),
    (recipe_uuid, 'Vino blanco', 60, 'ml', 8),
    (recipe_uuid, 'Agua', 60, 'ml', 9),
    (recipe_uuid, 'Sal', 0, 'al gusto', 10),
    (recipe_uuid, 'Pimienta negra', 0, 'al gusto', 11);

  -- Insert steps
  INSERT INTO steps (recipe_id, "order", instruction) VALUES
    (recipe_uuid, 0, 'Pelar las zanahorias y cortarlas en daditos pequeños.'),
    (recipe_uuid, 1, 'Lavar y picar el apio finamente.'),
    (recipe_uuid, 2, 'Pelar y picar la cebolla en trozos muy pequeños.'),
    (recipe_uuid, 3, 'En una cazuela, sofreir la cebolla en aceite de oliva durante 4 minutos sin que coja color.'),
    (recipe_uuid, 4, 'Agregar las zanahorias y el apio, cocinar tapado durante 10 minutos removiendo ocasionalmente.'),
    (recipe_uuid, 5, 'Incorporar el ajo prensado y la carne picada. Salpimentar y cocinar 5 minutos desmenuzando la carne.'),
    (recipe_uuid, 6, 'Añadir la passata de tomate y cocinar 10 minutos mas a fuego medio.'),
    (recipe_uuid, 7, 'Verter el vino blanco y el agua, subir el fuego y dejar evaporar 3-4 minutos.'),
    (recipe_uuid, 8, 'Tapar la cazuela y cocinar a fuego bajo durante 1 hora, removiendo de vez en cuando.'),
    (recipe_uuid, 9, 'Cuando falten 10 minutos, hervir la pasta en abundante agua con sal segun las indicaciones del paquete.'),
    (recipe_uuid, 10, 'Escurrir los espaguetis e incorporarlos a la cazuela con la salsa. Mezclar bien y servir.');
END $$;

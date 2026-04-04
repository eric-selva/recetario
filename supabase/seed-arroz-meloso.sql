-- Seed: Arroz meloso con setas y costillas
DO $$
DECLARE
  recipe_id uuid;
BEGIN
  INSERT INTO recipes (title, description, image_url, meal_type, prep_time, servings)
  VALUES (
    'Arroz meloso con setas y costillas',
    'Un arroz cremoso y reconfortante con costilla de cerdo, salchichas frescas y setas. El sofrito de cebolla, ajo y tomate le da una base de sabor increible.',
    'https://cfohqbwqpbeoebgnctni.supabase.co/storage/v1/object/public/recipe-images/arroz-meloso.jpg',
    'comida',
    60,
    4
  )
  RETURNING id INTO recipe_id;

  -- Ingredientes
  INSERT INTO ingredients (recipe_id, name, quantity, unit, "order") VALUES
    (recipe_id, 'Arroz redondo', 400, 'g', 1),
    (recipe_id, 'Setas (rebozuelos o variadas)', 200, 'g', 2),
    (recipe_id, 'Costilla de cerdo', 200, 'g', 3),
    (recipe_id, 'Salchichas frescas', 200, 'g', 4),
    (recipe_id, 'Cebolla', 2, 'unidad', 5),
    (recipe_id, 'Dientes de ajo', 2, 'unidad', 6),
    (recipe_id, 'Tomate triturado', 200, 'g', 7),
    (recipe_id, 'Romero fresco', 1, 'unidad', 8),
    (recipe_id, 'Caldo de pollo o verduras', 1.2, 'l', 9),
    (recipe_id, 'Aceite de oliva', 1, 'al gusto', 10),
    (recipe_id, 'Sal', 1, 'al gusto', 11);

  -- Pasos
  INSERT INTO steps (recipe_id, instruction, "order") VALUES
    (recipe_id, 'Calentar un chorro de aceite en una cazuela baja y ancha. Dorar a fuego medio alto las costillas y las salchichas divididas en trozos pequeños.', 1),
    (recipe_id, 'Mientras las carnes se doran, picar la cebolla y el ajo.', 2),
    (recipe_id, 'Cuando los trozos de carne esten bien dorados, retirarlos a un plato y poner la cebolla y el ajo en la cazuela. Bajar el fuego a medio, salar, añadir el romero y dejar que se cocine unos 15 minutos removiendo de vez en cuando.', 3),
    (recipe_id, 'Si se usa tomate fresco, aprovechar este tiempo para rallarlo.', 4),
    (recipe_id, 'Cuando la cebolla este blanda, añadir el tomate a la cazuela y salar ligeramente. Poner el caldo a calentar y dejar que el sofrito se haga unos 5-10 minutos mas, o hasta que el tomate haya perdido casi todo su liquido y este espeso.', 5),
    (recipe_id, 'Añadir a la cazuela las setas y rehogar uno o dos minutos.', 6),
    (recipe_id, 'Sumar el arroz y rehogar un minuto.', 7),
    (recipe_id, 'Añadir las carnes, remover, mojar con el caldo bien caliente y dejar que el conjunto se cocine durante unos 15-18 minutos a fuego medio removiendo de vez en cuando para que el arroz suelte su almidon. Probar a partir de los 15 minutos: cuando el grano este casi a punto, retirar del fuego, tapar y dejar reposar cinco minutos mas. El arroz tiene que quedar cremoso; si se ve pastoso, añadir un poco mas de caldo o agua y remover.', 8);
END $$;

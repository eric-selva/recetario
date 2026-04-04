-- Seed: Pollo salteado con arroz blanco y verduras (6 personas)

DO $$
DECLARE
  rid UUID;
BEGIN
  INSERT INTO recipes (title, description, image_url, meal_type, prep_time, servings)
  VALUES (
    'Pollo salteado con arroz blanco y verduras',
    'Pollo marinado en soja salteado al wok con pimiento, cebolla y arroz basmati. Un plato rápido, ligero y lleno de sabor.',
    'https://cfohqbwqpbeoebgnctni.supabase.co/storage/v1/object/public/recipe-images/pollo-arroz-verduras.jpg',
    'comida', 50, 6
  ) RETURNING id INTO rid;

  INSERT INTO ingredients (recipe_id, name, quantity, unit, "order") VALUES
    (rid, 'Pechuga de pollo', 1000, 'g', 0),
    (rid, 'Arroz basmati', 450, 'g', 1),
    (rid, 'Pimiento rojo', 2, 'unidad', 2),
    (rid, 'Pimiento verde', 1, 'unidad', 3),
    (rid, 'Cebolleta fresca', 3, 'unidad', 4),
    (rid, 'Dientes de ajo', 3, 'unidad', 5),
    (rid, 'Salsa de soja', 60, 'ml', 6),
    (rid, 'Vino blanco', 60, 'ml', 7),
    (rid, 'Semillas de sésamo', 1, 'cucharada', 8),
    (rid, 'Aceite de oliva', 1, 'al gusto', 9),
    (rid, 'Sal', 1, 'al gusto', 10),
    (rid, 'Pimienta negra', 1, 'al gusto', 11);

  INSERT INTO steps (recipe_id, "order", instruction) VALUES
    (rid, 0, 'Corta la pechuga de pollo en dados. Ponlos en un bol con la salsa de soja, el vino blanco y el ajo picado fino. Marina al menos 30 minutos en la nevera.'),
    (rid, 1, 'Cuece el arroz basmati en abundante agua con sal durante 12-14 minutos o hasta que esté al dente. Escurre bien y reserva.'),
    (rid, 2, 'Mientras, corta los pimientos en tiras y la cebolleta en rodajas, separando la parte blanca de la verde.'),
    (rid, 3, 'Escurre el pollo reservando el líquido del marinado. Calienta un chorro de aceite en un wok o sartén grande a fuego fuerte. Saltea el pollo 5-6 minutos hasta que esté dorado. Retíralo.'),
    (rid, 4, 'En el mismo wok, saltea la parte blanca de la cebolleta y los pimientos durante 4-5 minutos a fuego fuerte, removiendo constantemente.'),
    (rid, 5, 'Vierte el líquido del marinado reservado y deja que reduzca 1-2 minutos hasta que evapore el alcohol.'),
    (rid, 6, 'Devuelve el pollo al wok, añade el arroz escurrido y mezcla todo con cuidado durante 2-3 minutos para que el arroz absorba los jugos sin apelmazarse.'),
    (rid, 7, 'Sirve espolvoreado con las semillas de sésamo y la parte verde de la cebolleta picada por encima.');
END $$;

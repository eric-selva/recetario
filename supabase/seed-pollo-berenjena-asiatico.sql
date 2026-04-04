-- Seed: Pollo con berenjena china al estilo asiático (6 personas)
-- Fuente: https://asopaipas.com/recetas-de-pollo/pollo-con-berenjenas-chino/

DO $$
DECLARE
  rid UUID;
BEGIN
  INSERT INTO recipes (title, description, image_url, meal_type, prep_time, servings)
  VALUES (
    'Pollo con berenjena china al estilo asiático',
    'Pollo rebozado en maicena salteado con berenjena china frita, cebolla y pimiento, bañado en salsa de soja y vinagre de arroz. Un plato de inspiración cantonesa intenso y aromático.',
    'https://cfohqbwqpbeoebgnctni.supabase.co/storage/v1/object/public/recipe-images/pollo-berenjena-asiatico.webp',
    'comida', 35, 6
  ) RETURNING id INTO rid;

  INSERT INTO ingredients (recipe_id, name, quantity, unit, "order") VALUES
    (rid, 'Pechuga de pollo', 900, 'g', 0),
    (rid, 'Berenjena china', 6, 'unidad', 1),
    (rid, 'Cebolla', 2, 'unidad', 2),
    (rid, 'Pimiento rojo', 2, 'unidad', 3),
    (rid, 'Dientes de ajo', 4, 'unidad', 4),
    (rid, 'Jengibre fresco', 20, 'g', 5),
    (rid, 'Maicena', 40, 'g', 6),
    (rid, 'Yema de huevo', 3, 'unidad', 7),
    (rid, 'Salsa de soja', 80, 'ml', 8),
    (rid, 'Vinagre de arroz', 30, 'ml', 9),
    (rid, 'Caldo de pollo', 150, 'ml', 10),
    (rid, 'Miel o sirope de agave', 30, 'ml', 11),
    (rid, 'Aceite de sésamo', 15, 'ml', 12),
    (rid, 'Cebollino fresco', 1, 'al gusto', 13),
    (rid, 'Aceite vegetal', 1, 'al gusto', 14),
    (rid, 'Sal', 1, 'al gusto', 15),
    (rid, 'Pimienta negra', 1, 'al gusto', 16);

  INSERT INTO steps (recipe_id, "order", instruction) VALUES
    (rid, 0, 'Corta la pechuga de pollo en dados de unos 2 cm. En un bol, mezcla el pollo con las yemas de huevo y la maicena hasta que quede bien rebozado. Reserva.'),
    (rid, 1, 'Corta las berenjenas chinas en rodajas gruesas en diagonal (con piel). Corta la cebolla en gajos, el pimiento rojo en tiras y pica el ajo y el jengibre fino.'),
    (rid, 2, 'Prepara la salsa: mezcla en un bol la salsa de soja, el vinagre de arroz, el caldo de pollo, la miel y el aceite de sésamo. Reserva.'),
    (rid, 3, 'Calienta abundante aceite vegetal en un wok a fuego fuerte. Fríe las berenjenas en tandas durante 3-4 minutos hasta que estén doradas y tiernas. Escúrrelas sobre papel absorbente.'),
    (rid, 4, 'En el mismo wok con un poco de aceite limpio, fríe el pollo rebozado a fuego fuerte durante 5-6 minutos, removiendo, hasta que esté dorado y crujiente. Retira y reserva.'),
    (rid, 5, 'Con una cucharada de aceite en el wok, saltea el ajo, el jengibre, la cebolla y el pimiento durante 3-4 minutos a fuego fuerte.'),
    (rid, 6, 'Devuelve el pollo y las berenjenas al wok. Vierte la salsa preparada y mezcla todo bien. Cocina 2-3 minutos hasta que la salsa espese ligeramente y bañe todos los ingredientes.'),
    (rid, 7, 'Sirve inmediatamente espolvoreado con cebollino picado. Acompaña con arroz blanco al vapor.');
END $$;

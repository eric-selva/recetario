-- Seed: Pollo con patatas, pimiento y cebolla (6 personas)

DO $$
DECLARE
  rid UUID;
BEGIN
  INSERT INTO recipes (title, description, image_url, meal_type, prep_time, servings)
  VALUES (
    'Pollo con patatas, pimiento y cebolla',
    'Clásico salteado de pollo con patatas doradas, pimiento rojo y cebolla. Un plato completo, reconfortante y fácil de preparar en sartén.',
    'https://cfohqbwqpbeoebgnctni.supabase.co/storage/v1/object/public/recipe-images/pollo-patata-pimiento.jpg',
    'comida', 40, 6
  ) RETURNING id INTO rid;

  INSERT INTO ingredients (recipe_id, name, quantity, unit, "order") VALUES
    (rid, 'Pechuga de pollo', 1000, 'g', 0),
    (rid, 'Patatas', 900, 'g', 1),
    (rid, 'Pimiento rojo', 3, 'unidad', 2),
    (rid, 'Cebolla grande', 2, 'unidad', 3),
    (rid, 'Dientes de ajo', 3, 'unidad', 4),
    (rid, 'Aceite de oliva', 1, 'al gusto', 5),
    (rid, 'Sal', 1, 'al gusto', 6),
    (rid, 'Pimienta negra', 1, 'al gusto', 7),
    (rid, 'Pimentón dulce', 1, 'cucharadita', 8),
    (rid, 'Hierbas finas', 1, 'cucharadita', 9);

  INSERT INTO steps (recipe_id, "order", instruction) VALUES
    (rid, 0, 'Corta las pechugas de pollo en tiras gruesas. Salpimenta y espolvorea con pimentón dulce. Reserva.'),
    (rid, 1, 'Pela las patatas y córtalas en dados medianos (unos 2 cm). Pela la cebolla y córtala en juliana gruesa. Corta los pimientos en tiras anchas. Lamina los ajos.'),
    (rid, 2, 'Calienta aceite de oliva abundante en una sartén grande a fuego medio-alto. Fríe las patatas durante 10-12 minutos, removiendo de vez en cuando, hasta que estén doradas y tiernas. Retíralas y escúrrelas sobre papel absorbente.'),
    (rid, 3, 'En la misma sartén, con un poco de aceite limpio, sella las tiras de pollo a fuego fuerte durante 4-5 minutos hasta que estén doradas por todos los lados. Retira y reserva.'),
    (rid, 4, 'Baja el fuego a medio. Añade la cebolla y el ajo, sofríe 3-4 minutos hasta que la cebolla esté transparente.'),
    (rid, 5, 'Sube el fuego, añade los pimientos y saltea 4-5 minutos hasta que estén tiernos pero con algo de textura.'),
    (rid, 6, 'Devuelve el pollo y las patatas a la sartén. Espolvorea con hierbas finas, mezcla bien y cocina todo junto 2-3 minutos para que se integren los sabores. Rectifica de sal y pimienta.'),
    (rid, 7, 'Sirve caliente directamente de la sartén. Acompaña con una ensalada verde si lo deseas.');
END $$;

-- Seed: Macarrones con verduras (6 personas)
-- Fuente: https://elfornerdealella.com/macarrones-con-verduras/

DO $$
DECLARE
  rid UUID;
BEGIN
  INSERT INTO recipes (title, description, image_url, meal_type, prep_time, servings)
  VALUES (
    'Macarrones con verduras',
    'Deliciosos macarrones salteados con champiñones, calabacín, pimiento, zanahoria y salsa de tomate. Un plato de pasta saludable, nutritivo y lleno de sabor.',
    'https://cfohqbwqpbeoebgnctni.supabase.co/storage/v1/object/public/recipe-images/macarrones-verduras.webp',
    'comida', 35, 6
  ) RETURNING id INTO rid;

  INSERT INTO ingredients (recipe_id, name, quantity, unit, "order") VALUES
    (rid, 'Macarrones', 900, 'g', 0),
    (rid, 'Champiñones', 450, 'g', 1),
    (rid, 'Calabacín', 3, 'unidad', 2),
    (rid, 'Pimiento verde', 3, 'unidad', 3),
    (rid, 'Cebolla grande', 3, 'unidad', 4),
    (rid, 'Zanahoria', 3, 'unidad', 5),
    (rid, 'Dientes de ajo', 6, 'unidad', 6),
    (rid, 'Salsa de tomate', 750, 'g', 7),
    (rid, 'Queso parmesano rallado', 120, 'g', 8),
    (rid, 'Orégano', 1, 'al gusto', 9),
    (rid, 'Aceite de oliva', 1, 'al gusto', 10),
    (rid, 'Sal', 1, 'al gusto', 11),
    (rid, 'Pimienta negra', 1, 'al gusto', 12);

  INSERT INTO steps (recipe_id, "order", instruction) VALUES
    (rid, 0, 'Pon una olla grande con abundante agua y sal a hervir. Cuando rompa a hervir, echa los macarrones y cuécelos según las instrucciones del paquete (normalmente 10-12 minutos). Escúrrelos reservando un vaso del agua de cocción.'),
    (rid, 1, 'Mientras se cuece la pasta, lava y corta todas las verduras: los champiñones en láminas, el calabacín en dados medianos, el pimiento verde en tiras cortas, la cebolla en juliana, la zanahoria en rodajas finas y los ajos picados.'),
    (rid, 2, 'Calienta un buen chorro de aceite de oliva en una sartén grande o wok a fuego medio-alto. Sofríe la cebolla y el ajo durante 3-4 minutos hasta que la cebolla esté transparente.'),
    (rid, 3, 'Añade la zanahoria y el pimiento verde. Cocina 4-5 minutos removiendo de vez en cuando hasta que empiecen a ablandarse.'),
    (rid, 4, 'Incorpora los champiñones y el calabacín. Sube ligeramente el fuego y saltea todo junto 5-6 minutos, hasta que las verduras estén tiernas pero aún con algo de textura.'),
    (rid, 5, 'Vierte la salsa de tomate sobre las verduras, salpimenta al gusto y añade el orégano. Mezcla bien y deja cocinar 3-4 minutos a fuego medio.'),
    (rid, 6, 'Agrega los macarrones escurridos a la sartén con las verduras. Mezcla bien para que la pasta se integre con la salsa. Si queda seco, añade un poco del agua de cocción reservada.'),
    (rid, 7, 'Sirve los macarrones en platos y espolvorea generosamente con queso parmesano rallado por encima. Decora con un poco de orégano extra si lo deseas.');
END $$;

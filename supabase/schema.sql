-- ================================================
-- RECETARIO - Schema completo
-- Ejecutar en Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ================================================

-- Tipo enum para tipo de comida
CREATE TYPE meal_type AS ENUM ('desayuno', 'comida', 'cena');

-- Tabla de recetas
CREATE TABLE recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  meal_type meal_type NOT NULL DEFAULT 'comida',
  prep_time INT NOT NULL DEFAULT 0,
  servings INT NOT NULL DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabla de ingredientes
CREATE TABLE ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity DECIMAL NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'g',
  "order" INT NOT NULL DEFAULT 0,
  shoppable BOOLEAN NOT NULL DEFAULT true
);

-- Tabla de pasos
CREATE TABLE steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  "order" INT NOT NULL DEFAULT 0,
  instruction TEXT NOT NULL
);

-- Lista de la compra (referencia a recetas añadidas)
CREATE TABLE shopping_list (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indices para rendimiento
CREATE INDEX idx_ingredients_recipe ON ingredients(recipe_id);
CREATE INDEX idx_steps_recipe ON steps(recipe_id);
CREATE INDEX idx_shopping_list_recipe ON shopping_list(recipe_id);
CREATE INDEX idx_recipes_meal_type ON recipes(meal_type);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ================================================
-- Row Level Security (RLS) - Acceso público para uso personal
-- ================================================
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas (app personal, sin auth)
CREATE POLICY "Allow all on recipes" ON recipes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on ingredients" ON ingredients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on steps" ON steps FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on shopping_list" ON shopping_list FOR ALL USING (true) WITH CHECK (true);

-- ================================================
-- Storage bucket para imágenes
-- ================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('recipe-images', 'recipe-images', true);

-- Política de storage: acceso público para lectura y escritura
CREATE POLICY "Public read recipe images" ON storage.objects
  FOR SELECT USING (bucket_id = 'recipe-images');

CREATE POLICY "Public insert recipe images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'recipe-images');

CREATE POLICY "Public update recipe images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'recipe-images');

CREATE POLICY "Public delete recipe images" ON storage.objects
  FOR DELETE USING (bucket_id = 'recipe-images');

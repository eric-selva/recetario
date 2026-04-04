-- Añadir campo shoppable a la tabla ingredients
-- true = se añade a la lista de la compra
-- false = no se añade (especias, salsas, basicos de despensa)
ALTER TABLE ingredients ADD COLUMN shoppable BOOLEAN NOT NULL DEFAULT true;

-- Marcar como no comprables los ingredientes de despensa existentes
UPDATE ingredients SET shoppable = false
WHERE
  unit IN ('al gusto', 'pizca')
  OR lower(name) IN ('sal', 'agua', 'aceite', 'aceite de oliva', 'aceite de girasol')
  OR lower(name) LIKE '%pimienta%'
  OR lower(name) LIKE '%oregano%'
  OR lower(name) LIKE '%comino%'
  OR lower(name) LIKE '%pimenton%'
  OR lower(name) LIKE '%canela%'
  OR lower(name) LIKE '%nuez moscada%'
  OR lower(name) LIKE '%laurel%'
  OR lower(name) LIKE '%tomillo%'
  OR lower(name) LIKE '%romero%'
  OR lower(name) LIKE '%perejil%'
  OR lower(name) LIKE '%albahaca%'
  OR lower(name) LIKE '%curry%'
  OR lower(name) LIKE '%cayena%'
  OR lower(name) LIKE '%curcuma%'
  OR lower(name) LIKE '%cúrcuma%'
  OR lower(name) LIKE '%ajo en polvo%'
  OR lower(name) LIKE '%jengibre%'
  OR lower(name) LIKE '%salsa de soja%'
  OR lower(name) LIKE '%soja%'
  OR lower(name) LIKE '%miel%'
  OR lower(name) LIKE '%mostaza%'
  OR lower(name) LIKE '%maicena%'
  OR lower(name) LIKE '%vino blanco%'
  OR lower(name) LIKE '%vino tinto%'
  OR lower(name) LIKE '%vinagre%'
  OR lower(name) LIKE '%aceite de oliva%';

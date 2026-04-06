"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { Skeleton } from "boneyard-js/react";
import { cachedFetch, invalidateCache } from "@/lib/fetchCache";

interface ShoppingItem {
  id: string;
  recipe_id: string;
  added_at: string;
  servings: number;
  recipe?: {
    id: string;
    title: string;
    meal_type: string;
  };
  ingredients: {
    id: string;
    catalog_id: string | null;
    name: string;
    quantity: number;
    unit: string;
  }[];
}

interface PantryIngredient {
  catalog_id: string | null;
  name: string;
  quantity: number;
  unit: string;
}

interface ExtraIngredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

interface QtyOverride {
  ingredient_key: string;
  quantity: number;
}

interface RecipeSuggestion {
  id: string;
  title: string;
  meal_type: string;
}

interface IngredientSuggestion {
  id: string;
  name: string;
  unit: string;
}

const mealTypeLabels: Record<string, string> = {
  comida: "Comida",
  cena: "Cena",
  postre: "Postre",
};

const mealTypeStyles: Record<string, string> = {
  comida: "bg-primary/10 text-primary",
  cena: "bg-night/10 text-night",
  postre: "bg-saffron/15 text-saffron",
};

export default function ListaCompraPage() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [pantry, setPantry] = useState<PantryIngredient[]>([]);
  const [extras, setExtras] = useState<ExtraIngredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [qtyOverrides, setQtyOverrides] = useState<Map<string, number>>(new Map());
  const [mutating, setMutating] = useState(false);
  const [removingRecipe, setRemovingRecipe] = useState<string | null>(null);

  // Search state
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recipeSuggestions, setRecipeSuggestions] = useState<
    RecipeSuggestion[]
  >([]);
  const [ingredientSuggestions, setIngredientSuggestions] = useState<
    IngredientSuggestion[]
  >([]);
  const [addingRecipe, setAddingRecipe] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  function fetchList() {
    setLoading(true);
    Promise.all([
      fetch("/api/lista-compra").then((r) => r.json()),
      fetch("/api/despensa?location=nevera").then((r) => r.json()),
      fetch("/api/lista-compra/extras").then((r) => r.json()),
      fetch("/api/lista-compra/qty-overrides").then((r) => r.json()),
    ])
      .then(([listData, pantryData, extrasData, overridesData]) => {
        setItems(Array.isArray(listData) ? listData : []);
        setPantry(Array.isArray(pantryData) ? pantryData : []);
        setExtras(Array.isArray(extrasData) ? extrasData : []);
        if (Array.isArray(overridesData)) {
          const map = new Map<string, number>();
          for (const o of overridesData as QtyOverride[]) {
            map.set(o.ingredient_key, o.quantity);
          }
          setQtyOverrides(map);
        }
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchList();
  }, []);

  // Search suggestions
  useEffect(() => {
    if (search.trim().length < 1) {
      setRecipeSuggestions([]);
      setIngredientSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      const q = encodeURIComponent(search);
      Promise.all([
        cachedFetch<{ data: RecipeSuggestion[]; total: number }>(
          `/api/recetas?search=${q}&limit=5&offset=0`,
        ),
        cachedFetch<{ data: IngredientSuggestion[]; total: number }>(
          `/api/ingredientes?search=${q}&limit=5&offset=0`,
        ),
      ]).then(([recRes, ingRes]) => {
        setRecipeSuggestions(recRes.data ?? []);
        setIngredientSuggestions(ingRes.data ?? []);
      });
    }, 200);
    return () => clearTimeout(timer);
  }, [search]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function addRecipeToList(recipeId: string) {
    setSearch("");
    setShowSuggestions(false);
    setAddingRecipe(true);
    invalidateCache("/api/lista-compra");
    await fetch("/api/lista-compra", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipe_id: recipeId, servings: 4 }),
    });
    await fetchList();
    setAddingRecipe(false);
  }

  async function addIngredientToList(name: string, unit: string) {
    setSearch("");
    setShowSuggestions(false);
    const res = await fetch("/api/lista-compra/extras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, quantity: 1, unit }),
    });
    if (res.ok) {
      const data = await res.json();
      setExtras((prev) => [data, ...prev]);
    }
  }

  function addCustomIngredient() {
    if (!search.trim()) return;
    addIngredientToList(search.trim(), "unidad");
  }

  const mergedIngredients = useMemo(() => {
    const map = new Map<
      string,
      {
        catalogId: string | null;
        name: string;
        quantity: number;
        unit: string;
        manual?: boolean;
        extraId?: string;
      }
    >();

    for (const item of items) {
      const multiplier = item.servings || 4;
      for (const ing of item.ingredients) {
        const mergeKey =
          ing.catalog_id || `name__${ing.name.toLowerCase().trim()}`;
        const key = `${mergeKey}__${ing.unit}`;
        if (removed.has(key)) continue;

        const scaledQty = ing.quantity * multiplier;
        const existing = map.get(key);
        if (existing) {
          existing.quantity += scaledQty;
        } else {
          map.set(key, {
            catalogId: ing.catalog_id,
            name: ing.name,
            quantity: scaledQty,
            unit: ing.unit,
          });
        }
      }
    }

    // Add extra (manual) ingredients
    for (const ex of extras) {
      const key = `extra__${ex.id}`;
      if (removed.has(key)) continue;
      map.set(key, {
        catalogId: null,
        name: ex.name,
        quantity: ex.quantity,
        unit: ex.unit,
        manual: true,
        extraId: ex.id,
      });
    }

    // Build pantry lookup
    const pantryByCatalogId = new Map<string, number>();
    const pantryByName = new Map<string, number>();
    for (const p of pantry) {
      if (p.catalog_id) {
        pantryByCatalogId.set(
          p.catalog_id,
          (pantryByCatalogId.get(p.catalog_id) || 0) + p.quantity,
        );
      } else {
        const key = p.name.toLowerCase().trim();
        pantryByName.set(key, (pantryByName.get(key) || 0) + p.quantity);
      }
    }

    const result: {
      key: string;
      name: string;
      quantity: number;
      unit: string;
      pantryDiscount: number;
      manual?: boolean;
      extraId?: string;
    }[] = [];
    for (const [key, value] of map) {
      let inPantry = 0;
      if (value.catalogId) {
        inPantry = pantryByCatalogId.get(value.catalogId) || 0;
      }
      if (inPantry === 0) {
        inPantry = pantryByName.get(value.name.toLowerCase().trim()) || 0;
      }

      const adjusted = value.manual
        ? value.quantity
        : Math.max(0, value.quantity - inPantry);
      const finalQty = qtyOverrides.has(key) ? qtyOverrides.get(key)! : adjusted;
      if (finalQty > 0) {
        result.push({
          key,
          name: value.name,
          quantity: finalQty,
          unit: value.unit,
          pantryDiscount:
            !value.manual && inPantry > 0
              ? Math.min(inPantry, value.quantity)
              : 0,
          manual: value.manual,
          extraId: value.extraId,
        });
      }
    }

    return result;
  }, [items, pantry, removed, extras, qtyOverrides]);

  function toggleCheck(key: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function adjustQuantity(key: string, currentQty: number, delta: number, extraId?: string) {
    const newQty = currentQty + delta;
    if (newQty <= 0) {
      return removeIngredient(key, extraId);
    }
    setQtyOverrides((prev) => {
      const next = new Map(prev);
      next.set(key, newQty);
      return next;
    });
    if (extraId) {
      fetch("/api/lista-compra/extras", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: extraId, quantity: newQty }),
      });
      setExtras((prev) => prev.map((e) => (e.id === extraId ? { ...e, quantity: newQty } : e)));
    } else {
      fetch("/api/lista-compra/qty-overrides", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredient_key: key, quantity: newQty }),
      });
    }
  }

  function removeIngredient(key: string, extraId?: string) {
    setRemoved((prev) => new Set(prev).add(key));
    setChecked((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
    setQtyOverrides((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
    if (extraId) {
      fetch(`/api/lista-compra/extras?id=${extraId}`, { method: "DELETE" });
      setExtras((prev) => prev.filter((e) => e.id !== extraId));
    }
    // Remove qty override from DB
    fetch(`/api/lista-compra/qty-overrides?key=${encodeURIComponent(key)}`, { method: "DELETE" });
  }

  function removeChecked() {
    setMutating(true);
    const checkedKeys = new Set(checked);
    setRemoved((prev) => {
      const next = new Set(prev);
      for (const key of checkedKeys) next.add(key);
      return next;
    });
    // Delete extras that were checked
    const checkedIngredients = mergedIngredients.filter((i) =>
      checkedKeys.has(i.key),
    );
    for (const ing of checkedIngredients) {
      if (ing.extraId) {
        fetch(`/api/lista-compra/extras?id=${ing.extraId}`, {
          method: "DELETE",
        });
        setExtras((prev) => prev.filter((e) => e.id !== ing.extraId));
      }
    }
    setChecked(new Set());
    setTimeout(() => setMutating(false), 300);
  }

  async function removeRecipe(itemId: string) {
    setRemovingRecipe(itemId);
    invalidateCache("/api/lista-compra");
    await fetch(`/api/lista-compra?id=${itemId}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    setRemovingRecipe(null);
  }

  async function clearAll() {
    if (!confirm("¿Vaciar toda la lista de la compra?")) return;
    setMutating(true);
    invalidateCache("/api/lista-compra");
    await Promise.all([
      fetch("/api/lista-compra", { method: "DELETE" }),
      fetch("/api/lista-compra/extras", { method: "DELETE" }),
      fetch("/api/lista-compra/qty-overrides", { method: "DELETE" }),
    ]);
    setItems([]);
    setExtras([]);
    setQtyOverrides(new Map());
    setChecked(new Set());
    setRemoved(new Set());
    setMutating(false);
  }

  const checkedCount = mergedIngredients.filter((i) =>
    checked.has(i.key),
  ).length;
  const totalCount = mergedIngredients.length;
  const hasContent = items.length > 0 || extras.length > 0;

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="flex items-center gap-2.5 font-heading text-3xl font-bold">
            <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Lista de la compra
          </h1>
        <Skeleton
          name="shopping-list"
          loading={true}
          className="mt-8"
          fallback={
            <div className="animate-pulse space-y-4">
              <div className="h-12 rounded-xl bg-primary-light/30" />
              <div className="flex gap-2">
                <div className="h-10 w-32 rounded-full bg-primary-light/40" />
                <div className="h-10 w-32 rounded-full bg-primary-light/40" />
              </div>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-primary-light/25" />
              ))}
            </div>
          }
        >
          <div />
        </Skeleton>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2.5 font-heading text-3xl font-bold">
          <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          Lista de la compra
        </h1>
      </div>

      {/* Search to add recipes or ingredients */}
      <div ref={searchRef} className="relative mt-6">
        <div className="relative">
          <svg
            className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Añadir receta o ingrediente..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addCustomIngredient();
            }}
            className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && search.trim().length > 0 && (
          <div className="absolute z-20 mt-1 max-h-80 w-full overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
            {/* Recipe suggestions */}
            {recipeSuggestions.length > 0 && (
              <>
                <div className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Recetas
                </div>
                {recipeSuggestions.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => addRecipeToList(r.id)}
                    disabled={addingRecipe}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-primary-light transition-colors disabled:opacity-50"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {r.title}
                    </span>
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${mealTypeStyles[r.meal_type] || ""}`}
                    >
                      {mealTypeLabels[r.meal_type] || r.meal_type}
                    </span>
                  </button>
                ))}
              </>
            )}

            {/* Ingredient suggestions */}
            {ingredientSuggestions.length > 0 && (
              <>
                <div
                  className={`px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted ${recipeSuggestions.length > 0 ? "border-t border-border" : ""}`}
                >
                  Ingredientes
                </div>
                {ingredientSuggestions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => addIngredientToList(s.name, s.unit)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-primary-light transition-colors"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-saffron/10 text-saffron">
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4.5v15m7.5-7.5h-15"
                        />
                      </svg>
                    </span>
                    <span className="font-medium capitalize">{s.name}</span>
                    <span className="ml-auto text-xs text-muted">{s.unit}</span>
                  </button>
                ))}
              </>
            )}

            {/* Custom add option */}
            <button
              onClick={addCustomIngredient}
              className="flex w-full items-center gap-3 border-t border-border px-4 py-2.5 text-left text-sm hover:bg-primary-light transition-colors"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-olive/10 text-olive">
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
              </span>
              <span>
                Añadir &quot;
                <span className="font-semibold">{search.trim()}</span>&quot;
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Count + Clear row */}
      {hasContent && (
        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm text-muted">
            {checkedCount} de {totalCount} ingredientes
          </p>
          <div className="flex items-center gap-3">
            {checkedCount > 0 && (
              <button
                onClick={removeChecked}
                className="text-xs font-medium text-olive hover:text-olive/80 transition-colors"
              >
                Quitar ({checkedCount})
              </button>
            )}
            <button
              onClick={clearAll}
              className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors"
            >
              Vaciar lista
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasContent && (
        <div className="mt-16 flex flex-col items-center gap-5 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-olive/10 text-olive">
            <svg
              className="h-10 w-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
          <div>
            <p className="font-heading text-xl font-semibold">
              La lista esta vacia
            </p>
            <p className="mt-1 text-sm text-muted">
              Busca recetas o ingredientes para añadirlos.
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      {hasContent && (
        <>
          {/* Recipes in list */}
          {items.length > 0 && (
            <section className="mt-8">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <h2 className="font-heading text-lg font-semibold">
                  Recetas de esta semana
                </h2>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {addingRecipe && (
                  <div className="flex animate-pulse items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
                    <div className="h-4 w-24 rounded bg-primary-light/40" />
                  </div>
                )}
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm shadow-sm transition-opacity ${
                      removingRecipe === item.id
                        ? "animate-pulse opacity-50"
                        : ""
                    }`}
                  >
                    <Link
                      href={`/recetas/${item.recipe_id}`}
                      className="font-medium hover:text-primary"
                    >
                      {item.recipe?.title ?? "Receta"}
                    </Link>
                    <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
                      ×{item.servings}
                    </span>
                    <button
                      onClick={() => removeRecipe(item.id)}
                      className="text-muted hover:text-red-600"
                      title="Quitar de la lista"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Merged ingredient list — notebook style */}
          <section className="mt-4">
            <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
              {/* Notebook top edge — spiral holes */}
              <div className="flex items-center justify-center gap-4 border-b border-sky-200/60 bg-sky-50/30 py-1.5">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-2.5 w-2.5 rounded-full border border-gray-300 bg-gray-100" />
                ))}
              </div>
              {/* Ruled lines with left margin */}
              <div className={`relative transition-opacity ${mutating ? "pointer-events-none opacity-50" : ""}`}>
                {/* Red margin line */}
                <div className="absolute top-0 bottom-0 left-10 w-px bg-red-300/50" />

                {mergedIngredients.length === 0 ? (
                  <div className="py-8 pl-14 pr-4 text-sm text-muted">
                    No hay ingredientes en la lista.
                  </div>
                ) : (
                  <ul>
                    {mergedIngredients.map((ing, idx) => (
                      <li
                        key={ing.key}
                        className={`flex items-center gap-3 border-b border-sky-200/40 py-2.5 pl-14 pr-4 transition-colors ${
                          checked.has(ing.key) ? "bg-olive-light/20" : "hover:bg-sky-50/30"
                        } ${idx === 0 ? "" : ""}`}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleCheck(ing.key)}
                          className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border-2 transition-all ${
                            checked.has(ing.key)
                              ? "border-olive bg-olive text-white"
                              : "border-gray-300"
                          }`}
                        >
                          {checked.has(ing.key) && (
                            <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>

                        {/* Ingredient info */}
                        <span
                          onClick={() => toggleCheck(ing.key)}
                          className="flex flex-1 cursor-pointer items-center gap-2"
                        >
                          <span className={`text-sm font-medium capitalize ${checked.has(ing.key) ? "text-gray-400 line-through" : "text-gray-800"}`}>
                            {ing.name}
                          </span>
                          {ing.manual && (
                            <span className="text-[10px] text-saffron">manual</span>
                          )}
                          {ing.pantryDiscount > 0 && (
                            <span className="text-[10px] text-olive">
                              −{formatQuantity(ing.pantryDiscount)} en despensa
                            </span>
                          )}
                        </span>

                        {/* Quantity */}
                        {ing.unit === "unidad" ? (
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              onClick={() => adjustQuantity(ing.key, ing.quantity, -1, ing.extraId)}
                              className="flex h-6 w-6 items-center justify-center rounded border border-gray-200 text-xs font-bold text-gray-500 transition-colors hover:bg-gray-100"
                            >
                              −
                            </button>
                            <span className={`w-5 text-center text-sm font-semibold ${checked.has(ing.key) ? "text-gray-400" : "text-gray-700"}`}>
                              {formatQuantity(ing.quantity)}
                            </span>
                            <button
                              onClick={() => adjustQuantity(ing.key, ing.quantity, 1, ing.extraId)}
                              disabled={ing.quantity >= 20}
                              className="flex h-6 w-6 items-center justify-center rounded border border-gray-200 text-xs font-bold text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-30"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <>
                            <span
                              className={`shrink-0 text-sm font-semibold ${checked.has(ing.key) ? "text-gray-400" : "text-primary"}`}
                            >
                              {ing.quantity > 0 && `${formatQuantity(ing.quantity)} ${ing.unit}`}
                            </span>
                            <button
                              onClick={() => removeIngredient(ing.key, ing.extraId)}
                              className="ml-0.5 shrink-0 rounded p-0.5 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Progress — inside notebook */}
                {totalCount > 0 && (
                  <div className="border-t border-sky-200/40 py-3 pl-14 pr-4">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="font-semibold">Progreso</span>
                      <span>{Math.round((checkedCount / totalCount) * 100)}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-olive transition-all duration-500"
                        style={{ width: `${(checkedCount / totalCount) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function formatQuantity(q: number): string {
  return q % 1 === 0 ? q.toString() : q.toFixed(1);
}

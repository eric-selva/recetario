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
  const [mutating, setMutating] = useState(false);
  const [removingRecipe, setRemovingRecipe] = useState<string | null>(null);

  // Search state
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recipeSuggestions, setRecipeSuggestions] = useState<RecipeSuggestion[]>([]);
  const [ingredientSuggestions, setIngredientSuggestions] = useState<IngredientSuggestion[]>([]);
  const [addingRecipe, setAddingRecipe] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  function fetchList() {
    setLoading(true);
    Promise.all([
      fetch("/api/lista-compra").then((r) => r.json()),
      fetch("/api/despensa?location=nevera").then((r) => r.json()),
      fetch("/api/lista-compra/extras").then((r) => r.json()),
    ])
      .then(([listData, pantryData, extrasData]) => {
        setItems(Array.isArray(listData) ? listData : []);
        setPantry(Array.isArray(pantryData) ? pantryData : []);
        setExtras(Array.isArray(extrasData) ? extrasData : []);
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
          `/api/recetas?search=${q}&limit=5&offset=0`
        ),
        cachedFetch<{ data: IngredientSuggestion[]; total: number }>(
          `/api/ingredientes?search=${q}&limit=5&offset=0`
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
      { catalogId: string | null; name: string; quantity: number; unit: string; manual?: boolean; extraId?: string }
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
          (pantryByCatalogId.get(p.catalog_id) || 0) + p.quantity
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
      if (adjusted > 0) {
        result.push({
          key,
          name: value.name,
          quantity: adjusted,
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
  }, [items, pantry, removed, extras]);

  function toggleCheck(key: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function removeIngredient(key: string, extraId?: string) {
    setRemoved((prev) => new Set(prev).add(key));
    setChecked((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
    if (extraId) {
      fetch(`/api/lista-compra/extras?id=${extraId}`, { method: "DELETE" });
      setExtras((prev) => prev.filter((e) => e.id !== extraId));
    }
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
    const checkedIngredients = mergedIngredients.filter((i) => checkedKeys.has(i.key));
    for (const ing of checkedIngredients) {
      if (ing.extraId) {
        fetch(`/api/lista-compra/extras?id=${ing.extraId}`, { method: "DELETE" });
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
    ]);
    setItems([]);
    setExtras([]);
    setChecked(new Set());
    setRemoved(new Set());
    setMutating(false);
  }

  const checkedCount = mergedIngredients.filter((i) =>
    checked.has(i.key)
  ).length;
  const totalCount = mergedIngredients.length;
  const hasContent = items.length > 0 || extras.length > 0;

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="font-heading text-3xl font-bold">Lista de la compra</h1>
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
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">
            Lista de la compra
          </h1>
          {hasContent && (
            <p className="mt-1 text-sm text-muted">
              {checkedCount} de {totalCount} ingredientes
            </p>
          )}
        </div>
        {hasContent && (
          <div className="flex gap-2">
            {checkedCount > 0 && (
              <button
                onClick={removeChecked}
                className="inline-flex items-center gap-2 rounded-xl border border-olive/30 px-4 py-2 text-sm font-semibold text-olive transition-all hover:bg-olive-light"
              >
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Quitar ({checkedCount})
              </button>
            )}
            <button
              onClick={clearAll}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition-all hover:bg-red-50"
            >
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
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
              Vaciar lista
            </button>
          </div>
        )}
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
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">{r.title}</span>
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${mealTypeStyles[r.meal_type] || ""}`}>
                      {mealTypeLabels[r.meal_type] || r.meal_type}
                    </span>
                  </button>
                ))}
              </>
            )}

            {/* Ingredient suggestions */}
            {ingredientSuggestions.length > 0 && (
              <>
                <div className={`px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted ${recipeSuggestions.length > 0 ? "border-t border-border" : ""}`}>
                  Ingredientes
                </div>
                {ingredientSuggestions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => addIngredientToList(s.name, s.unit)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-primary-light transition-colors"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-saffron/10 text-saffron">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
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
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </span>
              <span>
                Añadir &quot;<span className="font-semibold">{search.trim()}</span>&quot;
              </span>
            </button>
          </div>
        )}
      </div>

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

          <div className="divider-herbs my-8" />

          {/* Merged ingredient list */}
          <section>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-saffron/15 text-saffron">
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
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                  />
                </svg>
              </div>
              <h2 className="font-heading text-lg font-semibold">
                Ingredientes
              </h2>
            </div>
            <p className="mt-2 text-xs text-muted">
              Las cantidades se ajustan restando lo que ya tienes en la despensa.
            </p>
            <ul
              className={`mt-4 space-y-2 transition-opacity ${mutating ? "pointer-events-none opacity-50" : ""}`}
            >
              {mergedIngredients.map((ing) => (
                <li key={ing.key} className="flex items-center gap-2">
                  <button
                    onClick={() => toggleCheck(ing.key)}
                    className={`flex flex-1 items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                      checked.has(ing.key)
                        ? "border-olive/30 bg-olive-light/50"
                        : "border-border bg-card hover:border-primary/20 hover:shadow-sm"
                    }`}
                  >
                    {/* Checkbox */}
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                        checked.has(ing.key)
                          ? "border-olive bg-olive text-white"
                          : "border-muted/40"
                      }`}
                    >
                      {checked.has(ing.key) && (
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </span>

                    {/* Ingredient info */}
                    <span
                      className={`flex-1 ${checked.has(ing.key) ? "text-muted line-through" : ""}`}
                    >
                      <span className="font-medium capitalize">{ing.name}</span>
                      {ing.manual && (
                        <span className="ml-2 text-[10px] text-saffron">
                          manual
                        </span>
                      )}
                      {ing.pantryDiscount > 0 && (
                        <span className="ml-2 text-[10px] text-olive">
                          −{formatQuantity(ing.pantryDiscount)} en despensa
                        </span>
                      )}
                    </span>

                    {/* Quantity */}
                    <span
                      className={`text-sm font-semibold ${checked.has(ing.key) ? "text-muted" : "text-primary"}`}
                    >
                      {ing.quantity > 0 &&
                        `${formatQuantity(ing.quantity)} ${ing.unit}`}
                    </span>
                  </button>

                  {/* Remove single ingredient */}
                  <button
                    onClick={() => removeIngredient(ing.key, ing.extraId)}
                    className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-600"
                    title="Quitar ingrediente"
                  >
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* Progress bar */}
          {totalCount > 0 && (
            <div className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between text-sm">
                <span className="font-heading font-semibold">Progreso</span>
                <span className="text-muted">
                  {Math.round((checkedCount / totalCount) * 100)}%
                </span>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-primary-light/50">
                <div
                  className="h-full rounded-full bg-olive transition-all duration-500"
                  style={{
                    width: `${(checkedCount / totalCount) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function formatQuantity(q: number): string {
  return q % 1 === 0 ? q.toString() : q.toFixed(1);
}

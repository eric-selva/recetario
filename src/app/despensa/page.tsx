"use client";

import { useEffect, useState, useRef, useCallback, type ReactNode } from "react";
import SlidingFilter from "@/components/SlidingFilter";
import { cachedFetch, invalidateCache } from "@/lib/fetchCache";

const tabs = [
  { value: "congelador", label: "Tuppers" },
  { value: "nevera", label: "Despensa" },
];

const PAGE_SIZE = 10;

// ----- Types -----

interface NeveraItem {
  id: string;
  name: string;
  catalog_id: string | null;
  quantity: number;
  unit: string;
  added_at: string;
}

interface CongeladorItem {
  id: string;
  recipe_id: string;
  servings: number;
  added_at: string;
  recipe?: {
    id: string;
    title: string;
    image_url: string | null;
    meal_type: string;
  };
}

interface IngredientSuggestion {
  id: string;
  name: string;
  unit: string;
}

interface RecipeSuggestion {
  id: string;
  title: string;
  meal_type: string;
  image_url: string | null;
}

interface TupperExtra {
  id: string;
  name: string;
  quantity: number;
}

// ----- Component -----

export default function DespensaPage() {
  const [tab, setTab] = useState("congelador");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="flex items-center gap-2.5 font-heading text-3xl font-bold">
        <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        Despensa
      </h1>
      <p className="mt-1 text-sm text-muted">
        Controla lo que tienes en despensa y tuppers
      </p>

      <div className="mt-6">
        <SlidingFilter options={tabs} value={tab} onChange={setTab} />
      </div>

      <div className="mt-3">
        {tab === "nevera" ? <NeveraTab /> : <CongeladorTab />}
      </div>
    </div>
  );
}

// ==================== NEVERA TAB ====================

function NeveraTab() {
  const [items, setItems] = useState<NeveraItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<IngredientSuggestion[]>([]);
  const [suggestionsTotal, setSuggestionsTotal] = useState(0);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchItems = useCallback(() => {
    setLoading(true);
    fetch("/api/despensa?location=nevera")
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Search suggestions (reset on search change)
  useEffect(() => {
    if (search.trim().length < 1) {
      setSuggestions([]);
      setSuggestionsTotal(0);
      return;
    }
    const timer = setTimeout(() => {
      cachedFetch<{ data: IngredientSuggestion[]; total: number }>(
        `/api/ingredientes?search=${encodeURIComponent(search)}&limit=${PAGE_SIZE}&offset=0`,
      ).then((res) => {
        setSuggestions(res.data ?? []);
        setSuggestionsTotal(res.total ?? 0);
      });
    }, 200);
    return () => clearTimeout(timer);
  }, [search]);

  // Infinite scroll inside suggestions dropdown
  const loadMoreSuggestions = useCallback(() => {
    if (suggestionsLoading || suggestions.length >= suggestionsTotal) return;
    setSuggestionsLoading(true);
    cachedFetch<{ data: IngredientSuggestion[]; total: number }>(
      `/api/ingredientes?search=${encodeURIComponent(search)}&limit=${PAGE_SIZE}&offset=${suggestions.length}`,
    )
      .then((res) => {
        setSuggestions((prev) => [...prev, ...(res.data ?? [])]);
        setSuggestionsTotal(res.total ?? 0);
      })
      .finally(() => setSuggestionsLoading(false));
  }, [suggestionsLoading, suggestions.length, suggestionsTotal, search]);

  // Scroll handler for dropdown
  const handleDropdownScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
        loadMoreSuggestions();
      }
    },
    [loadMoreSuggestions],
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function addIngredient(name: string, unit: string) {
    setSearch("");
    setShowSuggestions(false);
    setAdding(true);
    await fetch("/api/despensa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location: "nevera", name, quantity: 1, unit }),
    });
    await fetchItems();
    setAdding(false);
  }

  async function addCustom() {
    if (!search.trim()) return;
    await addIngredient(search.trim(), "unidad");
  }

  async function updateQuantity(id: string, quantity: number) {
    if (quantity <= 0) {
      return removeItem(id);
    }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
    await fetch("/api/despensa", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, quantity }),
    });
  }

  async function removeItem(id: string) {
    setRemovingId(id);
    await fetch(`/api/despensa?id=${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
    setRemovingId(null);
  }

  async function clearAll() {
    if (!confirm("¿Vaciar toda la despensa?")) return;
    await fetch("/api/despensa?location=nevera", { method: "DELETE" });
    setItems([]);
  }

  return (
    <>
      {/* Search to add */}
      <div ref={searchRef} className="relative">
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
            placeholder="Buscar ingrediente para añadir..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addCustom();
            }}
            className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && search.trim().length > 0 && (
          <div
            ref={dropdownRef}
            onScroll={handleDropdownScroll}
            className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-border bg-card shadow-lg"
          >
            {suggestions.map((s) => (
              <button
                key={s.name}
                onClick={() => addIngredient(s.name, s.unit)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-primary-light transition-colors"
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
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                </span>
                <span className="font-medium capitalize">{s.name}</span>
                <span className="ml-auto text-xs text-muted">{s.unit}</span>
              </button>
            ))}
            {suggestionsLoading && (
              <div className="animate-pulse space-y-0">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className="h-7 w-7 shrink-0 rounded-lg bg-primary-light/30" />
                    <div className="h-4 flex-1 rounded-lg bg-primary-light/25" />
                    <div className="h-3 w-10 rounded bg-primary-light/20" />
                  </div>
                ))}
              </div>
            )}
            {/* Custom add option */}
            <button
              onClick={addCustom}
              className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left text-sm hover:bg-primary-light transition-colors"
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

      {/* Items list */}
      {loading ? (
        <div className="mt-6 animate-pulse space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-primary-light/25" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <svg
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <div>
            <p className="font-heading text-lg font-semibold">
              La despensa esta vacia
            </p>
            <p className="mt-1 text-sm text-muted">
              Busca ingredientes para añadirlos.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm text-muted">
              {items.length} ingrediente{items.length !== 1 ? "s" : ""}
            </p>
            <button
              onClick={clearAll}
              className="text-xs font-medium text-red-500 hover:text-red-600"
            >
              Vaciar despensa
            </button>
          </div>
          {/* Shelves — items wrap naturally, shelf plank under each row */}
          <ShelfGrid>
            {adding && (
              <div className="flex animate-pulse items-center gap-1.5 rounded-lg border border-border bg-card px-2 py-1.5 shadow-sm">
                <div className="h-3 w-16 rounded bg-primary-light/25" />
                <div className="ml-auto h-3 w-10 rounded bg-primary-light/20" />
              </div>
            )}
            {items.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-1.5 rounded-lg border border-border bg-card px-2 py-1.5 shadow-sm transition-opacity ${
                  removingId === item.id ? "animate-pulse opacity-40" : ""
                }`}
              >
                <span className="truncate text-xs font-bold capitalize">
                  {item.name}
                </span>
                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="flex h-5 w-5 items-center justify-center rounded border border-border text-[10px] font-bold transition-colors hover:bg-primary-light"
                  >
                    −
                  </button>
                  <span className="w-4 text-center text-xs font-semibold">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, Math.min(20, item.quantity + 1))}
                    disabled={item.quantity >= 20}
                    className="flex h-5 w-5 items-center justify-center rounded border border-border text-[10px] font-bold transition-colors hover:bg-primary-light disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </ShelfGrid>
        </>
      )}
    </>
  );
}

// ==================== TUPPERS TAB ====================

function CongeladorTab() {
  const [items, setItems] = useState<CongeladorItem[]>([]);
  const [extras, setExtras] = useState<TupperExtra[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<RecipeSuggestion[]>([]);
  const [suggestionsTotal, setSuggestionsTotal] = useState(0);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchItems = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/despensa?location=congelador").then((r) => r.json()),
      fetch("/api/despensa/tupper-extras").then((r) => r.json()),
    ])
      .then(([recipeData, extrasData]) => {
        setItems(Array.isArray(recipeData) ? recipeData : []);
        setExtras(Array.isArray(extrasData) ? extrasData : []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Search suggestions (reset on search change)
  useEffect(() => {
    if (search.trim().length < 1) {
      setSuggestions([]);
      setSuggestionsTotal(0);
      return;
    }
    const timer = setTimeout(() => {
      cachedFetch<{ data: RecipeSuggestion[]; total: number }>(
        `/api/recetas?search=${encodeURIComponent(search)}&limit=${PAGE_SIZE}&offset=0`,
      ).then((res) => {
        setSuggestions(res.data ?? []);
        setSuggestionsTotal(res.total ?? 0);
      });
    }, 200);
    return () => clearTimeout(timer);
  }, [search]);

  // Infinite scroll inside suggestions dropdown
  const loadMoreSuggestions = useCallback(() => {
    if (suggestionsLoading || suggestions.length >= suggestionsTotal) return;
    setSuggestionsLoading(true);
    cachedFetch<{ data: RecipeSuggestion[]; total: number }>(
      `/api/recetas?search=${encodeURIComponent(search)}&limit=${PAGE_SIZE}&offset=${suggestions.length}`,
    )
      .then((res) => {
        setSuggestions((prev) => [...prev, ...(res.data ?? [])]);
        setSuggestionsTotal(res.total ?? 0);
      })
      .finally(() => setSuggestionsLoading(false));
  }, [suggestionsLoading, suggestions.length, suggestionsTotal, search]);

  // Scroll handler for dropdown
  const handleDropdownScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
        loadMoreSuggestions();
      }
    },
    [loadMoreSuggestions],
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function addRecipe(recipeId: string) {
    setSearch("");
    setShowSuggestions(false);
    setAdding(true);
    await fetch("/api/despensa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "congelador",
        recipe_id: recipeId,
        servings: 4,
      }),
    });
    await fetchItems();
    setAdding(false);
  }

  async function addCustomDish() {
    if (!search.trim()) return;
    setSearch("");
    setShowSuggestions(false);
    setAdding(true);
    const res = await fetch("/api/despensa/tupper-extras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: search.trim(), quantity: 1 }),
    });
    if (res.ok) {
      const data = await res.json();
      setExtras((prev) => [data, ...prev]);
    }
    setAdding(false);
  }

  async function updateServings(id: string, servings: number) {
    if (servings <= 0) {
      return removeItem(id);
    }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, servings } : i)));
    await fetch("/api/despensa", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, servings }),
    });
  }

  async function updateExtraQuantity(id: string, quantity: number) {
    if (quantity <= 0) {
      return removeExtra(id);
    }
    setExtras((prev) => prev.map((e) => (e.id === id ? { ...e, quantity } : e)));
    await fetch("/api/despensa/tupper-extras", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, quantity }),
    });
  }

  async function removeItem(id: string) {
    setRemovingId(id);
    await fetch(`/api/despensa?id=${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
    setRemovingId(null);
  }

  async function removeExtra(id: string) {
    setRemovingId(id);
    await fetch(`/api/despensa/tupper-extras?id=${id}`, { method: "DELETE" });
    setExtras((prev) => prev.filter((e) => e.id !== id));
    setRemovingId(null);
  }

  async function clearAll() {
    if (!confirm("¿Vaciar todos los tuppers?")) return;
    await Promise.all([
      fetch("/api/despensa?location=congelador", { method: "DELETE" }),
      fetch("/api/despensa/tupper-extras", { method: "DELETE" }),
    ]);
    setItems([]);
    setExtras([]);
  }

  const mealTypeStyles: Record<string, string> = {
    comida: "bg-primary/10 text-primary",
    cena: "bg-night/10 text-night",
    postre: "bg-rose/15 text-rose",
  };

  const mealTypeLabels: Record<string, string> = {
    comida: "Comida",
    cena: "Cena",
    postre: "Postre",
  };

  const tupperLidColors: Record<string, string> = {
    comida: "bg-primary/30",
    cena: "bg-night/30",
    postre: "bg-rose/30",
  };

  const totalItems = items.length + extras.length;

  return (
    <>
      {/* Search to add */}
      <div ref={searchRef} className="relative">
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
            placeholder="Buscar receta o añadir plato..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addCustomDish();
            }}
            className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && search.trim().length > 0 && (
          <div
            ref={dropdownRef}
            onScroll={handleDropdownScroll}
            className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-border bg-card shadow-lg"
          >
            {suggestions.map((recipe) => (
              <button
                key={recipe.id}
                onClick={() => addRecipe(recipe.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-primary-light transition-colors"
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
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{recipe.title}</p>
                </div>
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${mealTypeStyles[recipe.meal_type] || ""}`}
                >
                  {mealTypeLabels[recipe.meal_type] || recipe.meal_type}
                </span>
              </button>
            ))}
            {suggestionsLoading && (
              <div className="animate-pulse space-y-0">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className="h-7 w-7 shrink-0 rounded-lg bg-primary-light/30" />
                    <div className="h-4 flex-1 rounded-lg bg-primary-light/25" />
                    <div className="h-3 w-14 rounded bg-primary-light/20" />
                  </div>
                ))}
              </div>
            )}
            {/* Custom add option */}
            <button
              onClick={addCustomDish}
              className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left text-sm hover:bg-primary-light transition-colors"
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
                Añadir &quot;<span className="font-semibold">{search.trim()}</span>&quot;
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Items list */}
      {loading ? (
        <div className="mt-6 animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-primary-light/25" />
          ))}
        </div>
      ) : totalItems === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-olive/10 text-olive">
            <svg
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <div>
            <p className="font-heading text-lg font-semibold">
              No hay tuppers
            </p>
            <p className="mt-1 text-sm text-muted">
              Busca recetas o añade platos para guardarlos.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm text-muted">
              {totalItems} plato{totalItems !== 1 ? "s" : ""}
            </p>
            <button
              onClick={clearAll}
              className="text-xs font-medium text-red-500 hover:text-red-600"
            >
              Vaciar tuppers
            </button>
          </div>
          <ul className="mt-3 space-y-2">
            {adding && (
              <li className="animate-pulse overflow-hidden rounded-2xl border border-border shadow-sm">
                <div className="h-2.5 bg-primary-light/40" />
                <div className="flex items-center gap-3 bg-card px-4 py-3">
                  <div className="h-4 w-12 rounded bg-primary-light/40" />
                  <div className="h-4 w-2/5 rounded-lg bg-primary-light/30" />
                  <div className="ml-auto h-4 w-14 rounded-lg bg-primary-light/25" />
                </div>
              </li>
            )}
            {/* Recipe-based items */}
            {items.map((item) => {
              const lidColor = tupperLidColors[item.recipe?.meal_type || "comida"] || tupperLidColors.comida;
              return (
                <li
                  key={item.id}
                  className={`overflow-hidden rounded-2xl border border-border shadow-sm transition-opacity ${
                    removingId === item.id ? "animate-pulse opacity-40" : ""
                  }`}
                >
                  {/* Lid */}
                  <div className={`h-2.5 ${lidColor}`}>
                    <div className="mx-auto flex h-full items-center justify-center"><div className="h-0.5 w-12 rounded-full bg-white/40" /></div>
                  </div>
                  {/* Body */}
                  <div className="flex items-center gap-3 bg-card px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {item.recipe && (
                          <span
                            className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${mealTypeStyles[item.recipe.meal_type] || ""}`}
                          >
                            {mealTypeLabels[item.recipe.meal_type] || ""}
                          </span>
                        )}
                        <p className="truncate text-sm font-medium">
                          {item.recipe?.title ?? "Receta"}
                        </p>
                      </div>
                    </div>

                    {/* Servings selector */}
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        onClick={() =>
                          updateServings(item.id, item.servings - 1)
                        }
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-sm font-bold transition-colors hover:bg-primary-light"
                      >
                        −
                      </button>
                      <span className="w-5 text-center text-sm font-semibold">
                        {item.servings}
                      </span>
                      <button
                        onClick={() =>
                          updateServings(item.id, Math.min(20, item.servings + 1))
                        }
                        disabled={item.servings >= 20}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-sm font-bold transition-colors hover:bg-primary-light disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
            {/* Custom tupper extras */}
            {extras.map((extra) => (
              <li
                key={extra.id}
                className={`overflow-hidden rounded-2xl border border-border shadow-sm transition-opacity ${
                  removingId === extra.id ? "animate-pulse opacity-40" : ""
                }`}
              >
                {/* Lid */}
                <div className="h-2.5 bg-saffron/40">
                  <div className="mx-auto flex h-full items-center justify-center"><div className="h-0.5 w-12 rounded-full bg-white/40" /></div>
                </div>
                {/* Body */}
                <div className="flex items-center gap-3 bg-card px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium bg-saffron/15 text-saffron">
                        Manual
                      </span>
                      <p className="truncate text-sm font-medium capitalize">
                        {extra.name}
                      </p>
                    </div>
                  </div>

                  {/* Quantity selector */}
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      onClick={() =>
                        updateExtraQuantity(extra.id, extra.quantity - 1)
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-sm font-bold transition-colors hover:bg-primary-light"
                    >
                      −
                    </button>
                    <span className="w-5 text-center text-sm font-semibold">
                      {extra.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateExtraQuantity(extra.id, Math.min(20, extra.quantity + 1))
                      }
                      disabled={extra.quantity >= 20}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-sm font-bold transition-colors hover:bg-primary-light disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

// ==================== SHELF GRID ====================

function ShelfGrid({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shelfYs, setShelfYs] = useState<number[]>([]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function measure() {
      const container = containerRef.current;
      if (!container) return;
      const kids = Array.from(container.children).filter(
        (c) => !(c as HTMLElement).dataset.shelf,
      );
      if (kids.length === 0) { setShelfYs([]); return; }

      const containerTop = container.getBoundingClientRect().top;
      const rowBottoms: number[] = [];
      let currentRowBottom = 0;

      for (const child of kids) {
        const rect = child.getBoundingClientRect();
        const bottom = rect.bottom - containerTop;
        if (bottom > currentRowBottom + 2) {
          if (currentRowBottom > 0) rowBottoms.push(currentRowBottom);
          currentRowBottom = bottom;
        } else {
          currentRowBottom = Math.max(currentRowBottom, bottom);
        }
      }
      if (currentRowBottom > 0) rowBottoms.push(currentRowBottom);
      setShelfYs(rowBottoms);
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [children]);

  return (
    <div ref={containerRef} className="relative mt-3 flex flex-wrap items-end gap-2 px-1 pb-3">
      {children}
      {shelfYs.map((y, i) => (
        <div
          key={i}
          data-shelf="true"
          className="pointer-events-none absolute left-0 right-0"
          style={{ top: y + 4 }}
        >
          <div className="h-1 rounded-b bg-gradient-to-b from-amber-800/20 to-amber-900/10 shadow-[0_1px_2px_rgba(120,80,40,0.12)]" />
        </div>
      ))}
    </div>
  );
}

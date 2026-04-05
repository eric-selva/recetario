"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Skeleton } from "boneyard-js/react";
import RecipeCard from "@/components/RecipeCard";
import SlidingFilter from "@/components/SlidingFilter";
import type { Recipe } from "@/types/database";

const mealTypes = [
  { value: "todas", label: "Todas" },
  { value: "desayuno", label: "Desayuno" },
  { value: "comida", label: "Comida" },
  { value: "cena", label: "Cena" },
];

type ViewMode = "grid-3" | "grid-2" | "list";

const viewModeGridClass: Record<ViewMode, string> = {
  "grid-3": "grid gap-6 grid-cols-1",
  "grid-2": "grid gap-6 grid-cols-2",
  list: "flex flex-col gap-4",
};

export default function RecetasPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [mealType, setMealType] = useState("comida");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid-2");

  useEffect(() => {
    const saved = localStorage.getItem("recetas-view") as ViewMode;
    if (saved === "grid-3" || saved === "grid-2" || saved === "list") {
      setViewMode(saved);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    localStorage.setItem("recetas-view", viewMode);
  }, [viewMode]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (mealType !== "todas") params.set("meal_type", mealType);
    if (searchDebounced) params.set("search", searchDebounced);

    fetch(`/api/recetas?${params}`)
      .then((res) => res.json())
      .then((data) => setRecipes(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [mealType, searchDebounced]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Recetas</h1>
          <p className="mt-1 text-sm text-muted">Tu coleccion de sabores</p>
        </div>
        <Link
          href="/recetas/nueva"
          className="inline-flex items-center gap-1.5 rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary-dark hover:shadow-lg"
        >
          + Nueva
        </Link>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-row items-center gap-3">
        {/* View mode toggle */}
        <div className="flex rounded-xl border border-border bg-card p-1">
          {/* 3-column grid (original) */}
          <button
            onClick={() => setViewMode("grid-3")}
            className={`rounded-lg p-2 transition-colors ${
              viewMode === "grid-3"
                ? "bg-primary/15 text-primary"
                : "text-muted hover:text-foreground"
            }`}
            title="Cuadrícula 3 columnas"
            aria-label="Vista cuadrícula 3 columnas"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <rect
                x="3"
                y="3"
                width="18"
                height="18"
                rx="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {/* 2-column grid */}
          <button
            onClick={() => setViewMode("grid-2")}
            className={`rounded-lg p-2 transition-colors ${
              viewMode === "grid-2"
                ? "bg-primary/15 text-primary"
                : "text-muted hover:text-foreground"
            }`}
            title="Cuadrícula 2 columnas"
            aria-label="Vista cuadrícula 2 columnas"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <rect
                x="3"
                y="3"
                width="7"
                height="7"
                rx="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <rect
                x="14"
                y="3"
                width="7"
                height="7"
                rx="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <rect
                x="3"
                y="14"
                width="7"
                height="7"
                rx="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <rect
                x="14"
                y="14"
                width="7"
                height="7"
                rx="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {/* List */}
          <button
            onClick={() => setViewMode("list")}
            className={`rounded-lg p-2 transition-colors ${
              viewMode === "list"
                ? "bg-primary/15 text-primary"
                : "text-muted hover:text-foreground"
            }`}
            title="Lista"
            aria-label="Vista lista"
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
                d="M3.75 12h16.5m-16.5 5.25h16.5m-16.5-10.5h16.5"
              />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1">
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
            placeholder="Buscar por titulo o ingrediente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </div>
      </div>

      {/* Meal type selector */}
      <div className="mt-3">
        <SlidingFilter
          options={mealTypes}
          value={mealType}
          onChange={setMealType}
        />
      </div>

      {/* Recipe grid */}
      <Skeleton
        name="recipe-grid"
        loading={loading}
        className="mt-8"
        fallback={
          viewMode === "list" ? (
            <div className="flex flex-col gap-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="flex animate-pulse overflow-hidden rounded-2xl border border-border bg-card"
                >
                  <div className="h-28 w-28 shrink-0 bg-primary-light/30 sm:w-32" />
                  <div className="flex flex-1 flex-col justify-center p-4 space-y-3">
                    <div className="h-5 w-20 rounded-lg bg-primary-light/40" />
                    <div className="h-5 w-3/4 rounded-lg bg-primary-light/30" />
                    <div className="h-4 w-1/2 rounded-lg bg-primary-light/20" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={viewModeGridClass[viewMode]}>
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse overflow-hidden rounded-2xl border border-border bg-card"
                >
                  <div className="aspect-4/3 bg-primary-light/30" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 w-20 rounded-lg bg-primary-light/40" />
                    <div className="h-5 w-3/4 rounded-lg bg-primary-light/30" />
                    <div className="h-4 w-full rounded-lg bg-primary-light/20" />
                  </div>
                </div>
              ))}
            </div>
          )
        }
      >
        {recipes.length === 0 ? (
          <div className="mt-16 flex flex-col items-center gap-5 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <svg
                className="h-10 w-10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2C6.48 2 2 6 2 10c0 2.5 1.5 4.5 3 6l1 6h12l1-6c1.5-1.5 3-3.5 3-6 0-4-4.48-8-10-8z" />
                <path d="M9 22h6" />
              </svg>
            </div>
            <div>
              <p className="font-heading text-xl font-semibold">
                No hay recetas
              </p>
              <p className="mt-1 text-sm text-muted">
                {search || mealType !== "todas"
                  ? "No se encontraron recetas con estos filtros."
                  : "Empieza creando tu primera receta."}
              </p>
            </div>
            {!search && mealType === "todas" && (
              <Link
                href="/recetas/nueva"
                className="mt-2 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary-dark"
              >
                Crear receta
              </Link>
            )}
          </div>
        ) : (
          <div className={viewModeGridClass[viewMode]}>
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                viewMode={viewMode === "list" ? "list" : viewMode === "grid-2" ? "grid-compact" : "grid"}
              />
            ))}
          </div>
        )}
      </Skeleton>
    </div>
  );
}

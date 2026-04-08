"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Recipe } from "@/types/database";
import { getColors } from "@/lib/mealColors";

const mealTypeLabels: Record<string, string> = {
  comida: "Comida",
  cena: "Cena",
  postre: "Postre",
};

const mealTypeStyles: Record<
  string,
  { bg: string; text: string; icon: string }
> = {
  comida: {
    bg: "bg-primary/10",
    text: "text-primary",
    icon: "M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41M12 8a4 4 0 100 8 4 4 0 000-8z",
  },
  cena: {
    bg: "bg-night/10",
    text: "text-night",
    icon: "M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z",
  },
  postre: {
    bg: "bg-rose/15",
    text: "text-rose",
    icon: "M12 8c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zM9 2l.5 3h5L15 2M12 22c-1.1 0-2-.9-2-2h4c0 1.1-.9 2-2 2z",
  },
};

interface RecipeCardProps {
  recipe: Recipe;
  viewMode?: "grid" | "grid-compact" | "list";
  onAddedToList?: () => void;
}

function AddToListButton({
  recipeId,
  onAdded,
  compact = false,
  mealType = "comida",
}: {
  recipeId: string;
  onAdded?: () => void;
  compact?: boolean;
  mealType?: string;
}) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const colors = getColors(mealType);

  async function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (adding || added) return;
    setAdding(true);
    const res = await fetch("/api/lista-compra", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipe_id: recipeId, servings: 4 }),
    });
    setAdding(false);
    if (res.ok) {
      setAdded(true);
      onAdded?.();
      setTimeout(() => setAdded(false), 2000);
    }
  }

  return (
    <button
      onClick={handleAdd}
      disabled={adding}
      title={added ? "Añadido" : "Añadir a la lista de compra"}
      className={`inline-flex items-center justify-center rounded-xl transition-all ${
        added
          ? `${colors.bgLight} ${colors.text}`
          : `${colors.bgLight} ${colors.text} hover:opacity-80`
      } ${compact ? "h-8 w-8" : "gap-1.5 px-3 py-1.5 text-xs font-medium"} disabled:opacity-50`}
    >
      {adding ? (
        <svg
          className="h-3.5 w-3.5 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth={4}
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : added ? (
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 12.75l6 6 9-13.5"
          />
        </svg>
      ) : (
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
      )}
      {!compact && (added ? "Añadido" : "Lista")}
    </button>
  );
}

export default function RecipeCard({
  recipe,
  viewMode = "grid",
  onAddedToList,
}: RecipeCardProps) {
  const style = mealTypeStyles[recipe.meal_type] ?? mealTypeStyles.comida;
  const compact = viewMode === "grid-compact";

  const colors = getColors(recipe.meal_type);

  if (viewMode === "list") {
    return (
      <div className={`group relative flex h-28 overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-md hover:${colors.border}`}>
        <Link href={`/recetas/${recipe.id}`} className="flex min-w-0 flex-1">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden bg-primary-light/30 sm:w-32">
            {recipe.image_url ? (
              <Image
                src={recipe.image_url}
                alt={recipe.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="144px"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-primary/20">
                <svg
                  className="h-10 w-10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={0.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2C6.48 2 2 6 2 10c0 2.5 1.5 4.5 3 6l1 6h12l1-6c1.5-1.5 3-3.5 3-6 0-4-4.48-8-10-8z" />
                  <path d="M9 22h6" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center px-3 pr-12">
            <div className="mb-0.5 flex items-center gap-1.5 overflow-hidden">
              <span
                className={`inline-flex shrink-0 items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium ${style.bg} ${style.text}`}
              >
                {mealTypeLabels[recipe.meal_type]}
              </span>
              {recipe.prep_time > 0 && (
                <span className="flex shrink-0 items-center gap-0.5 text-[10px] text-muted">
                  <svg
                    className="h-2.5 w-2.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {recipe.prep_time} min
                </span>
              )}
              {recipe.calories != null && recipe.calories > 0 && (
                <span className="flex shrink-0 items-center gap-0.5 text-[10px] text-muted">
                  <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1.001A3.75 3.75 0 0012 18z" />
                  </svg>
                  {recipe.calories} kcal
                </span>
              )}
            </div>
            <h3 className="line-clamp-2 font-heading text-base font-semibold leading-tight sm:line-clamp-1 sm:text-lg sm:leading-snug">
              {recipe.title}
            </h3>
            {recipe.description && (
              <p className="mt-0.5 line-clamp-1 text-xs leading-snug text-muted sm:line-clamp-2">
                {recipe.description}
              </p>
            )}
          </div>
        </Link>
        <div className="absolute right-3 top-1/2 z-10 -translate-y-1/2">
          <AddToListButton
            recipeId={recipe.id}
            onAdded={onAddedToList}
            mealType={recipe.meal_type}
            compact
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-md hover:${colors.border} ${compact ? "h-52 sm:h-[28rem]" : "h-[24rem] sm:h-[28rem]"}`}
    >
      <Link href={`/recetas/${recipe.id}`} className="flex h-full flex-col">
        <div
          className={`relative shrink-0 overflow-hidden bg-primary-light/30 ${compact ? "h-28 sm:h-64" : "h-52 sm:h-72"}`}
        >
          {recipe.image_url ? (
            <Image
              src={recipe.image_url}
              alt={recipe.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, 50vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-primary/20">
              <svg
                className="h-16 w-16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={0.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2C6.48 2 2 6 2 10c0 2.5 1.5 4.5 3 6l1 6h12l1-6c1.5-1.5 3-3.5 3-6 0-4-4.48-8-10-8z" />
                <path d="M9 22h6" />
                <path d="M12 2v4" />
                <path d="M8 4l1 3" />
                <path d="M16 4l-1 3" />
              </svg>
            </div>
          )}
          {recipe.image_url && (
            <div className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-black/20 to-transparent" />
          )}
        </div>
        <div
          className={`flex min-h-0 flex-1 flex-col ${compact ? "p-2 sm:p-4" : "p-4"}`}
        >
          <div
            className={`flex items-center gap-1.5 ${compact ? "mb-0.5 sm:mb-2" : "mb-2"}`}
          >
            <span
              className={`inline-flex items-center gap-0.5 font-medium ${style.bg} ${style.text} ${compact ? "rounded px-1.5 py-0.5 text-[10px] sm:gap-1 sm:rounded-lg sm:px-2.5 sm:py-1 sm:text-xs" : "gap-1 rounded-lg px-2.5 py-1 text-xs"}`}
            >
              <svg
                className={compact ? "hidden sm:block h-3 w-3" : "h-3 w-3"}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={style.icon}
                />
              </svg>
              {mealTypeLabels[recipe.meal_type]}
            </span>
            {recipe.prep_time > 0 && (
              <span
                className={`flex items-center text-muted ${compact ? "gap-0.5 text-[10px] sm:gap-1 sm:text-xs" : "gap-1 text-xs"}`}
              >
                <svg
                  className={compact ? "h-2.5 w-2.5 sm:h-3 sm:w-3" : "h-3 w-3"}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {recipe.prep_time} min
              </span>
            )}
            {recipe.calories != null && recipe.calories > 0 && (
              <span
                className={`flex items-center text-muted ${compact ? "gap-0.5 text-[10px] sm:gap-1 sm:text-xs" : "gap-1 text-xs"}`}
              >
                <svg
                  className={compact ? "h-2.5 w-2.5 sm:h-3 sm:w-3" : "h-3 w-3"}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1.001A3.75 3.75 0 0012 18z" />
                </svg>
                {recipe.calories} kcal
              </span>
            )}
            <span className="ml-auto">
              <AddToListButton
                recipeId={recipe.id}
                onAdded={onAddedToList}
                mealType={recipe.meal_type}
                compact
              />
            </span>
          </div>
          <h3
            className={`line-clamp-2 font-heading font-semibold leading-tight ${compact ? "text-sm sm:text-lg" : "text-lg sm:text-xl"}`}
          >
            {recipe.title}
          </h3>
          {recipe.description && (
            <p
              className={`mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted ${compact ? "hidden sm:block" : ""}`}
            >
              {recipe.description}
            </p>
          )}
        </div>
      </Link>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Skeleton } from "boneyard-js/react";
import Toast from "@/components/Toast";
import { getColors } from "@/lib/mealColors";
import type { RecipeWithDetails } from "@/types/database";

const mealTypeLabels: Record<string, string> = {
  comida: "Comida",
  cena: "Cena",
  postre: "Postre",
};

const mealTypeStyles: Record<string, string> = {
  comida: "bg-primary/10 text-primary",
  cena: "bg-night/10 text-night",
  postre: "bg-rose/15 text-rose",
};

export default function RecetaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [recipe, setRecipe] = useState<RecipeWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToList, setAddingToList] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [servings, setServings] = useState(4);

  useEffect(() => {
    fetch(`/api/recetas/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setRecipe(data);
        if (data?.meal_type) {
          localStorage.setItem("recetas-tab", data.meal_type);
          setServings(data.meal_type === "comida" ? 4 : 2);
        }
      })
      .catch(() => setRecipe(null))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleAddToShoppingList() {
    setAddingToList(true);
    const res = await fetch("/api/lista-compra", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipe_id: id, servings }),
    });
    if (res.ok) {
      setToast("Receta añadida a la lista de compra");
    }
    setAddingToList(false);
  }

  async function handleDelete() {
    if (!confirm("¿Seguro que quieres eliminar esta receta?")) return;
    const res = await fetch(`/api/recetas/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/recetas");
  }

  if (!loading && !recipe) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <svg
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="font-heading text-xl font-semibold">
          Receta no encontrada
        </p>
        <Link
          href="/recetas"
          className="mt-4 inline-flex items-center gap-1 text-primary hover:text-primary-dark"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Volver a recetas
        </Link>
      </div>
    );
  }

  return (
    <Skeleton
      name="recipe-detail"
      loading={loading}
      className="mx-auto max-w-5xl px-4 py-8"
      fallback={
        <div className="animate-pulse space-y-6">
          <div className="h-5 w-32 rounded-lg bg-primary-light/40" />
          <div className="aspect-video rounded-2xl bg-primary-light/30" />
          <div className="space-y-3">
            <div className="h-8 w-3/4 rounded-lg bg-primary-light/40" />
            <div className="h-5 w-full rounded-lg bg-primary-light/30" />
          </div>
          <div className="flex gap-3">
            <div className="h-11 w-56 rounded-2xl bg-primary-light/30" />
            <div className="h-11 w-24 rounded-2xl bg-primary-light/20" />
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-primary-light/20" />
            ))}
          </div>
        </div>
      }
    >
      {recipe && (() => {
        const c = getColors(recipe.meal_type);
        return (
        <div>
          {/* Back link */}
          <Link
            href="/recetas"
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Volver a recetas
          </Link>

          {/* Image */}
          {recipe.image_url && (
            <div className="relative mt-5 aspect-video overflow-hidden rounded-2xl border border-border bg-primary-light/20">
              <Image
                src={recipe.image_url}
                alt={recipe.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
                priority
              />
            </div>
          )}

          {/* Title & meta */}
          <div className="mt-3">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`rounded-lg px-3 py-1 text-xs font-semibold ${mealTypeStyles[recipe.meal_type]}`}
              >
                {mealTypeLabels[recipe.meal_type]}
              </span>
              {recipe.prep_time > 0 && (
                <span className="flex items-center gap-1 text-sm text-muted">
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
                      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {recipe.prep_time} min
                </span>
              )}
              {recipe.calories != null && recipe.calories > 0 && (
                <span className="flex items-center gap-1 text-sm text-muted">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1.001A3.75 3.75 0 0012 18z" />
                  </svg>
                  {recipe.calories} kcal
                </span>
              )}
            </div>

            <h1 className="mt-4 font-heading text-3xl font-bold leading-tight sm:text-4xl">
              {recipe.title}
            </h1>
            {recipe.description && (
              <p className="mt-3 text-lg leading-snug text-muted">
                {recipe.description}
              </p>
            )}

            {/* Servings selector + Add button */}
            <div className="mt-4 flex items-center gap-3">
              <svg
                className="h-4 w-4 text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                />
              </svg>
              <span className="text-sm font-medium text-muted">Raciones:</span>
              <div className="flex items-center">
                <button
                  onClick={() => setServings(Math.max(1, servings - 1))}
                  disabled={servings <= 1}
                  className={`flex h-7 w-7 items-center justify-center rounded-l-lg border border-border bg-card text-sm font-semibold transition-all disabled:opacity-30 sm:h-9 sm:w-9 sm:rounded-l-xl sm:text-lg hover:opacity-80 ${c.text}`}
                >
                  −
                </button>
                <span className={`flex h-7 w-8 items-center justify-center border-y border-border text-xs font-bold sm:h-9 sm:w-10 sm:text-sm ${c.bgLight} ${c.text}`}>
                  {servings}
                </span>
                <button
                  onClick={() => setServings(Math.min(8, servings + 1))}
                  disabled={servings >= 8}
                  className={`flex h-7 w-7 items-center justify-center rounded-r-lg border border-border bg-card text-sm font-semibold transition-all disabled:opacity-30 sm:h-9 sm:w-9 sm:rounded-r-xl sm:text-lg hover:opacity-80 ${c.text}`}
                >
                  +
                </button>
              </div>
              <button
                onClick={handleAddToShoppingList}
                disabled={addingToList}
                className={`ml-auto inline-flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 sm:gap-2 sm:rounded-2xl sm:px-5 sm:py-2 sm:text-sm ${c.bg} ${c.shadow}`}
              >
                {addingToList ? "Añadiendo..." : "+ Añadir"}
              </button>
            </div>
          </div>

          <div className="divider-herbs my-10" />

          {/* Ingredients */}
          {recipe.ingredients.length > 0 && (
            <section>
              <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${c.bgLight} ${c.text}`}>
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
                <h2 className="font-heading text-xl font-bold">Ingredientes</h2>
              </div>
              <ul className="mt-4 space-y-2">
                {recipe.ingredients.map((ing) => (
                  <li
                    key={ing.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-card-hover"
                  >
                    <span className={`text-sm font-semibold ${c.text}`}>
                      {ing.quantity > 0 &&
                        `${formatQty(ing.quantity * servings)} ${ing.unit}`}
                    </span>
                    <span className="text-sm">{ing.name}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Steps */}
          {recipe.steps.length > 0 && (
            <section className="mt-10">
              <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${c.bgLight} ${c.text}`}>
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
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <h2 className="font-heading text-xl font-bold">Paso a paso</h2>
              </div>
              <ol className="mt-4 space-y-4">
                {recipe.steps.map((step, i) => (
                  <li key={step.id} className="flex gap-4">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm ${c.bg}`}>
                      {i + 1}
                    </span>
                    <p className="pt-1 leading-relaxed text-foreground/90">
                      {step.instruction}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Edit & Delete */}
          <div className="divider-herbs my-10" />
          <div className="flex flex-wrap gap-3">
            {recipe.is_owner && (
              <Link
                href={`/recetas/${id}/editar`}
                className="inline-flex items-center gap-2 rounded-2xl border border-border px-6 py-3 text-sm font-semibold transition-all hover:border-primary/30 hover:bg-primary-light/30"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
                Editar
              </Link>
            )}
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-2 rounded-2xl border border-red-200 px-6 py-3 text-sm font-semibold text-red-600 transition-all hover:bg-red-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              {recipe.is_owner ? "Eliminar" : "Quitar de mis recetas"}
            </button>
          </div>

          {toast && <Toast message={toast} onClose={() => setToast(null)} />}
        </div>
        );
      })()}
    </Skeleton>
  );
}

function formatQty(q: number): string {
  if (q === 0) return "0";
  const rounded = Math.round(q * 100) / 100;
  return rounded % 1 === 0
    ? rounded.toString()
    : rounded.toFixed(1).replace(/\.0$/, "");
}

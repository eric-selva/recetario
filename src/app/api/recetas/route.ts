import { supabase } from "@/lib/supabase";
import type { NextRequest } from "next/server";

// GET /api/recetas — list recipes (with optional filters + pagination)
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const mealType = searchParams.get("meal_type");
  const search = searchParams.get("search");
  const limit = Math.min(Number(searchParams.get("limit")) || 10, 50);
  const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

  let query = supabase
    .from("recipes")
    .select("*", { count: "exact" })
    .order("title", { ascending: true });

  if (mealType && mealType !== "todas") {
    query = query.eq("meal_type", mealType);
  }

  // If search term, we need all results first to filter by ingredient names,
  // then paginate the filtered set
  if (search && search.trim()) {
    const term = search.toLowerCase().trim();

    // Fetch all (no pagination) for search—we filter in-memory
    const { data: allRecipes, error } = await supabase
      .from("recipes")
      .select("*")
      .order("title", { ascending: true })
      .then((res) => {
        if (res.error) return res;
        if (mealType && mealType !== "todas") {
          return {
            ...res,
            data: res.data?.filter((r) => r.meal_type === mealType) ?? [],
          };
        }
        return res;
      });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const recipes = allRecipes || [];
    const recipeIds = recipes.map((r) => r.id);
    const { data: ingredients } = await supabase
      .from("ingredients")
      .select("recipe_id, name, catalog:catalog_id(name)")
      .in("recipe_id", recipeIds);

    const ingredientsByRecipe = new Map<string, string[]>();
    for (const ing of ingredients || []) {
      const list = ingredientsByRecipe.get(ing.recipe_id) || [];
      const catalogData = ing.catalog as unknown as { name: string } | null;
      const ingName = catalogData?.name ?? "";
      list.push(ingName.toLowerCase());
      ingredientsByRecipe.set(ing.recipe_id, list);
    }

    const filtered = recipes.filter((recipe) => {
      const titleMatch = recipe.title.toLowerCase().includes(term);
      const ingredientMatch = (ingredientsByRecipe.get(recipe.id) || []).some(
        (name) => name.includes(term),
      );
      return titleMatch || ingredientMatch;
    });

    const page = filtered.slice(offset, offset + limit);
    return Response.json({ data: page, total: filtered.length });
  }

  // No search: use Supabase range for efficient pagination
  query = query.range(offset, offset + limit - 1);
  const { data: recipes, error, count } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ data: recipes || [], total: count ?? 0 });
}

// POST /api/recetas — create a new recipe with ingredients and steps
export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    title,
    description,
    image_url,
    meal_type,
    prep_time,
    servings,
    ingredients,
    steps,
  } = body;

  // Insert recipe
  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .insert({ title, description, image_url, meal_type, prep_time, servings })
    .select()
    .single();

  if (recipeError) {
    return Response.json({ error: recipeError.message }, { status: 500 });
  }

  // Insert ingredients
  if (ingredients?.length) {
    // Resolve catalog IDs for each ingredient
    const ingredientRows = [];
    for (let i = 0; i < ingredients.length; i++) {
      const ing = ingredients[i] as {
        name: string;
        quantity: number;
        unit: string;
        shoppable?: boolean;
        catalog_id?: string;
      };

      // Use provided catalog_id or look up / create catalog entry
      const catalogId = ing.catalog_id ?? await resolveCatalogId(
        ing.name,
        ing.unit,
        ing.shoppable,
      );

      ingredientRows.push({
        recipe_id: recipe.id,
        catalog_id: catalogId,
        quantity: ing.quantity,
        unit: ing.unit,
        order: i,
      });
    }

    const { error: ingError } = await supabase
      .from("ingredients")
      .insert(ingredientRows);
    if (ingError) {
      return Response.json({ error: ingError.message }, { status: 500 });
    }
  }

  // Insert steps
  if (steps?.length) {
    const stepRows = steps.map((step: { instruction: string }, i: number) => ({
      recipe_id: recipe.id,
      order: i,
      instruction: step.instruction,
    }));

    const { error: stepError } = await supabase.from("steps").insert(stepRows);
    if (stepError) {
      return Response.json({ error: stepError.message }, { status: 500 });
    }
  }

  return Response.json(recipe, { status: 201 });
}

// Look up or create a catalog entry, returns catalog ID
async function resolveCatalogId(
  name: string,
  unit: string,
  shoppable?: boolean,
): Promise<string | null> {
  const trimmed = name.trim();

  // Try to find existing
  const { data: existing } = await supabase
    .from("catalog")
    .select("id")
    .ilike("name", trimmed)
    .limit(1)
    .single();

  if (existing) return existing.id;

  // Create new catalog entry
  const { data: created } = await supabase
    .from("catalog")
    .insert({
      name: trimmed,
      default_unit: unit,
      shoppable: shoppable ?? true,
    })
    .select("id")
    .single();

  return created?.id ?? null;
}

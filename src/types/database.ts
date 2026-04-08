export type MealType = 'comida' | 'cena' | 'postre'

export type IngredientUnit = 'g' | 'kg' | 'ml' | 'l' | 'unidad' | 'cucharada' | 'cucharadita' | 'pizca' | 'al gusto'

export interface Recipe {
  id: string
  title: string
  description: string
  image_url: string | null
  meal_type: MealType
  prep_time: number
  calories?: number | null
  servings: number
  owner_id?: string | null
  created_at: string
  updated_at: string
}

export interface CatalogItem {
  id: string
  name: string
  default_unit: string
  shoppable: boolean
}

// name and shoppable come from catalog join, not stored on ingredients table
export interface Ingredient {
  id: string
  recipe_id: string
  catalog_id: string
  name: string
  quantity: number
  unit: IngredientUnit
  order: number
  shoppable: boolean
}

export interface Step {
  id: string
  recipe_id: string
  order: number
  instruction: string
}

export interface ShoppingListItem {
  id: string
  recipe_id: string
  added_at: string
  servings: number
  recipe?: Recipe
}

// name comes from catalog join, not stored on pantry table
export interface PantryItem {
  id: string
  location: 'nevera' | 'congelador'
  name: string | null
  catalog_id: string | null
  quantity: number
  unit: string
  recipe_id: string | null
  servings: number
  added_at: string
  recipe?: Recipe
}

export interface RecipeWithDetails extends Recipe {
  is_owner?: boolean
  ingredients: Ingredient[]
  steps: Step[]
}

export interface Database {
  public: {
    Tables: {
      recipes: {
        Row: Recipe
        Insert: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Recipe, 'id' | 'created_at' | 'updated_at'>>
      }
      ingredients: {
        Row: Ingredient
        Insert: Omit<Ingredient, 'id'>
        Update: Partial<Omit<Ingredient, 'id'>>
      }
      steps: {
        Row: Step
        Insert: Omit<Step, 'id'>
        Update: Partial<Omit<Step, 'id'>>
      }
      shopping_list: {
        Row: ShoppingListItem
        Insert: Omit<ShoppingListItem, 'id' | 'added_at'>
        Update: Partial<Omit<ShoppingListItem, 'id' | 'added_at'>>
      }
    }
  }
}

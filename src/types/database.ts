export type MealType = 'desayuno' | 'comida' | 'cena'

export type IngredientUnit = 'g' | 'kg' | 'ml' | 'l' | 'unidad' | 'cucharada' | 'cucharadita' | 'pizca' | 'al gusto'

export interface Recipe {
  id: string
  title: string
  description: string
  image_url: string | null
  meal_type: MealType
  prep_time: number
  servings: number
  created_at: string
  updated_at: string
}

export interface Ingredient {
  id: string
  recipe_id: string
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

export interface RecipeWithDetails extends Recipe {
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

/** Centralized color scheme per meal_type */
export const mealColors: Record<string, {
  bg: string;
  bgLight: string;
  text: string;
  shadow: string;
  hover: string;
  ring: string;
  border: string;
}> = {
  comida: {
    bg: "bg-primary",
    bgLight: "bg-primary/15",
    text: "text-primary",
    shadow: "shadow-primary/20",
    hover: "hover:bg-primary-dark",
    ring: "focus:border-primary focus:ring-primary/10",
    border: "border-primary/20",
  },
  cena: {
    bg: "bg-night",
    bgLight: "bg-night/15",
    text: "text-night",
    shadow: "shadow-night/20",
    hover: "hover:bg-night/80",
    ring: "focus:border-night focus:ring-night/10",
    border: "border-night/20",
  },
  postre: {
    bg: "bg-rose",
    bgLight: "bg-rose/15",
    text: "text-rose",
    shadow: "shadow-rose/20",
    hover: "hover:bg-rose/80",
    ring: "focus:border-rose focus:ring-rose/10",
    border: "border-rose/20",
  },
};

export const defaultColors = mealColors.comida;

export function getColors(mealType: string) {
  return mealColors[mealType] ?? defaultColors;
}

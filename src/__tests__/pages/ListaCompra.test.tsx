import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ListaCompraPage from "@/app/lista-compra/page";
import { mockFetch } from "../setup";

// Mock simulates API response: only shoppable ingredients are returned
const mockShoppingList = [
  {
    id: "sl1",
    recipe_id: "r1",
    added_at: "2024-01-01T00:00:00Z",
    servings: 1,
    recipe: { id: "r1", title: "Espaguetis Boloñesa", meal_type: "comida" },
    ingredients: [
      { id: "i1", name: "Espaguetis", quantity: 150, unit: "g" },
      { id: "i2", name: "Tomate", quantity: 200, unit: "g" },
    ],
  },
  {
    id: "sl2",
    recipe_id: "r2",
    added_at: "2024-01-02T00:00:00Z",
    servings: 1,
    recipe: { id: "r2", title: "Ensalada de tomate", meal_type: "cena" },
    ingredients: [
      { id: "i3", name: "Tomate", quantity: 300, unit: "g" },
      { id: "i4", name: "Lechuga", quantity: 1, unit: "unidad" },
    ],
  },
];

describe("Lista de Compra Page", () => {
  beforeEach(() => {
    mockFetch({
      "/api/lista-compra": mockShoppingList,
      "/api/despensa": [],
    });
  });

  it("renders page title", () => {
    render(<ListaCompraPage />);
    expect(screen.getByText("Lista de la compra")).toBeInTheDocument();
  });

  it("renders recipe pills after loading", async () => {
    render(<ListaCompraPage />);
    await waitFor(() => {
      expect(screen.getByText("Espaguetis Boloñesa")).toBeInTheDocument();
      expect(screen.getByText("Ensalada de tomate")).toBeInTheDocument();
    });
  });

  it("merges duplicate ingredients (tomate: 200g + 300g = 500g)", async () => {
    render(<ListaCompraPage />);
    await waitFor(() => {
      expect(screen.getByText("500 g")).toBeInTheDocument();
    });
  });

  it("renders unique ingredients", async () => {
    render(<ListaCompraPage />);
    await waitFor(() => {
      expect(screen.getByText("Espaguetis")).toBeInTheDocument();
      expect(screen.getByText("Lechuga")).toBeInTheDocument();
    });
  });

  it("only shows shoppable ingredients from API", async () => {
    render(<ListaCompraPage />);
    await waitFor(() => {
      expect(screen.getByText("Espaguetis")).toBeInTheDocument();
      expect(screen.getByText(/de 3 ingredientes/)).toBeInTheDocument();
    });
  });

  it("shows ingredient count below search", async () => {
    render(<ListaCompraPage />);
    await waitFor(() => {
      expect(screen.getByText(/de 3 ingredientes/)).toBeInTheDocument();
    });
  });

  it("toggles checkbox on click", async () => {
    render(<ListaCompraPage />);
    await waitFor(() => {
      expect(screen.getByText("Espaguetis")).toBeInTheDocument();
    });

    const espaguetisRow = screen.getByText("Espaguetis").closest('span[class*="flex-1"]')!;
    fireEvent.click(espaguetisRow);

    await waitFor(() => {
      const nameSpan = screen.getByText("Espaguetis");
      expect(nameSpan.className).toContain("line-through");
    });
  });

  it('shows "Quitar" button when items are checked', async () => {
    render(<ListaCompraPage />);
    await waitFor(() => {
      expect(screen.getByText("Espaguetis")).toBeInTheDocument();
    });

    expect(screen.queryByText(/Quitar/)).not.toBeInTheDocument();

    const espaguetisRow = screen.getByText("Espaguetis").closest('span[class*="flex-1"]')!;
    fireEvent.click(espaguetisRow);

    await waitFor(() => {
      expect(screen.getByText(/Quitar/)).toBeInTheDocument();
    });
  });

  it("removes checked ingredients via Quitar button", async () => {
    render(<ListaCompraPage />);
    await waitFor(() => {
      expect(screen.getByText("Espaguetis")).toBeInTheDocument();
    });

    // Check an ingredient then use Quitar button
    const espaguetisRow = screen.getByText("Espaguetis").closest('span[class*="flex-1"]')!;
    fireEvent.click(espaguetisRow);

    await waitFor(() => {
      expect(screen.getByText(/Quitar/)).toBeInTheDocument();
    });
  });

  it("shows progress bar", async () => {
    render(<ListaCompraPage />);
    await waitFor(() => {
      expect(screen.getByText("Progreso")).toBeInTheDocument();
    });
  });

  it("shows counter text", async () => {
    render(<ListaCompraPage />);
    await waitFor(() => {
      expect(screen.getByText(/0 de 3 ingredientes/)).toBeInTheDocument();
    });
  });

  it('renders "Vaciar lista" button', async () => {
    render(<ListaCompraPage />);
    await waitFor(() => {
      expect(screen.getByText("Vaciar lista")).toBeInTheDocument();
    });
  });

  it("shows empty state when list is empty", async () => {
    mockFetch({ "/api/lista-compra": [], "/api/despensa": [] });
    render(<ListaCompraPage />);
    await waitFor(() => {
      expect(screen.getByText("La lista esta vacia")).toBeInTheDocument();
    });
  });

  it("shows search input in empty state", async () => {
    mockFetch({ "/api/lista-compra": [], "/api/despensa": [] });
    render(<ListaCompraPage />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Añadir receta o ingrediente/)).toBeInTheDocument();
    });
  });

  it("removes recipe from list on X click", async () => {
    const fetchMock = mockFetch({
      "/api/lista-compra": mockShoppingList,
      "/api/despensa": [],
    });
    render(<ListaCompraPage />);

    await waitFor(() => {
      expect(screen.getByText("Espaguetis Boloñesa")).toBeInTheDocument();
    });

    const removeButtons = screen.getAllByTitle("Quitar de la lista");
    fireEvent.click(removeButtons[0]);

    await waitFor(() => {
      const calls = fetchMock.mock.calls.map((c: string[]) => c[0]);
      expect(
        calls.some((url: string) => url.includes("/api/lista-compra?id=")),
      ).toBe(true);
    });
  });

  it("shows servings badge on recipe pills", async () => {
    render(<ListaCompraPage />);
    await waitFor(() => {
      // Both recipes have servings: 1
      const badges = screen.getAllByText("×1");
      expect(badges.length).toBe(2);
    });
  });
});

describe("Lista de Compra - Pantry subtraction", () => {
  it("subtracts pantry quantities from needed ingredients", async () => {
    mockFetch({
      "/api/lista-compra": [
        {
          id: "sl1",
          recipe_id: "r1",
          added_at: "2024-01-01T00:00:00Z",
          servings: 1,
          recipe: { id: "r1", title: "Receta", meal_type: "comida" },
          ingredients: [
            { id: "i1", name: "Zanahoria", quantity: 3, unit: "unidad" },
          ],
        },
      ],
      "/api/despensa": [
        { id: "p1", name: "Zanahoria", quantity: 1, unit: "unidad", location: "nevera" },
      ],
    });

    render(<ListaCompraPage />);

    await waitFor(() => {
      // 3 needed - 1 in pantry = 2 (shown in quantity selector for "unidad" items)
      expect(screen.getByText("2")).toBeInTheDocument();
    });
  });

  it("shows pantry discount label", async () => {
    mockFetch({
      "/api/lista-compra": [
        {
          id: "sl1",
          recipe_id: "r1",
          added_at: "2024-01-01T00:00:00Z",
          servings: 1,
          recipe: { id: "r1", title: "Receta", meal_type: "comida" },
          ingredients: [
            { id: "i1", name: "Cebolla", quantity: 2, unit: "unidad" },
          ],
        },
      ],
      "/api/despensa": [
        { id: "p1", name: "Cebolla", quantity: 1, unit: "unidad", location: "nevera" },
      ],
    });

    render(<ListaCompraPage />);

    await waitFor(() => {
      expect(screen.getByText(/en despensa/)).toBeInTheDocument();
    });
  });

  it("hides ingredient entirely when pantry covers full quantity", async () => {
    mockFetch({
      "/api/lista-compra": [
        {
          id: "sl1",
          recipe_id: "r1",
          added_at: "2024-01-01T00:00:00Z",
          servings: 1,
          recipe: { id: "r1", title: "Receta", meal_type: "comida" },
          ingredients: [
            { id: "i1", name: "Zanahoria", quantity: 2, unit: "unidad" },
            { id: "i2", name: "Cebolla", quantity: 1, unit: "unidad" },
          ],
        },
      ],
      "/api/despensa": [
        { id: "p1", name: "Zanahoria", quantity: 5, unit: "unidad", location: "nevera" },
      ],
    });

    render(<ListaCompraPage />);

    await waitFor(() => {
      // Cebolla should appear, zanahoria should not (pantry has more than needed)
      expect(screen.getByText("Cebolla")).toBeInTheDocument();
      expect(screen.queryByText("Zanahoria")).not.toBeInTheDocument();
    });
  });
});

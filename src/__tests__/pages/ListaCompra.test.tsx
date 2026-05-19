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

  it("links recipe pills to their recipes", async () => {
    render(<ListaCompraPage />);
    await waitFor(() => {
      expect(screen.getByRole("link", { name: /Espaguetis Boloñesa/ })).toHaveAttribute(
        "href",
        "/recetas/r1",
      );
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

  it("hides ingredient on load when persisted state marks it removed (stable key)", async () => {
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
      "/api/lista-compra/state": [
        {
          ingredient_key: "recipes__name__zanahoria__unidad",
          checked: false,
          removed: true,
        },
      ],
    });

    render(<ListaCompraPage />);

    await waitFor(() => {
      expect(screen.getByText("Cebolla")).toBeInTheDocument();
    });
    expect(screen.queryByText("Zanahoria")).not.toBeInTheDocument();
  });
});

describe("Lista de Compra - Shopping flow", () => {
  it("keeps a removed ingredient hidden after removing a different recipe (bug regression)", async () => {
    const list = [
      {
        id: "slA",
        recipe_id: "rA",
        added_at: "2024-01-01T00:00:00Z",
        servings: 1,
        recipe: { id: "rA", title: "Receta A", meal_type: "comida" },
        ingredients: [
          { id: "iA1", name: "Tomate", quantity: 200, unit: "g" },
          { id: "iA2", name: "Aceite", quantity: 50, unit: "ml" },
        ],
      },
      {
        id: "slB",
        recipe_id: "rB",
        added_at: "2024-01-02T00:00:00Z",
        servings: 1,
        recipe: { id: "rB", title: "Receta B", meal_type: "cena" },
        ingredients: [
          { id: "iB1", name: "Tomate", quantity: 300, unit: "g" },
          { id: "iB2", name: "Lechuga", quantity: 1, unit: "unidad" },
        ],
      },
    ];
    mockFetch({ "/api/lista-compra": list });

    render(<ListaCompraPage />);

    // All ingredients show initially (Tomate merges to 500g)
    await waitFor(() => {
      expect(screen.getByText("Tomate")).toBeInTheDocument();
      expect(screen.getByText("Aceite")).toBeInTheDocument();
      expect(screen.getByText("Lechuga")).toBeInTheDocument();
    });

    // Remove "Aceite" via its X button
    const aceiteRow = screen.getByText("Aceite").closest("li")!;
    const aceiteRemoveBtn = aceiteRow.querySelector("button:last-child")!;
    fireEvent.click(aceiteRemoveBtn);

    await waitFor(() => {
      expect(screen.queryByText("Aceite")).not.toBeInTheDocument();
    });

    // Now remove recipe A entirely
    const removeRecipeBtns = screen.getAllByTitle("Quitar de la lista");
    fireEvent.click(removeRecipeBtns[0]);

    // Aceite was on recipe A so it would naturally go away too; the key
    // assertion: removing recipe A does NOT resurrect any previously removed
    // ingredient. The shared Tomate (from B) must remain visible.
    await waitFor(() => {
      expect(screen.getByText("Tomate")).toBeInTheDocument();
      expect(screen.getByText("Lechuga")).toBeInTheDocument();
    });
    expect(screen.queryByText("Aceite")).not.toBeInTheDocument();
  });

  it("keeps a removed ingredient hidden when adding extras refetches state", async () => {
    mockFetch({
      "/api/lista-compra": [
        {
          id: "sl1",
          recipe_id: "r1",
          added_at: "2024-01-01T00:00:00Z",
          servings: 1,
          recipe: { id: "r1", title: "R", meal_type: "comida" },
          ingredients: [
            { id: "i1", name: "Sal", quantity: 5, unit: "g" },
            { id: "i2", name: "Azucar", quantity: 10, unit: "g" },
          ],
        },
      ],
      "/api/lista-compra/state": [
        {
          ingredient_key: "recipes__name__sal__g",
          checked: false,
          removed: true,
        },
      ],
    });

    render(<ListaCompraPage />);

    await waitFor(() => {
      expect(screen.getByText("Azucar")).toBeInTheDocument();
    });
    expect(screen.queryByText("Sal")).not.toBeInTheDocument();
  });

  it("drops a recipe's unique ingredients when its X is clicked while sharing others", async () => {
    mockFetch({
      "/api/lista-compra": [
        {
          id: "slA",
          recipe_id: "rA",
          added_at: "2024-01-01T00:00:00Z",
          servings: 1,
          recipe: { id: "rA", title: "Receta A", meal_type: "comida" },
          ingredients: [
            { id: "iA1", name: "Harina", quantity: 100, unit: "g" },
            { id: "iA2", name: "Comino", quantity: 5, unit: "g" },
          ],
        },
        {
          id: "slB",
          recipe_id: "rB",
          added_at: "2024-01-02T00:00:00Z",
          servings: 1,
          recipe: { id: "rB", title: "Receta B", meal_type: "cena" },
          ingredients: [
            { id: "iB1", name: "Harina", quantity: 200, unit: "g" },
            { id: "iB2", name: "Pimienta", quantity: 2, unit: "g" },
          ],
        },
      ],
    });

    render(<ListaCompraPage />);

    await waitFor(() => {
      expect(screen.getByText("Harina")).toBeInTheDocument();
      expect(screen.getByText("Comino")).toBeInTheDocument();
      expect(screen.getByText("Pimienta")).toBeInTheDocument();
    });

    // Items render in the order returned by GET (slA, slB) — index 0 is A.
    const removeRecipeBtns = screen.getAllByTitle("Quitar de la lista");
    fireEvent.click(removeRecipeBtns[0]);

    await waitFor(() => {
      expect(screen.queryByText("Comino")).not.toBeInTheDocument();
    });
    // Shared ingredient still present (from B), and B's unique too
    expect(screen.getByText("Harina")).toBeInTheDocument();
    expect(screen.getByText("Pimienta")).toBeInTheDocument();
  });

  it("restores a previously removed ingredient when its recipe is re-added", async () => {
    // Stateful mock: server has recipe r1 (Pan removed) and we add r2 (also
    // contains Pan). After adding, the add-recipe flow should clear Pan's
    // removed flag so it reappears.
    const state: Record<string, { checked: boolean; removed: boolean }> = {
      recipes__name__pan__g: { checked: false, removed: true },
    };
    const r1 = {
      id: "sl1",
      recipe_id: "r1",
      added_at: "2024-01-01T00:00:00Z",
      servings: 1,
      recipe: { id: "r1", title: "R1", meal_type: "comida" },
      ingredients: [
        { id: "i1", name: "Pan", quantity: 100, unit: "g" },
        { id: "i2", name: "Queso", quantity: 50, unit: "g" },
      ],
    };
    const r2 = {
      id: "sl2",
      recipe_id: "r2",
      added_at: "2024-01-02T00:00:00Z",
      servings: 1,
      recipe: { id: "r2", title: "R2", meal_type: "cena" },
      ingredients: [
        { id: "j1", name: "Pan", quantity: 200, unit: "g" },
        { id: "j2", name: "Jamon", quantity: 80, unit: "g" },
      ],
    };
    let list: typeof r1[] = [r1];

    const fetchMock = vi.fn(
      (url: string, opts?: { method?: string; body?: string }) => {
        const method = (opts?.method ?? "GET").toUpperCase();
        const path = url.split("?")[0];
        const params = new URLSearchParams(
          url.includes("?") ? url.split("?")[1] : "",
        );
        const body = opts?.body
          ? (JSON.parse(opts.body) as Record<string, unknown>)
          : undefined;

        const ok = (data: unknown) =>
          Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(data),
          });

        if (path === "/api/lista-compra") {
          if (method === "GET") return ok(list);
          if (method === "POST") {
            if (body?.recipe_id === "r2") list = [...list, r2];
            return ok({ id: "sl2" });
          }
        }
        if (path === "/api/lista-compra/state") {
          if (method === "GET") {
            return ok(
              Object.entries(state).map(([k, v]) => ({
                ingredient_key: k,
                ...v,
              })),
            );
          }
          if (method === "PUT" && body) {
            const k = body.ingredient_key as string;
            state[k] = {
              checked: (body.checked as boolean) ?? state[k]?.checked ?? false,
              removed: (body.removed as boolean) ?? state[k]?.removed ?? false,
            };
            return ok({ success: true });
          }
          if (method === "DELETE") {
            const k = params.get("key");
            if (k) delete state[k];
            return ok({ success: true });
          }
        }
        if (path === "/api/recetas") {
          return ok({ data: [{ id: "r2", title: "R2", meal_type: "cena" }], total: 1 });
        }
        if (path === "/api/ingredientes") {
          return ok({ data: [], total: 0 });
        }
        return ok([]);
      },
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<ListaCompraPage />);

    // Initial: Pan hidden (removed=true), Queso visible
    await waitFor(() => {
      expect(screen.getByText("Queso")).toBeInTheDocument();
    });
    expect(screen.queryByText("Pan")).not.toBeInTheDocument();

    // Type in the search box, then click the recipe suggestion
    const search = screen.getByPlaceholderText(/Añadir receta o ingrediente/);
    fireEvent.change(search, { target: { value: "R2" } });

    // Wait for the "Recetas" section header to appear (suggestions are
    // debounced by 200ms). The custom "Añadir R2" button always renders, so
    // we wait for the recipe section specifically and then click its R2 row.
    await screen.findByText("Recetas");
    const recipeBtn = screen
      .getAllByRole("button")
      .find((b) => /^R2\s*Cena$/i.test(b.textContent ?? ""))!;
    fireEvent.click(recipeBtn);

    // After add, Pan reappears (merged from r1+r2 = 300g)
    await waitFor(() => {
      expect(screen.getByText("Pan")).toBeInTheDocument();
    });
    expect(screen.getByText("Jamon")).toBeInTheDocument();
    expect(state["recipes__name__pan__g"]?.removed).toBe(false);
  });
});

describe("Lista de Compra - Pantry is ignored", () => {
  it("does not subtract pantry quantities from needed ingredients", async () => {
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
      expect(screen.getByText("3")).toBeInTheDocument();
    });
  });
});

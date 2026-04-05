import { supabase } from "@/lib/supabase";
import type { NextRequest } from "next/server";

// GET /api/ingredientes?search=xxx — search catalog entries (paginated)
export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams
    .get("search")
    ?.toLowerCase()
    .trim();
  const limit = Math.min(
    Number(request.nextUrl.searchParams.get("limit")) || 10,
    50,
  );
  const offset = Math.max(
    Number(request.nextUrl.searchParams.get("offset")) || 0,
    0,
  );

  let query = supabase
    .from("catalog")
    .select("id, name, default_unit, shoppable", { count: "exact" })
    .order("name")
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Map to the shape the frontend expects
  const results = (data || []).map((item) => ({
    id: item.id,
    name: item.name,
    unit: item.default_unit,
  }));

  return Response.json({ data: results, total: count ?? 0 });
}

export default async function RecetaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold">Detalle de receta</h1>
      <p className="mt-2 text-muted">Receta {id} - pendiente de implementar</p>
    </div>
  );
}

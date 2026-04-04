import RecipeForm from '@/components/RecipeForm'

export default function NuevaRecetaPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold">Nueva receta</h1>
      <p className="mt-2 text-muted">Rellena los datos para crear una nueva receta.</p>
      <div className="mt-8">
        <RecipeForm />
      </div>
    </div>
  )
}

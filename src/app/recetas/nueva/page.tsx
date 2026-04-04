import RecipeForm from '@/components/RecipeForm'

export default function NuevaRecetaPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-heading text-3xl font-bold">Nueva receta</h1>
      <p className="mt-2 text-muted">Rellena los datos para crear una nueva receta.</p>
      <div className="divider-herbs my-6" />
      <div className="mt-2">
        <RecipeForm />
      </div>
    </div>
  )
}

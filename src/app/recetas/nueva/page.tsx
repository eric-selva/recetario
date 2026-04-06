import RecipeForm from '@/components/RecipeForm'

export default function NuevaRecetaPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="flex items-center gap-2.5 font-heading text-3xl font-bold">
        <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Nueva receta
      </h1>
      <p className="mt-2 text-muted">Rellena los datos para crear una nueva receta.</p>
      <div className="divider-herbs my-6" />
      <div className="mt-2">
        <RecipeForm />
      </div>
    </div>
  )
}

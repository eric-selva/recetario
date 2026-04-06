export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 rounded-lg bg-primary-light/40" />
        <div className="h-5 w-72 rounded-lg bg-primary-light/30" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-primary-light/25" />
          ))}
        </div>
      </div>
    </div>
  )
}

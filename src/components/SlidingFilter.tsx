'use client'

interface FilterOption {
  value: string
  label: string
}

interface SlidingFilterProps {
  options: FilterOption[]
  value: string
  onChange: (value: string) => void
  /** Map option value → { bg, text } Tailwind classes. Falls back to primary. */
  colorMap?: Record<string, { bg: string; text: string }>
}

export default function SlidingFilter({ options, value, onChange, colorMap }: SlidingFilterProps) {
  const count = options.length
  const activeIndex = options.findIndex((o) => o.value === value)
  const widthPercent = 100 / count

  return (
    <div className="relative flex rounded-xl border border-border bg-card p-1">
      {/* Sliding background — positioned by percentage so it never desync */}
      <div
        className={`absolute top-1 bottom-1 rounded-lg ${colorMap?.[value]?.bg ?? 'bg-primary/15'}`}
        style={{
          left: `calc(${activeIndex * widthPercent}% + 4px)`,
          width: `calc(${widthPercent}% - 8px)`,
          transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />

      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`relative z-10 flex-1 rounded-lg px-4 py-2 text-center text-sm font-medium transition-colors duration-200 ${
            value === option.value
              ? (colorMap?.[value]?.text ?? 'text-primary')
              : 'text-muted hover:text-foreground'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

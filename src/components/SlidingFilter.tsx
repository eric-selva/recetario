'use client'

import { useRef, useState, useLayoutEffect, useEffect } from 'react'

interface FilterOption {
  value: string
  label: string
}

interface SlidingFilterProps {
  options: FilterOption[]
  value: string
  onChange: (value: string) => void
}

export default function SlidingFilter({ options, value, onChange }: SlidingFilterProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })
  const [ready, setReady] = useState(false)

  function updateIndicator() {
    const container = containerRef.current
    if (!container) return
    const activeBtn = container.querySelector<HTMLButtonElement>(`[data-value="${value}"]`)
    if (!activeBtn) return
    const containerRect = container.getBoundingClientRect()
    const btnRect = activeBtn.getBoundingClientRect()
    setIndicator({
      left: btnRect.left - containerRect.left,
      width: btnRect.width,
    })
    setReady(true)
  }

  // useLayoutEffect for initial + value changes (avoids flash)
  useLayoutEffect(() => {
    updateIndicator()
  }, [value])

  // Also update on resize
  useEffect(() => {
    const handleResize = () => updateIndicator()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [value])

  return (
    <div
      ref={containerRef}
      className="relative flex rounded-xl border border-border bg-card p-1"
    >
      {/* Sliding background */}
      <div
        className="absolute top-1 bottom-1 rounded-lg bg-primary shadow-sm"
        style={{
          left: indicator.left,
          width: indicator.width,
          transition: ready ? 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.25s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
        }}
      />

      {options.map((option) => (
        <button
          key={option.value}
          data-value={option.value}
          onClick={() => onChange(option.value)}
          className={`relative z-10 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 ${
            value === option.value
              ? 'text-white'
              : 'text-muted hover:text-foreground'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

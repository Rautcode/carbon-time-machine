interface Props {
  message?: string
}

export function LoadingSpinner({ message = 'Generating your future…' }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message}
      className="flex flex-col items-center justify-center min-h-[400px] gap-6"
    >
      {/* Animated Earth */}
      <div className="relative w-24 h-24" aria-hidden="true">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-green-500 animate-pulse-slow" />
        <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-green-600 to-green-400 opacity-80" />
        <div className="absolute inset-0 rounded-full border-4 border-green-300 opacity-30 animate-spin" style={{ animationDuration: '8s' }} />
      </div>

      {/* Progress dots */}
      <div className="flex gap-2" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-full bg-green-500 animate-bounce"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>

      <div className="text-center">
        <p className="text-lg font-semibold text-gray-800">{message}</p>
        <p className="text-sm text-gray-500 mt-1">
          Calculating your 2030, 2035 &amp; 2040 timelines…
        </p>
      </div>
    </div>
  )
}

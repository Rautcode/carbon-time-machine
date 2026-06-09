interface Props {
  message?: string
}

const STEPS = [
  'Calculating your carbon footprint…',
  'Modelling 2030 trajectory…',
  'Projecting 2035 & 2040 futures…',
  'Generating AI narratives…',
]

export function LoadingSpinner({ message = 'Generating your future…' }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message}
      className="flex flex-col items-center justify-center min-h-[420px] gap-8 animate-fade-in"
    >
      {/* Orbital Earth animation */}
      <div className="relative w-28 h-28" aria-hidden="true">
        {/* Outer glow */}
        <div className="absolute inset-0 rounded-full bg-green-400/20 animate-pulse-slow blur-md" />
        {/* Earth body */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-blue-400 via-green-500 to-emerald-600 shadow-lg" />
        {/* Land mass overlay */}
        <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-green-600/70 to-green-400/50" />
        {/* Orbit ring 1 */}
        <div
          className="absolute inset-0 rounded-full border-2 border-dashed border-green-300/60 animate-orbit"
          style={{ animationDuration: '6s' }}
        />
        {/* Orbit ring 2 — slower, tilted */}
        <div
          className="absolute inset-[-6px] rounded-full border border-teal-200/40 animate-orbit"
          style={{ animationDuration: '14s', animationDirection: 'reverse', transform: 'rotateX(60deg)' }}
        />
        {/* Satellite dot */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-2.5 h-2.5 bg-yellow-400 rounded-full shadow-md animate-orbit" style={{ animationDuration: '6s', transformOrigin: '0 56px' }} />
      </div>

      {/* Processing steps */}
      <ol className="space-y-2 text-sm" aria-label="Processing steps">
        {STEPS.map((step, i) => (
          <li
            key={step}
            className="flex items-center gap-3 text-gray-500 animate-fade-in"
            style={{ animationDelay: `${i * 0.6}s`, animationFillMode: 'both' }}
          >
            <span className="w-5 h-5 rounded-full bg-green-100 border-2 border-green-400 flex items-center justify-center flex-shrink-0" aria-hidden="true">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
            </span>
            {step}
          </li>
        ))}
      </ol>

      <p className="text-xs text-gray-400 max-w-xs text-center">
        Powered by Google Gemini · IPCC AR6 emission factors · Typically 3–8 seconds
      </p>
    </div>
  )
}

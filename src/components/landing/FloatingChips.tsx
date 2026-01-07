'use client';

const chips = [
  { label: 'Lotes', position: 'left-top' },
  { label: 'Inventario', position: 'left-bottom' },
  { label: 'Reportes', position: 'right-top' },
  { label: 'Finanzas', position: 'right-bottom' },
];

const chipPositions: Record<string, string> = {
  'left-top': 'left-0 top-1/4 -translate-x-1/2 animate-float',
  'left-bottom': 'left-0 bottom-1/4 -translate-x-1/2 animate-float',
  'right-top': 'right-0 top-1/4 translate-x-1/2 animate-float-right',
  'right-bottom': 'right-0 bottom-1/4 translate-x-1/2 animate-float-right',
};

const animationDelays: Record<string, string> = {
  'left-top': 'animation-delay-0',
  'left-bottom': 'animation-delay-500',
  'right-top': 'animation-delay-1000',
  'right-bottom': 'animation-delay-1500',
};

export default function FloatingChips() {
  return (
    <>
      {/* Floating Chips - Hidden on mobile */}
      <div className="hidden md:block absolute inset-0 pointer-events-none">
        {chips.map((chip, index) => (
          <div
            key={index}
            className={`absolute ${chipPositions[chip.position]} ${animationDelays[chip.position]}`}
          >
            <div className="bg-white px-4 py-2 rounded-full shadow-lg border border-[#73AC01]/10 text-sm font-medium text-[#0A0908]/80">
              {chip.label}
            </div>
          </div>
        ))}
      </div>

      {/* Connector Lines SVG - Hidden on mobile */}
      <svg
        className="hidden md:block absolute inset-0 w-full h-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#73AC01" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#73AC01" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#73AC01" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Left lines */}
        <path
          d="M 0 25% Q 15% 25%, 25% 35%"
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          className="opacity-40"
        />
        <path
          d="M 0 75% Q 15% 75%, 25% 65%"
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          className="opacity-40"
        />

        {/* Right lines */}
        <path
          d="M 100% 25% Q 85% 25%, 75% 35%"
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          className="opacity-40"
        />
        <path
          d="M 100% 75% Q 85% 75%, 75% 65%"
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          className="opacity-40"
        />
      </svg>
    </>
  );
}

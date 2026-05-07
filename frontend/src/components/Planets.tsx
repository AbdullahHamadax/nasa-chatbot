/** Beautiful SVG planet components — no external images needed */

interface PlanetProps {
  size?: number;
  className?: string;
}

export function Mercury({ size = 40, className = "" }: PlanetProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <defs>
        <radialGradient id="mercury-g" cx="35%" cy="35%">
          <stop offset="0%" stopColor="#d4d0c8" />
          <stop offset="50%" stopColor="#a8a29e" />
          <stop offset="100%" stopColor="#6b6560" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#mercury-g)" />
      <circle cx="35" cy="40" r="6" fill="#9a958f" opacity="0.5" />
      <circle cx="60" cy="55" r="8" fill="#8a857f" opacity="0.4" />
      <circle cx="45" cy="65" r="4" fill="#7a756f" opacity="0.4" />
      <circle cx="65" cy="35" r="5" fill="#8a857f" opacity="0.3" />
      <circle cx="50" cy="50" r="48" fill="url(#mercury-g)" opacity="0.3" />
    </svg>
  );
}

export function Venus({ size = 40, className = "" }: PlanetProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <defs>
        <radialGradient id="venus-g" cx="35%" cy="35%">
          <stop offset="0%" stopColor="#fce4b0" />
          <stop offset="40%" stopColor="#e8b86d" />
          <stop offset="100%" stopColor="#c47a2a" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#venus-g)" />
      <ellipse cx="50" cy="35" rx="40" ry="6" fill="#d4a054" opacity="0.3" transform="rotate(-10 50 35)" />
      <ellipse cx="50" cy="55" rx="42" ry="5" fill="#c8944a" opacity="0.25" transform="rotate(5 50 55)" />
      <ellipse cx="50" cy="70" rx="38" ry="4" fill="#b8843a" opacity="0.2" transform="rotate(-3 50 70)" />
    </svg>
  );
}

export function Earth({ size = 40, className = "" }: PlanetProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <defs>
        <radialGradient id="earth-g" cx="35%" cy="35%">
          <stop offset="0%" stopColor="#87ceeb" />
          <stop offset="40%" stopColor="#4a90d9" />
          <stop offset="100%" stopColor="#1a5276" />
        </radialGradient>
        <radialGradient id="earth-shine" cx="30%" cy="30%">
          <stop offset="0%" stopColor="white" stopOpacity="0.25" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#earth-g)" />
      {/* Continents */}
      <ellipse cx="40" cy="35" rx="14" ry="12" fill="#3a8c3e" opacity="0.7" transform="rotate(-15 40 35)" />
      <ellipse cx="62" cy="45" rx="10" ry="16" fill="#2e7d32" opacity="0.6" transform="rotate(10 62 45)" />
      <ellipse cx="35" cy="60" rx="8" ry="6" fill="#388e3c" opacity="0.5" />
      <circle cx="70" cy="30" r="5" fill="#43a047" opacity="0.4" />
      {/* Clouds */}
      <ellipse cx="45" cy="30" rx="18" ry="4" fill="white" opacity="0.2" transform="rotate(-8 45 30)" />
      <ellipse cx="55" cy="60" rx="22" ry="3" fill="white" opacity="0.18" transform="rotate(5 55 60)" />
      {/* Shine */}
      <circle cx="50" cy="50" r="48" fill="url(#earth-shine)" />
    </svg>
  );
}

export function Mars({ size = 40, className = "" }: PlanetProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <defs>
        <radialGradient id="mars-g" cx="35%" cy="35%">
          <stop offset="0%" stopColor="#e87d5a" />
          <stop offset="50%" stopColor="#c0532c" />
          <stop offset="100%" stopColor="#8b3a1e" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#mars-g)" />
      <circle cx="42" cy="45" r="7" fill="#a84828" opacity="0.4" />
      <ellipse cx="55" cy="35" rx="12" ry="3" fill="#d4694a" opacity="0.3" />
      <circle cx="60" cy="60" r="5" fill="#983820" opacity="0.35" />
      {/* Ice cap */}
      <ellipse cx="50" cy="14" rx="20" ry="8" fill="#f0d8c8" opacity="0.5" />
    </svg>
  );
}

export function Jupiter({ size = 40, className = "" }: PlanetProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <defs>
        <radialGradient id="jupiter-g" cx="35%" cy="35%">
          <stop offset="0%" stopColor="#f0d0a0" />
          <stop offset="50%" stopColor="#c8944a" />
          <stop offset="100%" stopColor="#8b6530" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#jupiter-g)" />
      {/* Bands */}
      <ellipse cx="50" cy="28" rx="46" ry="5" fill="#d4a060" opacity="0.5" />
      <ellipse cx="50" cy="40" rx="47" ry="4" fill="#c08848" opacity="0.45" />
      <ellipse cx="50" cy="52" rx="47" ry="6" fill="#b07838" opacity="0.4" />
      <ellipse cx="50" cy="65" rx="46" ry="4" fill="#c49050" opacity="0.4" />
      <ellipse cx="50" cy="76" rx="44" ry="5" fill="#a87040" opacity="0.35" />
      {/* Great Red Spot */}
      <ellipse cx="62" cy="56" rx="8" ry="5" fill="#c45030" opacity="0.6" transform="rotate(-5 62 56)" />
    </svg>
  );
}

export function Saturn({ size = 40, className = "" }: PlanetProps) {
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 140 100" className={className}>
      <defs>
        <radialGradient id="saturn-g" cx="35%" cy="35%">
          <stop offset="0%" stopColor="#f5deb3" />
          <stop offset="50%" stopColor="#d4a656" />
          <stop offset="100%" stopColor="#a07830" />
        </radialGradient>
      </defs>
      {/* Ring behind */}
      <ellipse cx="70" cy="50" rx="68" ry="14" fill="none" stroke="#c8a86888" strokeWidth="8"
        strokeDasharray="2 1" opacity="0.5" />
      {/* Planet body */}
      <circle cx="70" cy="50" r="30" fill="url(#saturn-g)" />
      <ellipse cx="70" cy="38" rx="28" ry="3" fill="#c89848" opacity="0.4" />
      <ellipse cx="70" cy="50" rx="29" ry="3" fill="#b88838" opacity="0.35" />
      <ellipse cx="70" cy="60" rx="28" ry="3" fill="#c8a050" opacity="0.3" />
      {/* Ring in front */}
      <path d="M 70 50 Q 105 38, 138 50" fill="none" stroke="#c8a86888" strokeWidth="7" opacity="0.45" />
    </svg>
  );
}

export function Uranus({ size = 40, className = "" }: PlanetProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <defs>
        <radialGradient id="uranus-g" cx="35%" cy="35%">
          <stop offset="0%" stopColor="#b0e8e8" />
          <stop offset="50%" stopColor="#6cc4c4" />
          <stop offset="100%" stopColor="#3a8888" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#uranus-g)" />
      <ellipse cx="50" cy="50" rx="46" ry="4" fill="#80d0d0" opacity="0.2" />
      <circle cx="50" cy="50" r="48" fill="url(#uranus-g)" opacity="0.15" />
    </svg>
  );
}

export function Neptune({ size = 40, className = "" }: PlanetProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <defs>
        <radialGradient id="neptune-g" cx="35%" cy="35%">
          <stop offset="0%" stopColor="#7eb8e0" />
          <stop offset="50%" stopColor="#3a6ea5" />
          <stop offset="100%" stopColor="#1a3c6e" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#neptune-g)" />
      <ellipse cx="50" cy="40" rx="44" ry="3" fill="#5a9ecf" opacity="0.3" />
      <ellipse cx="50" cy="58" rx="42" ry="3" fill="#4a8ebf" opacity="0.25" />
      {/* Storm spot */}
      <ellipse cx="55" cy="48" rx="6" ry="4" fill="#2a5e8f" opacity="0.5" />
    </svg>
  );
}

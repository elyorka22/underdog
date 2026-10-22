export function DogMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <path
        d="M6 10 C2 14 2 26 8 30 C12 28 12 16 12 12 Z"
        fill="#7A4A2B"
        stroke="#14121F"
        strokeWidth="2.5"
      />
      <path
        d="M34 10 C38 14 38 26 32 30 C28 28 28 16 28 12 Z"
        fill="#7A4A2B"
        stroke="#14121F"
        strokeWidth="2.5"
      />
      <ellipse
        cx="20"
        cy="21"
        rx="12"
        ry="12"
        fill="#F2B66D"
        stroke="#14121F"
        strokeWidth="2.5"
      />
      <rect x="9" y="16" width="9" height="6" rx="2" fill="#14121F" />
      <rect x="22" y="16" width="9" height="6" rx="2" fill="#14121F" />
      <rect x="18" y="17" width="4" height="2" fill="#14121F" />
      <ellipse cx="20" cy="27" rx="3.2" ry="2.2" fill="#14121F" />
    </svg>
  );
}

export function DogHero() {
  return (
    <svg
      viewBox="0 0 400 400"
      width="100%"
      role="img"
      aria-label="Quyoshli ko'zoynak taqqan kulgili it"
    >
      <path
        d="M90 110 C40 120 30 220 70 262 C112 250 122 160 122 120 Z"
        fill="#7A4A2B"
        stroke="#14121F"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <path
        d="M310 110 C360 120 370 220 330 262 C288 250 278 160 278 120 Z"
        fill="#7A4A2B"
        stroke="#14121F"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <ellipse
        cx="200"
        cy="200"
        rx="130"
        ry="120"
        fill="#F2B66D"
        stroke="#14121F"
        strokeWidth="6"
      />
      <ellipse
        cx="200"
        cy="252"
        rx="72"
        ry="52"
        fill="#FFE7C2"
        stroke="#14121F"
        strokeWidth="6"
      />
      <path
        d="M200 238 L200 258 M200 258 Q176 282 158 262 M200 258 Q224 282 242 262"
        fill="none"
        stroke="#14121F"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M184 270 Q200 318 216 270 Z"
        fill="#FF4F8B"
        stroke="#14121F"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <ellipse cx="200" cy="224" rx="26" ry="17" fill="#14121F" />
      <rect x="92" y="150" width="96" height="56" rx="12" fill="#14121F" />
      <rect x="212" y="150" width="96" height="56" rx="12" fill="#14121F" />
      <rect x="184" y="166" width="32" height="12" fill="#14121F" />
      <path
        d="M108 164 L132 164 M108 176 L120 176"
        stroke="#FFFFFF"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M228 164 L252 164 M228 176 L240 176"
        stroke="#FFFFFF"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M108 322 Q200 362 292 322 L292 348 Q200 388 108 348 Z"
        fill="#FFD60A"
        stroke="#14121F"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <circle
        cx="200"
        cy="372"
        r="16"
        fill="#FF4F8B"
        stroke="#14121F"
        strokeWidth="5"
      />
    </svg>
  );
}

export function PawIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 48 48" aria-hidden="true">
      <ellipse cx="24" cy="31" rx="11" ry="9" fill="#14121F" />
      <ellipse cx="9" cy="21" rx="5" ry="6.5" fill="#14121F" />
      <ellipse cx="19" cy="11" rx="5" ry="6.5" fill="#14121F" />
      <ellipse cx="31" cy="11" rx="5" ry="6.5" fill="#14121F" />
      <ellipse cx="40" cy="21" rx="5" ry="6.5" fill="#14121F" />
    </svg>
  );
}

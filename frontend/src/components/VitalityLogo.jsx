import React, { useId } from 'react';

export default function VitalityLogo({ size = 56, subtitle = '', lightText = false }) {
  const uid = useId().replace(/:/g, '');
  const pathId = `vp-${uid}`;
  const tlId = `tl-${uid}`;
  const trId = `tr-${uid}`;
  const blId = `bl-${uid}`;
  const brId = `br-${uid}`;

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        lineHeight: 1.1,
      }}
    >
      <svg
        viewBox="0 0 140 120"
        width={size}
        height={Math.round(size * (120 / 140))}
        aria-label="Logotipo Vitality"
        style={{ display: 'block' }}
      >
        <defs>
          <path
            id={pathId}
            d="M 70 48 C 56 30, 24 36, 24 64 C 24 88, 50 103, 70 113 C 90 103, 116 88, 116 64 C 116 36, 84 30, 70 48 Z"
          />
          <clipPath id={tlId}><rect x="0" y="0" width="70" height="69" /></clipPath>
          <clipPath id={trId}><rect x="70" y="0" width="70" height="69" /></clipPath>
          <clipPath id={blId}><rect x="0" y="69" width="70" height="60" /></clipPath>
          <clipPath id={brId}><rect x="70" y="69" width="70" height="60" /></clipPath>
        </defs>

        <path d="M 67 38 C 66 24, 56 18, 47 15 C 47 26, 54 36, 67 38 Z" fill="#2ea44f" />
        <path
          d="M 66 37 C 61 29, 55 23, 50 19"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.85"
        />

        <path d="M 72 38 C 72 19, 86 12, 102 6 C 102 24, 91 38, 72 38 Z" fill="#8cc63f" />
        <path
          d="M 73 37 C 81 26, 89 19, 97 12"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.85"
        />

        <use href={`#${pathId}`} fill="#ffffff" />

        <use
          href={`#${pathId}`}
          fill="none"
          stroke="#8cc63f"
          strokeWidth="7.5"
          strokeLinejoin="round"
          clipPath={`url(#${tlId})`}
        />
        <use
          href={`#${pathId}`}
          fill="none"
          stroke="#2ea44f"
          strokeWidth="7.5"
          strokeLinejoin="round"
          clipPath={`url(#${trId})`}
        />
        <use
          href={`#${pathId}`}
          fill="none"
          stroke="#f36f21"
          strokeWidth="7.5"
          strokeLinejoin="round"
          clipPath={`url(#${blId})`}
        />
        <use
          href={`#${pathId}`}
          fill="none"
          stroke="#e1251b"
          strokeWidth="7.5"
          strokeLinejoin="round"
          clipPath={`url(#${brId})`}
        />

        <g transform="translate(54, 78) rotate(-29)">
          <rect x="-7.5" y="-26" width="3.2" height="15" rx="1.6" fill="#f38b1e" />
          <rect x="-1.6" y="-26" width="3.2" height="15" rx="1.6" fill="#f38b1e" />
          <rect x="4.3" y="-26" width="3.2" height="15" rx="1.6" fill="#f38b1e" />
          <path
            d="M -7.5 -13 L 7.5 -13 L 7.5 -9 C 7.5 -3, 4 -1, 2.2 0.5 L 3.2 26 C 3.3 29, 1.5 31, 0 31 C -1.5 31, -3.3 29, -3.2 26 L -2.2 0.5 C -4 -1, -7.5 -3, -7.5 -9 Z"
            fill="#f38b1e"
          />
        </g>

        <path
          d="M 86 64 C 81 56, 69 58, 69 68 C 69 78, 80 84, 86 88 C 92 84, 103 78, 103 68 C 103 58, 91 56, 86 64 Z"
          fill="#e1251b"
        />
      </svg>

      <span
        style={{
          fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
          fontWeight: 800,
          fontSize: `${Math.max(15, Math.round(size * 0.3))}px`,
          letterSpacing: '-0.02em',
          color: lightText ? '#ffffff' : 'var(--text)',
          marginTop: 2,
        }}
      >
        Vitality
      </span>
      {subtitle && (
        <span
          style={{
            fontSize: '0.72rem',
            color: lightText ? 'rgba(255,255,255,0.85)' : 'var(--text-muted)',
            marginTop: 2,
            textAlign: 'center',
          }}
        >
          {subtitle}
        </span>
      )}
    </div>
  );
}

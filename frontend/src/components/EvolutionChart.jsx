import React, { useState } from 'react';

export default function EvolutionChart({ registros = [] }) {
  const [metric, setMetric] = useState('peso_kg');

  if (!registros || registros.length === 0) {
    return (
      <div className="empty-state">
        Aún no hay mediciones antropométricas registradas para graficar la evolución.
      </div>
    );
  }

  const metricConfig = {
    peso_kg: { label: 'Peso (kg)', color: '#0f766e', unit: 'kg' },
    porcentaje_grasa: { label: '% Grasa Corporal', color: '#f59e0b', unit: '%' },
    masa_muscular_kg: { label: 'Masa Muscular (kg)', color: '#6366f1', unit: 'kg' },
  };

  const cfg = metricConfig[metric];
  const validPoints = registros.filter((r) => r[metric] !== null && r[metric] !== undefined);

  if (validPoints.length === 0) {
    return (
      <div>
        <div className="tabs">
          {Object.entries(metricConfig).map(([key, item]) => (
            <button
              key={key}
              type="button"
              className={`tab-btn ${metric === key ? 'active' : ''}`}
              onClick={() => setMetric(key)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="empty-state">Sin datos cargados para {cfg.label}.</div>
      </div>
    );
  }

  const width = 580;
  const height = 210;
  const padX = 44;
  const padY = 26;

  const values = validPoints.map((p) => Number(p[metric]));
  const minVal = Math.min(...values) - 1;
  const maxVal = Math.max(...values) + 1;
  const range = Math.max(1, maxVal - minVal);

  const coords = validPoints.map((p, idx) => {
    const x =
      validPoints.length === 1
        ? width / 2
        : padX + (idx / (validPoints.length - 1)) * (width - padX * 2);
    const y = height - padY - ((Number(p[metric]) - minVal) / range) * (height - padY * 2);
    return { x, y, val: Number(p[metric]), date: String(p.fecha_registro).slice(0, 10) };
  });

  const polyline = coords.map((c) => `${c.x},${c.y}`).join(' ');

  return (
    <div>
      <div className="tabs" style={{ marginBottom: 12 }}>
        {Object.entries(metricConfig).map(([key, item]) => (
          <button
            key={key}
            type="button"
            className={`tab-btn ${metric === key ? 'active' : ''}`}
            onClick={() => setMetric(key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', maxHeight: 230 }}>
          {[0, 0.5, 1].map((t) => {
            const y = padY + t * (height - padY * 2);
            const labelVal = (maxVal - t * range).toFixed(1);
            return (
              <g key={t}>
                <line x1={padX} x2={width - padX} y1={y} y2={y} stroke="#e2e8e5" strokeDasharray="4 4" />
                <text x={8} y={y + 4} fontSize="11" fill="#556962">
                  {labelVal}
                </text>
              </g>
            );
          })}

          {coords.length > 1 && (
            <polyline
              fill="none"
              stroke={cfg.color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={polyline}
            />
          )}

          {coords.map((c, idx) => (
            <g key={idx}>
              <circle cx={c.x} cy={c.y} r="5.5" fill="white" stroke={cfg.color} strokeWidth="3" />
              <text x={c.x} y={c.y - 11} textAnchor="middle" fontSize="11" fontWeight="700" fill="#13221d">
                {c.val} {cfg.unit}
              </text>
              <text x={c.x} y={height - 6} textAnchor="middle" fontSize="10" fill="#556962">
                {c.date}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

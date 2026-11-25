import React from 'react';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { calculateEvolutionDeltas } from '../utils/clinicalHelpers';

function DeltaChip({ label, value, unit, preferUp = false }) {
  if (value === null || value === undefined) return null;
  const isZero = value === 0;
  const isPositive = value > 0;
  const isGood = isZero ? null : preferUp ? isPositive : !isPositive;

  const color = isZero ? '#556962' : isGood ? '#166534' : '#92400e';
  const bg = isZero ? '#f1f5f9' : isGood ? '#dcfce7' : '#fef3c7';
  const Icon = isZero ? Minus : isPositive ? TrendingUp : TrendingDown;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        padding: '9px 12px',
        borderRadius: 10,
        background: bg,
        color,
      }}
    >
      <span style={{ fontSize: '0.73rem', fontWeight: 600, opacity: 0.85 }}>{label}</span>
      <strong style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.98rem' }}>
        <Icon size={15} />
        {isPositive ? `+${value}` : value} {unit}
      </strong>
    </div>
  );
}

export default function ProgressDeltas({ registros = [] }) {
  const deltas = calculateEvolutionDeltas(registros);
  if (!deltas) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: '0.78rem', color: '#556962', marginBottom: 8 }}>
        Variación acumulada ({deltas.desde} → {deltas.hasta}):
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(125px, 1fr))',
          gap: 10,
        }}
      >
        <DeltaChip label="Peso" value={deltas.peso} unit="kg" />
        <DeltaChip label="IMC" value={deltas.imc} unit="pts" />
        <DeltaChip label="% Grasa" value={deltas.grasa} unit="%" />
        <DeltaChip label="Masa Muscular" value={deltas.musculo} unit="kg" preferUp />
      </div>
    </div>
  );
}

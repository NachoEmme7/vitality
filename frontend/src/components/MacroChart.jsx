import React from 'react';

export default function MacroChart({ proteinas = 0, carbohidratos = 0, grasas = 0, objetivoCalorico = 0 }) {
  const kcalP = Math.round(proteinas * 4);
  const kcalC = Math.round(carbohidratos * 4);
  const kcalG = Math.round(grasas * 9);
  const totalKcal = kcalP + kcalC + kcalG;

  const pctP = totalKcal > 0 ? Math.round((kcalP / totalKcal) * 100) : 0;
  const pctC = totalKcal > 0 ? Math.round((kcalC / totalKcal) * 100) : 0;
  const pctG = totalKcal > 0 ? Math.max(0, 100 - pctP - pctC) : 0;

  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const dashP = (pctP / 100) * circumference;
  const dashC = (pctC / 100) * circumference;
  const dashG = (pctG / 100) * circumference;

  const progreso = objetivoCalorico > 0 ? Math.min(100, Math.round((totalKcal / objetivoCalorico) * 100)) : 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: 144, height: 144, flexShrink: 0 }}>
        <svg width="144" height="144" viewBox="0 0 144 144">
          <circle cx="72" cy="72" r={radius} fill="none" stroke="#e2e8e5" strokeWidth="16" />
          {totalKcal > 0 && (
            <>
              <circle
                cx="72"
                cy="72"
                r={radius}
                fill="none"
                stroke="#0f766e"
                strokeWidth="16"
                strokeDasharray={`${dashP} ${circumference}`}
                transform="rotate(-90 72 72)"
              />
              <circle
                cx="72"
                cy="72"
                r={radius}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="16"
                strokeDasharray={`${dashC} ${circumference}`}
                strokeDashoffset={-dashP}
                transform="rotate(-90 72 72)"
              />
              <circle
                cx="72"
                cy="72"
                r={radius}
                fill="none"
                stroke="#6366f1"
                strokeWidth="16"
                strokeDasharray={`${dashG} ${circumference}`}
                strokeDashoffset={-(dashP + dashC)}
                transform="rotate(-90 72 72)"
              />
            </>
          )}
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <strong style={{ fontSize: '1.25rem', lineHeight: 1 }}>{totalKcal}</strong>
          <span style={{ fontSize: '0.73rem', color: '#556962', marginTop: 3 }}>kcal</span>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 210, display: 'grid', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 99, background: '#0f766e' }} />
            Proteínas
          </span>
          <strong>
            {Math.round(proteinas)}g ({pctP}%)
          </strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 99, background: '#f59e0b' }} />
            Carbohidratos
          </span>
          <strong>
            {Math.round(carbohidratos)}g ({pctC}%)
          </strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 99, background: '#6366f1' }} />
            Grasas
          </span>
          <strong>
            {Math.round(grasas)}g ({pctG}%)
          </strong>
        </div>

        {objetivoCalorico > 0 && (
          <div style={{ marginTop: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#556962', marginBottom: 4 }}>
              <span>Cobertura del objetivo diario</span>
              <span>
                {totalKcal} / {objetivoCalorico} kcal ({progreso}%)
              </span>
            </div>
            <div style={{ height: 8, background: '#e2e8e5', borderRadius: 99, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${progreso}%`,
                  height: '100%',
                  background: totalKcal > objetivoCalorico * 1.1 ? '#d97706' : '#0f766e',
                  transition: 'width 0.25s ease',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

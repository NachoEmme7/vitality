const DIAS_FILA_1 = [
  { key: 'Lunes', label: 'LUNES' },
  { key: 'Martes', label: 'MARTES' },
  { key: 'Miercoles', label: 'MIÉRCOLES' },
];

const DIAS_FILA_2 = [
  { key: 'Jueves', label: 'JUEVES' },
  { key: 'Viernes', label: 'VIERNES' },
  { key: 'Sabado', label: 'SÁBADO' },
];

const DIA_DOMINGO = { key: 'Domingo', label: 'DOMINGO' };

const MOMENTO_SHORT = {
  Desayuno: 'Desayuno',
  'Media Manana': 'Media mañana',
  Almuerzo: 'Almuerzo',
  Merienda: 'Merienda',
  Cena: 'Cena',
  Colacion: 'Colación',
};

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function buildPieSlicePath(cx, cy, r, startAngle, endAngle) {
  const sweep = endAngle - startAngle;
  if (sweep >= 359.99) {
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`;
  }
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = sweep > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 0 ${end.x.toFixed(2)} ${end.y.toFixed(2)} Z`;
}

function buildMacroPieSvg(pctGrasas, pctCarbs, pctProt) {
  const cx = 92;
  const cy = 92;
  const r = 78;

  // Orden visual tipo plantilla: Carbs (amarillo), Proteínas (coral), Grasas (verde salvia)
  const slices = [
    { pct: pctCarbs, color: '#f7dc6f', label: `${pctCarbs}% CARBOHIDRATOS` },
    { pct: pctProt, color: '#d96660', label: `${pctProt}% PROTEÍNAS` },
    { pct: pctGrasas, color: '#8ec3a7', label: `${pctGrasas}% GRASAS` },
  ];

  let currentAngle = 15;
  const paths = slices
    .filter((s) => s.pct > 0)
    .map((s) => {
      const start = currentAngle;
      const end = currentAngle + (s.pct / 100) * 360;
      currentAngle = end;
      return `<path d="${buildPieSlicePath(cx, cy, r, start, end)}" fill="${s.color}" stroke="#ffffff" stroke-width="1.5" />`;
    })
    .join('');

  const fallbackCircle =
    pctGrasas + pctCarbs + pctProt === 0
      ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#e2e8e5" />`
      : '';

  return `
    <div class="pie-wrapper">
      <svg width="184" height="184" viewBox="0 0 184 184" aria-label="Distribución de macronutrientes">
        ${fallbackCircle}
        ${paths}
      </svg>
      <div class="pie-legend">
        <div class="legend-row">
          <span class="dashed-line"></span>
          <span class="dot" style="background:#8ec3a7;"></span>
          <span><strong>${pctGrasas}%</strong> GRASAS</span>
        </div>
        <div class="legend-row">
          <span class="dashed-line"></span>
          <span class="dot" style="background:#f7dc6f;"></span>
          <span><strong>${pctCarbs}%</strong> CARBOHIDRATOS</span>
        </div>
        <div class="legend-row">
          <span class="dashed-line"></span>
          <span class="dot" style="background:#d96660;"></span>
          <span><strong>${pctProt}%</strong> PROTEÍNAS</span>
        </div>
      </div>
    </div>
  `;
}

function renderDayCard(dia, comidas) {
  const items = comidas.filter((c) => c.dia_semana === dia.key);
  const dayKcal = Math.round(items.reduce((s, c) => s + Number(c.calorias || 0), 0));

  const bodyHtml =
    items.length === 0
      ? `
        <div class="empty-lines">
          <div class="ruled-line muted-note">Día libre / a coordinar</div>
          <div class="ruled-line"></div>
          <div class="ruled-line"></div>
          <div class="ruled-line"></div>
          <div class="ruled-line"></div>
        </div>
      `
      : `
        <div class="meals-list">
          ${items
            .map(
              (c) => `
              <div class="meal-row">
                <span class="meal-moment">${escapeHtml(MOMENTO_SHORT[c.momento_dia] || c.momento_dia)}:</span>
                <span class="meal-desc">${escapeHtml(c.descripcion_alimentos)}</span>
              </div>
            `
            )
            .join('')}
        </div>
      `;

  return `
    <div class="day-card">
      <div class="day-card-title">
        <span>${dia.label}</span>
        ${dayKcal > 0 ? `<small>${dayKcal} kcal</small>` : ''}
      </div>
      <div class="day-card-body">
        ${bodyHtml}
      </div>
    </div>
  `;
}

export function exportPlanToPdf({ plan, pacienteNombre, profesionalNombre, profesionalMatricula, restricciones }) {
  const comidas = plan.detalles_comidas || [];

  const totalKcalP = comidas.reduce((s, c) => s + Number(c.gramos_proteina || 0) * 4, 0);
  const totalKcalC = comidas.reduce((s, c) => s + Number(c.gramos_carbohidratos || 0) * 4, 0);
  const totalKcalG = comidas.reduce((s, c) => s + Number(c.gramos_grasa || 0) * 9, 0);
  const totalMacroKcal = totalKcalP + totalKcalC + totalKcalG;

  const pctProt = totalMacroKcal > 0 ? Math.round((totalKcalP / totalMacroKcal) * 100) : 25;
  const pctCarbs = totalMacroKcal > 0 ? Math.round((totalKcalC / totalMacroKcal) * 100) : 50;
  const pctGrasas = totalMacroKcal > 0 ? Math.max(0, 100 - pctProt - pctCarbs) : 25;

  const fechaEmision = String(plan.fecha_creacion || new Date().toISOString()).slice(0, 10);

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Plan Semanal — ${escapeHtml(pacienteNombre)} | Vitality</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
    rel="stylesheet"
  />
  <style>
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      margin: 0;
      background: #e9eeec;
      font-family: 'Plus Jakarta Sans', 'Segoe UI', Arial, sans-serif;
      color: #1f2937;
    }

    .toolbar {
      position: sticky;
      top: 0;
      z-index: 20;
      background: #13221d;
      color: white;
      padding: 10px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
    }

    .toolbar-actions {
      display: flex;
      gap: 10px;
    }

    .toolbar button {
      border: none;
      border-radius: 8px;
      padding: 8px 14px;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      font-size: 13px;
    }

    .btn-print {
      background: #10b981;
      color: #ffffff;
    }

    .btn-close {
      background: rgba(255, 255, 255, 0.14);
      color: #ffffff;
    }

    .sheet {
      width: 210mm;
      min-height: 297mm;
      margin: 18px auto;
      background: #f9faf9;
      box-shadow: 0 12px 36px rgba(15, 35, 28, 0.16);
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* Encabezado visual estilo lámina nutricional */
    .hero-banner {
      position: relative;
      background: linear-gradient(135deg, #2d6a4f 0%, #52b788 52%, #95d5b2 100%);
      padding: 22px 26px 46px;
      color: white;
      overflow: hidden;
    }

    .hero-decor {
      position: absolute;
      inset: 0;
      opacity: 0.22;
      pointer-events: none;
    }

    .hero-top {
      position: relative;
      z-index: 2;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }

    .logo-box {
      background: rgba(255, 255, 255, 0.96);
      color: #13221d;
      border-radius: 14px;
      padding: 8px 14px 9px;
      text-align: center;
      min-width: 108px;
      box-shadow: 0 5px 14px rgba(0, 0, 0, 0.12);
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .logo-box .logo-name {
      display: block;
      font-size: 16px;
      font-weight: 800;
      letter-spacing: -0.02em;
      line-height: 1.05;
      color: #13221d;
      margin-top: 2px;
    }

    .logo-box .logo-sub {
      display: block;
      font-size: 8.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #556962;
      margin-top: 2px;
    }

    .hero-title-wrap {
      text-align: right;
    }

    .hero-script {
      font-family: 'Caveat', cursive;
      font-size: 32px;
      line-height: 0.95;
      color: #ffffff;
      text-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
    }

    .hero-main-title {
      font-size: 34px;
      font-weight: 800;
      letter-spacing: 0.01em;
      line-height: 1.02;
      text-transform: uppercase;
      margin: 2px 0 8px;
      text-shadow: 0 3px 10px rgba(0, 0, 0, 0.18);
    }

    .hero-pills {
      display: inline-flex;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .hero-pill {
      background: rgba(255, 255, 255, 0.92);
      color: #13221d;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 999px;
    }

    /* Grilla semanal 3 columnas */
    .content-area {
      position: relative;
      z-index: 3;
      margin-top: -28px;
      padding: 0 22px 18px;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 13px;
    }

    .week-row {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 13px;
    }

    .bottom-row {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 13px;
      align-items: stretch;
    }

    .day-card {
      background: #f49b94;
      border-radius: 13px;
      padding: 11px 12px 12px;
      box-shadow: 0 4px 12px rgba(15, 35, 28, 0.08);
      display: flex;
      flex-direction: column;
      min-height: 220px;
    }

    .day-card-title {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      color: #ffffff;
      font-weight: 800;
      font-size: 13.5px;
      letter-spacing: 0.04em;
      padding-bottom: 6px;
      border-bottom: 1.5px solid rgba(255, 255, 255, 0.55);
      margin-bottom: 7px;
    }

    .day-card-title small {
      font-size: 10px;
      font-weight: 700;
      background: rgba(255, 255, 255, 0.25);
      padding: 2px 7px;
      border-radius: 999px;
      letter-spacing: 0;
    }

    .day-card-body {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .meals-list {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .meal-row {
      font-size: 10.2px;
      line-height: 1.35;
      color: #241817;
      padding-bottom: 5px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.5);
    }

    .meal-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .meal-moment {
      font-weight: 800;
      color: #ffffff;
      background: rgba(127, 29, 29, 0.26);
      padding: 1px 5px;
      border-radius: 4px;
      margin-right: 4px;
      font-size: 9.5px;
      display: inline-block;
    }

    .meal-desc {
      color: #1f1414;
      font-weight: 500;
    }

    .empty-lines {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 6px;
    }

    .ruled-line {
      border-bottom: 1px solid rgba(255, 255, 255, 0.55);
      height: 14px;
      font-size: 10px;
    }

    .muted-note {
      color: rgba(255, 255, 255, 0.9);
      font-style: italic;
    }

    /* Bloque derecho inferior: Gráfico de torta + Indicaciones */
    .summary-panel {
      background: #ffffff;
      border: 1px solid #e2e8e5;
      border-radius: 13px;
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 10px;
      box-shadow: 0 4px 12px rgba(15, 35, 28, 0.05);
    }

    .pie-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }

    .pie-legend {
      display: flex;
      flex-direction: column;
      gap: 14px;
      font-size: 12px;
      font-weight: 700;
      color: #1f2937;
    }

    .legend-row {
      display: flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
    }

    .dashed-line {
      width: 34px;
      border-top: 1.8px dashed #6b7280;
    }

    .dot {
      width: 13px;
      height: 13px;
      border-radius: 999px;
      flex-shrink: 0;
    }

    .notes-strip {
      display: grid;
      gap: 6px;
      font-size: 10.4px;
      line-height: 1.4;
      border-top: 1px solid #e5e7eb;
      padding-top: 9px;
    }

    .note-item {
      background: #f0f7f4;
      border-left: 3px solid #0f766e;
      padding: 6px 9px;
      border-radius: 5px;
      color: #13221d;
    }

    .note-warn {
      background: #fffbeb;
      border-left: 3px solid #d97706;
      padding: 6px 9px;
      border-radius: 5px;
      color: #78350f;
    }

    .sheet-footer {
      text-align: center;
      padding: 10px 22px 16px;
      font-size: 10.5px;
      color: #4b5563;
      border-top: 1px solid #e5e7eb;
      background: #ffffff;
    }

    .sheet-footer strong {
      color: #0f766e;
    }

    @page {
      size: A4 portrait;
      margin: 0;
    }

    @media print {
      body {
        background: #ffffff;
      }
      .toolbar {
        display: none !important;
      }
      .sheet {
        margin: 0;
        box-shadow: none;
        width: 210mm;
        min-height: 297mm;
      }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <span>Vista previa del Plan Semanal — <strong>${escapeHtml(pacienteNombre)}</strong></span>
    <div class="toolbar-actions">
      <button class="btn-print" onclick="window.print()">Guardar como PDF / Imprimir</button>
      <button class="btn-close" onclick="window.close()">Cerrar</button>
    </div>
  </div>

  <div class="sheet">
    <header class="hero-banner">
      <svg class="hero-decor" viewBox="0 0 800 220" preserveAspectRatio="none">
        <circle cx="290" cy="40" r="110" fill="#ffffff" />
        <circle cx="290" cy="40" r="65" fill="#d8f3dc" />
        <circle cx="155" cy="145" r="95" fill="#ffffff" />
        <circle cx="620" cy="130" r="120" fill="#ffffff" />
        <circle cx="480" cy="25" r="55" fill="#fef3c7" />
      </svg>

      <div class="hero-top">
        <div class="logo-box">
          <svg viewBox="0 0 140 120" width="60" height="52" aria-label="Logotipo Vitality">
            <defs>
              <path id="pdf-heart-apple" d="M 70 48 C 56 30, 24 36, 24 64 C 24 88, 50 103, 70 113 C 90 103, 116 88, 116 64 C 116 36, 84 30, 70 48 Z" />
              <clipPath id="pdf-tl"><rect x="0" y="0" width="70" height="69" /></clipPath>
              <clipPath id="pdf-tr"><rect x="70" y="0" width="70" height="69" /></clipPath>
              <clipPath id="pdf-bl"><rect x="0" y="69" width="70" height="60" /></clipPath>
              <clipPath id="pdf-br"><rect x="70" y="69" width="70" height="60" /></clipPath>
            </defs>
            <path d="M 67 38 C 66 24, 56 18, 47 15 C 47 26, 54 36, 67 38 Z" fill="#2ea44f" />
            <path d="M 66 37 C 61 29, 55 23, 50 19" fill="none" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" opacity="0.85" />
            <path d="M 72 38 C 72 19, 86 12, 102 6 C 102 24, 91 38, 72 38 Z" fill="#8cc63f" />
            <path d="M 73 37 C 81 26, 89 19, 97 12" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" opacity="0.85" />
            <use href="#pdf-heart-apple" fill="#ffffff" />
            <use href="#pdf-heart-apple" fill="none" stroke="#8cc63f" stroke-width="7.5" stroke-linejoin="round" clip-path="url(#pdf-tl)" />
            <use href="#pdf-heart-apple" fill="none" stroke="#2ea44f" stroke-width="7.5" stroke-linejoin="round" clip-path="url(#pdf-tr)" />
            <use href="#pdf-heart-apple" fill="none" stroke="#f36f21" stroke-width="7.5" stroke-linejoin="round" clip-path="url(#pdf-bl)" />
            <use href="#pdf-heart-apple" fill="none" stroke="#e1251b" stroke-width="7.5" stroke-linejoin="round" clip-path="url(#pdf-br)" />
            <g transform="translate(54, 78) rotate(-29)">
              <rect x="-7.5" y="-26" width="3.2" height="15" rx="1.6" fill="#f38b1e" />
              <rect x="-1.6" y="-26" width="3.2" height="15" rx="1.6" fill="#f38b1e" />
              <rect x="4.3" y="-26" width="3.2" height="15" rx="1.6" fill="#f38b1e" />
              <path d="M -7.5 -13 L 7.5 -13 L 7.5 -9 C 7.5 -3, 4 -1, 2.2 0.5 L 3.2 26 C 3.3 29, 1.5 31, 0 31 C -1.5 31, -3.3 29, -3.2 26 L -2.2 0.5 C -4 -1, -7.5 -3, -7.5 -9 Z" fill="#f38b1e" />
            </g>
            <path d="M 86 64 C 81 56, 69 58, 69 68 C 69 78, 80 84, 86 88 C 92 84, 103 78, 103 68 C 103 58, 91 56, 86 64 Z" fill="#e1251b" />
          </svg>
          <span class="logo-name">Vitality</span>
          <span class="logo-sub">Nutrición Clínica</span>
        </div>

        <div class="hero-title-wrap">
          <div class="hero-script">Plan Alimenticio</div>
          <div class="hero-main-title">SEMANAL</div>
          <div class="hero-pills">
            <span class="hero-pill">Paciente: ${escapeHtml(pacienteNombre)}</span>
            <span class="hero-pill">Objetivo: ${plan.objetivo_calorico} kcal/día</span>
          </div>
        </div>
      </div>
    </header>

    <main class="content-area">
      <div class="week-row">
        ${DIAS_FILA_1.map((d) => renderDayCard(d, comidas)).join('')}
      </div>

      <div class="week-row">
        ${DIAS_FILA_2.map((d) => renderDayCard(d, comidas)).join('')}
      </div>

      <div class="bottom-row">
        ${renderDayCard(DIA_DOMINGO, comidas)}

        <div class="summary-panel">
          ${buildMacroPieSvg(pctGrasas, pctCarbs, pctProt)}

          <div class="notes-strip">
            ${
              restricciones
                ? `<div class="note-warn"><strong>Restricciones:</strong> ${escapeHtml(restricciones)}</div>`
                : ''
            }
            <div class="note-item">
              <strong>Indicaciones:</strong>
              ${escapeHtml(plan.observaciones || 'Mantener una correcta hidratación diaria (2 a 2.5 L de agua) y respetar los horarios de comida.')}
            </div>
          </div>
        </div>
      </div>
    </main>

    <footer class="sheet-footer">
      <strong>Vitality</strong> · Plan personalizado elaborado por
      <strong>${escapeHtml(profesionalNombre || 'Lic. en Nutrición')}</strong>${
        profesionalMatricula ? ` (Mat. ${escapeHtml(profesionalMatricula)})` : ''
      } · Emitido el ${escapeHtml(fechaEmision)}
    </footer>
  </div>
</body>
</html>`;

  const printWin = window.open('', '_blank', 'width=940,height=860');
  if (!printWin) {
    window.alert('Por favor habilita las ventanas emergentes para ver y descargar el plan en PDF.');
    return;
  }
  printWin.document.open();
  printWin.document.write(html);
  printWin.document.close();
}

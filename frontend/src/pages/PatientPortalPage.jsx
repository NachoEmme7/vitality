import React, { useEffect, useState } from 'react';
import { Activity, CheckCircle2, ClipboardList, FileDown, Scale, ShieldCheck, Stethoscope } from 'lucide-react';
import { apiRequest } from '../services/api';
import EvolutionChart from '../components/EvolutionChart';
import MacroChart from '../components/MacroChart';
import ProgressDeltas from '../components/ProgressDeltas';
import { exportPlanToPdf } from '../utils/planPdf';

const DIAS = [
  { key: 'Lunes', label: 'Lunes' },
  { key: 'Martes', label: 'Martes' },
  { key: 'Miercoles', label: 'Miércoles' },
  { key: 'Jueves', label: 'Jueves' },
  { key: 'Viernes', label: 'Viernes' },
  { key: 'Sabado', label: 'Sábado' },
  { key: 'Domingo', label: 'Domingo' },
];

const MOMENTO_LABEL = {
  Desayuno: 'Desayuno',
  'Media Manana': 'Media Mañana',
  Almuerzo: 'Almuerzo',
  Merienda: 'Merienda',
  Cena: 'Cena',
  Colacion: 'Colación',
};

export default function PatientPortalPage() {
  const [data, setData] = useState(null);
  const [selectedPlanIdx, setSelectedPlanIdx] = useState(0);
  const [selectedDay, setSelectedDay] = useState('Lunes');
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest('/portal-paciente/resumen')
      .then((res) => {
        setData(res);
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  if (!data) {
    return <div className="empty-state">Cargando tu información nutricional...</div>;
  }

  const { perfil, evolucion = [], planes_aprobados = [] } = data;
  const ultimaMedicion = evolucion.length > 0 ? evolucion[evolucion.length - 1] : null;
  const activePlan = planes_aprobados[selectedPlanIdx] || null;

  const dayMeals = activePlan
    ? (activePlan.detalles_comidas || []).filter((c) => c.dia_semana === selectedDay)
    : [];

  const totals = dayMeals.reduce(
    (acc, c) => ({
      p: acc.p + Number(c.gramos_proteina || 0),
      c: acc.c + Number(c.gramos_carbohidratos || 0),
      g: acc.g + Number(c.gramos_grasa || 0),
    }),
    { p: 0, c: 0, g: 0 }
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Hola, {perfil.nombre} {perfil.apellido}</h1>
          <p>
            Portal del Paciente (Solo lectura) · Seguimiento con Lic. {perfil.profesional_nombre}{' '}
            {perfil.profesional_apellido} (Mat. {perfil.profesional_matricula})
          </p>
        </div>
        <span className="badge badge-primary" style={{ padding: '7px 13px', fontSize: '0.82rem' }}>
          <ShieldCheck size={15} />
          Plan validado por tu nutricionista
        </span>
      </div>

      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="kpi-card">
          <div>
            <div className="kpi-label">Último peso registrado</div>
            <div className="kpi-value">
              {ultimaMedicion ? `${ultimaMedicion.peso_kg} kg` : '—'}
            </div>
          </div>
          <div className="kpi-icon"><Scale size={20} /></div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">IMC actual</div>
            <div className="kpi-value">{ultimaMedicion ? ultimaMedicion.imc : '—'}</div>
            {ultimaMedicion && (
              <span style={{ fontSize: '0.76rem', color: '#0f766e', fontWeight: 600 }}>
                {ultimaMedicion.clasificacion}
              </span>
            )}
          </div>
          <div className="kpi-icon"><Activity size={20} /></div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">Objetivo calórico diario</div>
            <div className="kpi-value">
              {activePlan ? `${activePlan.objetivo_calorico}` : '—'}
            </div>
            {activePlan && (
              <span style={{ fontSize: '0.76rem', color: '#556962' }}>kcal / día</span>
            )}
          </div>
          <div className="kpi-icon"><ClipboardList size={20} /></div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">Profesional a cargo</div>
            <div style={{ fontWeight: 700, fontSize: '0.96rem', marginTop: 6 }}>
              Lic. {perfil.profesional_nombre} {perfil.profesional_apellido}
            </div>
            <span style={{ fontSize: '0.76rem', color: '#556962' }}>
              {perfil.profesional_correo}
            </span>
          </div>
          <div className="kpi-icon"><Stethoscope size={20} /></div>
        </div>
      </div>

      {perfil.restricciones_alimentarias && (
        <div className="alert alert-info">
          <strong>Restricciones registradas en tu historia clínica:</strong>{' '}
          {perfil.restricciones_alimentarias}
        </div>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">Mi Plan Alimenticio Aprobado</h3>
            <p style={{ margin: '3px 0 0', fontSize: '0.84rem', color: '#556962' }}>
              Consulta tus comidas organizadas por día de la semana y su aporte de macronutrientes.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {activePlan && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() =>
                  exportPlanToPdf({
                    plan: activePlan,
                    pacienteNombre: `${perfil.nombre} ${perfil.apellido}`,
                    profesionalNombre: `Lic. ${perfil.profesional_nombre} ${perfil.profesional_apellido}`,
                    profesionalMatricula: perfil.profesional_matricula,
                    restricciones: perfil.restricciones_alimentarias,
                  })
                }
              >
                <FileDown size={15} />
                Descargar PDF
              </button>
            )}
            {planes_aprobados.length > 1 && (
              <select
                style={{ width: 'auto' }}
                value={selectedPlanIdx}
                onChange={(e) => setSelectedPlanIdx(Number(e.target.value))}
              >
                {planes_aprobados.map((pl, idx) => (
                  <option key={pl.id_plan} value={idx}>
                    Plan #{pl.id_plan} ({pl.objetivo_calorico} kcal · {String(pl.fecha_creacion).slice(0, 10)})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {!activePlan ? (
          <div className="empty-state">
            Tu nutricionista aún no ha aprobado un plan alimenticio para mostrar aquí.
          </div>
        ) : (
          <div>
            {activePlan.observaciones && (
              <div
                style={{
                  padding: '12px 15px',
                  borderRadius: 10,
                  background: '#f0f5f3',
                  fontSize: '0.88rem',
                  marginBottom: 16,
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                }}
              >
                <CheckCircle2 size={17} color="#0f766e" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong>Indicaciones de tu nutricionista:</strong> {activePlan.observaciones}
                </div>
              </div>
            )}

            <div className="tabs">
              {DIAS.map((d) => {
                const count = (activePlan.detalles_comidas || []).filter(
                  (c) => c.dia_semana === d.key
                ).length;
                return (
                  <button
                    key={d.key}
                    type="button"
                    className={`tab-btn ${selectedDay === d.key ? 'active' : ''}`}
                    onClick={() => setSelectedDay(d.key)}
                  >
                    {d.label} {count > 0 ? `(${count})` : ''}
                  </button>
                );
              })}
            </div>

            <div className="grid-2">
              <div style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
                {dayMeals.length === 0 ? (
                  <div className="empty-state">
                    Sin comidas cargadas para el{' '}
                    {DIAS.find((d) => d.key === selectedDay)?.label.toLowerCase()}.
                  </div>
                ) : (
                  dayMeals.map((c) => (
                    <div className="meal-card" key={c.id_detalle}>
                      <div>
                        <strong>{MOMENTO_LABEL[c.momento_dia] || c.momento_dia}</strong>
                        <p style={{ margin: '5px 0 0', fontSize: '0.88rem', color: '#13221d' }}>
                          {c.descripcion_alimentos}
                        </p>
                        <div className="macro-pills">
                          <span className="macro-pill p">Proteínas: {c.gramos_proteina}g</span>
                          <span className="macro-pill c">Carbs: {c.gramos_carbohidratos}g</span>
                          <span className="macro-pill g">Grasas: {c.gramos_grasa}g</span>
                          <span className="macro-pill k">{c.calorias} kcal</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div
                style={{
                  padding: 18,
                  borderRadius: 12,
                  background: '#f6f8f7',
                  border: '1px solid #e2e8e5',
                  alignSelf: 'start',
                }}
              >
                <h4 style={{ marginBottom: 14, fontSize: '0.96rem' }}>
                  Resumen nutricional del {DIAS.find((d) => d.key === selectedDay)?.label}
                </h4>
                <MacroChart
                  proteinas={totals.p}
                  carbohidratos={totals.c}
                  grasas={totals.g}
                  objetivoCalorico={Number(activePlan.objetivo_calorico)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Mi Evolución Antropométrica</h3>
          <span className="badge badge-neutral">{evolucion.length} control(es)</span>
        </div>
        <ProgressDeltas registros={evolucion} />
        <EvolutionChart registros={evolucion} />
      </div>
    </div>
  );
}

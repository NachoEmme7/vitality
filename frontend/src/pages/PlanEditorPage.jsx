import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  FileDown,
  MessageCircle,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import MacroChart from '../components/MacroChart';
import {
  MEAL_PRESETS,
  buildWhatsAppPlanUrl,
  calculateCalorieDeviation,
  detectRestrictionConflicts,
} from '../utils/clinicalHelpers';
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

const MOMENTOS = [
  { key: 'Desayuno', label: 'Desayuno' },
  { key: 'Media Manana', label: 'Media Mañana' },
  { key: 'Almuerzo', label: 'Almuerzo' },
  { key: 'Merienda', label: 'Merienda' },
  { key: 'Cena', label: 'Cena' },
  { key: 'Colacion', label: 'Colación' },
];

const emptyMeal = (dia) => ({
  dia_semana: dia,
  momento_dia: 'Desayuno',
  descripcion_alimentos: '',
  gramos_proteina: '',
  gramos_carbohidratos: '',
  gramos_grasa: '',
});

export default function PlanEditorPage() {
  const { idPlan } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [plan, setPlan] = useState(null);
  const [selectedDay, setSelectedDay] = useState('Lunes');
  const [copyTargetDay, setCopyTargetDay] = useState('Martes');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [savingHeader, setSavingHeader] = useState(false);

  const [headerForm, setHeaderForm] = useState({
    objetivo_calorico: '',
    estado: 'Borrador',
    observaciones: '',
  });

  const [editingMealId, setEditingMealId] = useState(null);
  const [mealForm, setMealForm] = useState(emptyMeal('Lunes'));

  const loadPlan = async () => {
    try {
      const data = await apiRequest(`/planes/${idPlan}`);
      setPlan(data);
      setHeaderForm({
        objetivo_calorico: String(data.objetivo_calorico),
        estado: data.estado,
        observaciones: data.observaciones || '',
      });
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadPlan();
  }, [idPlan]);

  useEffect(() => {
    if (!editingMealId) {
      setMealForm((prev) => ({ ...prev, dia_semana: selectedDay }));
    }
    const nextOther = DIAS.find((d) => d.key !== selectedDay)?.key || 'Martes';
    if (copyTargetDay === selectedDay) {
      setCopyTargetDay(nextOther);
    }
  }, [selectedDay, editingMealId]);

  const handleSaveHeader = async (e, overrideEstado = null) => {
    if (e) e.preventDefault();
    setSavingHeader(true);
    setError('');
    setMsg('');
    try {
      const payload = {
        objetivo_calorico: Number(headerForm.objetivo_calorico),
        estado: overrideEstado || headerForm.estado,
        observaciones: headerForm.observaciones,
      };
      await apiRequest(`/planes/${idPlan}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setMsg(
        overrideEstado === 'Aprobado'
          ? 'Plan aprobado y habilitado en el Portal del Paciente.'
          : 'Configuración del plan actualizada correctamente.'
      );
      await loadPlan();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingHeader(false);
    }
  };

  const handleDuplicatePlan = async () => {
    setError('');
    try {
      const res = await apiRequest(`/planes/${idPlan}/duplicar`, { method: 'POST' });
      navigate(`/planes/${res.id_plan}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCopyDay = async () => {
    setError('');
    setMsg('');
    try {
      const res = await apiRequest(`/planes/${idPlan}/copiar-dia`, {
        method: 'POST',
        body: JSON.stringify({
          dia_origen: selectedDay,
          dia_destino: copyTargetDay,
          reemplazar: true,
        }),
      });
      setMsg(res.message);
      setSelectedDay(copyTargetDay);
      await loadPlan();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleExportPdf = () => {
    if (!plan) return;
    exportPlanToPdf({
      plan,
      pacienteNombre: `${plan.paciente_nombre} ${plan.paciente_apellido}`,
      profesionalNombre: `Lic. ${user?.nombre || ''} ${user?.apellido || ''}`.trim(),
      profesionalMatricula: user?.matricula,
      restricciones: plan.restricciones_alimentarias,
    });
  };

  const handleApplyPreset = (presetIndex) => {
    if (presetIndex === '') return;
    const preset = MEAL_PRESETS[Number(presetIndex)];
    if (!preset) return;
    setMealForm((prev) => ({
      ...prev,
      momento_dia: preset.momento_dia,
      descripcion_alimentos: preset.descripcion_alimentos,
      gramos_proteina: String(preset.gramos_proteina),
      gramos_carbohidratos: String(preset.gramos_carbohidratos),
      gramos_grasa: String(preset.gramos_grasa),
    }));
  };

  const handleMealSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    try {
      if (editingMealId) {
        await apiRequest(`/planes/${idPlan}/comidas/${editingMealId}`, {
          method: 'PUT',
          body: JSON.stringify(mealForm),
        });
        setMsg('Comida actualizada correctamente.');
      } else {
        await apiRequest(`/planes/${idPlan}/comidas`, {
          method: 'POST',
          body: JSON.stringify(mealForm),
        });
        setMsg('Comida agregada al plan.');
      }
      setEditingMealId(null);
      setMealForm(emptyMeal(selectedDay));
      await loadPlan();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEditMeal = (meal) => {
    setEditingMealId(meal.id_detalle);
    setSelectedDay(meal.dia_semana);
    setMealForm({
      dia_semana: meal.dia_semana,
      momento_dia: meal.momento_dia,
      descripcion_alimentos: meal.descripcion_alimentos,
      gramos_proteina: String(meal.gramos_proteina),
      gramos_carbohidratos: String(meal.gramos_carbohidratos),
      gramos_grasa: String(meal.gramos_grasa),
    });
  };

  const cancelEditMeal = () => {
    setEditingMealId(null);
    setMealForm(emptyMeal(selectedDay));
  };

  const handleDeleteMeal = async (idDetalle) => {
    setError('');
    try {
      await apiRequest(`/planes/${idPlan}/comidas/${idDetalle}`, { method: 'DELETE' });
      if (editingMealId === idDetalle) cancelEditMeal();
      await loadPlan();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!plan) {
    return <div className="empty-state">{error || 'Cargando plan alimenticio...'}</div>;
  }

  const dayMeals = (plan.detalles_comidas || []).filter((c) => c.dia_semana === selectedDay);
  const totals = dayMeals.reduce(
    (acc, c) => ({
      p: acc.p + Number(c.gramos_proteina || 0),
      c: acc.c + Number(c.gramos_carbohidratos || 0),
      g: acc.g + Number(c.gramos_grasa || 0),
      kcal: acc.kcal + Number(c.calorias || 0),
    }),
    { p: 0, c: 0, g: 0, kcal: 0 }
  );

  const calorieDev = calculateCalorieDeviation(totals.kcal, plan.objetivo_calorico);
  const draftConflicts = detectRestrictionConflicts(
    mealForm.descripcion_alimentos,
    plan.restricciones_alimentarias
  );

  const countByDay = (dayKey) =>
    (plan.detalles_comidas || []).filter((c) => c.dia_semana === dayKey).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <Link
            to="/planes"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.85rem',
              color: '#0f766e',
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            <ArrowLeft size={15} /> Volver a planes alimenticios
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1>
              Plan #{plan.id_plan} · {plan.paciente_nombre} {plan.paciente_apellido}
            </h1>
            <span
              className={`badge ${
                plan.estado === 'Aprobado'
                  ? 'badge-success'
                  : plan.estado === 'Borrador'
                  ? 'badge-warning'
                  : 'badge-neutral'
              }`}
            >
              {plan.estado}
            </span>
          </div>
          <p>
            Creado el {String(plan.fecha_creacion).slice(0, 10)} ·{' '}
            <Link to={`/pacientes/${plan.id_paciente}`} style={{ color: '#0f766e', fontWeight: 600 }}>
              Ver historia clínica
            </Link>
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" type="button" onClick={handleExportPdf}>
            <FileDown size={15} />
            Exportar PDF
          </button>
          <button className="btn btn-secondary btn-sm" type="button" onClick={handleDuplicatePlan}>
            <Copy size={15} />
            Duplicar Plan
          </button>
          {plan.estado === 'Aprobado' ? (
            <a
              className="btn btn-soft btn-sm"
              href={buildWhatsAppPlanUrl(plan.paciente_nombre, plan)}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={15} />
              Avisar por WhatsApp
            </a>
          ) : (
            <button
              className="btn btn-primary btn-sm"
              type="button"
              disabled={savingHeader}
              onClick={() => handleSaveHeader(null, 'Aprobado')}
            >
              <CheckCircle2 size={15} />
              Aprobar Plan
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {msg && <div className="alert alert-success">{msg}</div>}

      {(plan.restricciones_alimentarias || plan.antecedentes_medicos) && (
        <div className="alert alert-info" style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            {plan.restricciones_alimentarias && (
              <div>
                <strong>Restricciones alimentarias:</strong> {plan.restricciones_alimentarias}
              </div>
            )}
            {plan.antecedentes_medicos && (
              <div>
                <strong>Antecedentes médicos:</strong> {plan.antecedentes_medicos}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h3 className="card-title">Configuración del Plan</h3>
        </div>
        <form onSubmit={handleSaveHeader} className="form-grid">
          <div className="form-group">
            <label>Objetivo Calórico Diario (kcal)</label>
            <input
              className="input"
              type="number"
              required
              value={headerForm.objetivo_calorico}
              onChange={(e) => setHeaderForm({ ...headerForm, objetivo_calorico: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Estado del Plan</label>
            <select
              value={headerForm.estado}
              onChange={(e) => setHeaderForm({ ...headerForm, estado: e.target.value })}
            >
              <option value="Borrador">Borrador (oculto al paciente)</option>
              <option value="Aprobado">Aprobado (visible en portal del paciente)</option>
              <option value="Archivado">Archivado</option>
            </select>
          </div>
          <div className="form-group full">
            <label>Observaciones e indicaciones generales</label>
            <textarea
              rows={2}
              value={headerForm.observaciones}
              onChange={(e) => setHeaderForm({ ...headerForm, observaciones: e.target.value })}
            />
          </div>
          <div className="form-group full">
            <button className="btn btn-secondary" type="submit" disabled={savingHeader}>
              <Save size={16} />
              Guardar configuración
            </button>
          </div>
        </form>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 16,
        }}
      >
        <div className="tabs" style={{ marginBottom: 0 }}>
          {DIAS.map((d) => {
            const count = countByDay(d.key);
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

        {dayMeals.length > 0 && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <select
              style={{ width: 'auto', padding: '6px 10px', fontSize: '0.84rem' }}
              value={copyTargetDay}
              onChange={(e) => setCopyTargetDay(e.target.value)}
              aria-label="Día destino para copiar comidas"
            >
              {DIAS.filter((d) => d.key !== selectedDay).map((d) => (
                <option key={d.key} value={d.key}>
                  Copiar a {d.label}
                </option>
              ))}
            </select>
            <button type="button" className="btn btn-soft btn-sm" onClick={handleCopyDay}>
              <Copy size={14} />
              Copiar día
            </button>
          </div>
        )}
      </div>

      <div className="grid-2">
        <div style={{ display: 'grid', gap: 18, alignContent: 'start' }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                Balance Nutricional · {DIAS.find((d) => d.key === selectedDay)?.label}
              </h3>
            </div>

            {calorieDev.status === 'high' && (
              <div
                className="alert"
                style={{
                  background: '#fef3c7',
                  color: '#92400e',
                  border: '1px solid #fde68a',
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>
                  Este día supera el objetivo en <strong>+{calorieDev.diffKcal} kcal ({calorieDev.diffPct}%)</strong>.
                </span>
              </div>
            )}
            {calorieDev.status === 'low' && (
              <div
                className="alert"
                style={{
                  background: '#fef3c7',
                  color: '#92400e',
                  border: '1px solid #fde68a',
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>
                  Faltan <strong>{Math.abs(calorieDev.diffKcal)} kcal ({calorieDev.diffPct}%)</strong> para alcanzar el objetivo diario.
                </span>
              </div>
            )}

            <MacroChart
              proteinas={totals.p}
              carbohidratos={totals.c}
              grasas={totals.g}
              objetivoCalorico={Number(plan.objetivo_calorico)}
            />
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                {editingMealId ? 'Editar Comida' : 'Agregar Comida al Día'}
              </h3>
              {editingMealId && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={cancelEditMeal}>
                  <X size={14} /> Cancelar
                </button>
              )}
            </div>

            {!editingMealId && (
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#0f766e' }}>
                  <Sparkles size={14} />
                  Plantilla rápida (opcional — precarga descripción y macros)
                </label>
                <select defaultValue="" onChange={(e) => handleApplyPreset(e.target.value)}>
                  <option value="">— Elegir comida frecuente —</option>
                  {MEAL_PRESETS.map((preset, idx) => (
                    <option key={idx} value={idx}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <form onSubmit={handleMealSubmit} className="form-grid">
              <div className="form-group">
                <label>Día de la semana</label>
                <select
                  value={mealForm.dia_semana}
                  onChange={(e) => setMealForm({ ...mealForm, dia_semana: e.target.value })}
                >
                  {DIAS.map((d) => (
                    <option key={d.key} value={d.key}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Momento del día</label>
                <select
                  value={mealForm.momento_dia}
                  onChange={(e) => setMealForm({ ...mealForm, momento_dia: e.target.value })}
                >
                  {MOMENTOS.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group full">
                <label>Descripción de alimentos y porciones *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ej. Pechuga de pollo grillada (180g) con arroz integral (160g cocido) y ensalada verde."
                  value={mealForm.descripcion_alimentos}
                  onChange={(e) =>
                    setMealForm({ ...mealForm, descripcion_alimentos: e.target.value })
                  }
                />
                {draftConflicts.length > 0 && (
                  <div
                    className="alert"
                    style={{
                      marginTop: 8,
                      marginBottom: 0,
                      background: '#fef3c7',
                      color: '#92400e',
                      border: '1px solid #fde68a',
                      fontSize: '0.82rem',
                      display: 'flex',
                      gap: 8,
                      alignItems: 'flex-start',
                    }}
                  >
                    <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <strong>Aviso preventivo de restricción:</strong>{' '}
                      {draftConflicts
                        .map((w) => `${w.rule} (coincidencia: "${w.matched.join(', ')}")`)
                        .join(' · ')}
                    </div>
                  </div>
                )}
              </div>
              <div className="form-group full">
                <label>Macronutrientes (gramos)</label>
                <div className="grid-3">
                  <input
                    className="input"
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="Proteína (g)"
                    value={mealForm.gramos_proteina}
                    onChange={(e) => setMealForm({ ...mealForm, gramos_proteina: e.target.value })}
                  />
                  <input
                    className="input"
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="Carbs (g)"
                    value={mealForm.gramos_carbohidratos}
                    onChange={(e) =>
                      setMealForm({ ...mealForm, gramos_carbohidratos: e.target.value })
                    }
                  />
                  <input
                    className="input"
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="Grasas (g)"
                    value={mealForm.gramos_grasa}
                    onChange={(e) => setMealForm({ ...mealForm, gramos_grasa: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group full">
                <button className="btn btn-primary" type="submit">
                  {editingMealId ? <Save size={16} /> : <Plus size={16} />}
                  {editingMealId ? 'Guardar cambios de comida' : 'Agregar comida'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="card" style={{ alignSelf: 'start' }}>
          <div className="card-header">
            <h3 className="card-title">
              Comidas del {DIAS.find((d) => d.key === selectedDay)?.label}
            </h3>
            <span className="badge badge-primary">{dayMeals.length} comida(s)</span>
          </div>

          {dayMeals.length === 0 ? (
            <div className="empty-state">
              Aún no hay comidas cargadas para el{' '}
              {DIAS.find((d) => d.key === selectedDay)?.label.toLowerCase()}.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {dayMeals.map((c) => {
                const momentoLabel =
                  MOMENTOS.find((m) => m.key === c.momento_dia)?.label || c.momento_dia;
                const conflicts = detectRestrictionConflicts(
                  c.descripcion_alimentos,
                  plan.restricciones_alimentarias
                );
                return (
                  <div className="meal-card" key={c.id_detalle}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <strong>{momentoLabel}</strong>
                        {conflicts.length > 0 && (
                          <span
                            className="badge badge-warning"
                            title={conflicts.map((w) => `${w.rule}: ${w.matched.join(', ')}`).join(' | ')}
                          >
                            <AlertTriangle size={12} />
                            Revisar restricción
                          </span>
                        )}
                      </div>
                      <p style={{ margin: '5px 0 0', fontSize: '0.88rem', color: '#13221d' }}>
                        {c.descripcion_alimentos}
                      </p>
                      <div className="macro-pills">
                        <span className="macro-pill p">P: {c.gramos_proteina}g</span>
                        <span className="macro-pill c">C: {c.gramos_carbohidratos}g</span>
                        <span className="macro-pill g">G: {c.gramos_grasa}g</span>
                        <span className="macro-pill k">{c.calorias} kcal</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => startEditMeal(c)}
                        title="Editar comida"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteMeal(c.id_detalle)}
                        title="Eliminar comida"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

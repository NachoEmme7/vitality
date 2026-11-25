import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calculator, ClipboardPlus } from 'lucide-react';
import { apiRequest } from '../services/api';
import MacroChart from '../components/MacroChart';

export default function CalculatorPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [pacientes, setPacientes] = useState([]);
  const [selectedPacienteId, setSelectedPacienteId] = useState(searchParams.get('paciente') || '');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    peso_kg: '70',
    altura_cm: '170',
    edad: '30',
    sexo: 'F',
    nivel_actividad: 'moderado',
    formula: 'mifflin',
    objetivo: 'mantenimiento',
    pct_proteina: '25',
    pct_carbohidratos: '50',
    pct_grasa: '25',
  });

  useEffect(() => {
    apiRequest('/pacientes')
      .then((list) => {
        setPacientes(list);
        const paramId = searchParams.get('paciente');
        if (paramId) {
          const found = list.find((p) => String(p.id_paciente) === String(paramId));
          if (found) applyPatientToForm(found);
        }
      })
      .catch(() => {});
  }, []);

  const applyPatientToForm = (p) => {
    setForm((prev) => ({
      ...prev,
      peso_kg: p.ultimo_peso ? String(p.ultimo_peso) : prev.peso_kg,
      altura_cm: p.ultima_altura ? String(p.ultima_altura) : prev.altura_cm,
      edad: p.edad ? String(p.edad) : prev.edad,
      sexo: p.sexo || 'F',
      nivel_actividad: p.nivel_actividad || 'moderado',
    }));
  };

  const handleSelectPatient = (idVal) => {
    setSelectedPacienteId(idVal);
    const found = pacientes.find((p) => String(p.id_paciente) === String(idVal));
    if (found) applyPatientToForm(found);
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await apiRequest('/pacientes/calcular-requerimientos', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setResult(res);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreatePlanFromCalc = async () => {
    if (!selectedPacienteId || !result) {
      setError('Selecciona un paciente para asignarle el plan alimenticio.');
      return;
    }
    try {
      const obs = `Calculado con fórmula ${result.formula}. TMB: ${result.tmb} kcal, GET: ${result.get} kcal. Distribución sugerida: ${result.macronutrientes.proteinas.gramos}g P / ${result.macronutrientes.carbohidratos.gramos}g C / ${result.macronutrientes.grasas.gramos}g G.`;
      const res = await apiRequest('/planes', {
        method: 'POST',
        body: JSON.stringify({
          id_paciente: Number(selectedPacienteId),
          objetivo_calorico: result.objetivo_calorico,
          estado: 'Borrador',
          observaciones: obs,
        }),
      });
      navigate(`/planes/${res.id_plan}`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Calculadora Nutricional Clínica</h1>
          <p>
            Calcula automáticamente IMC, Tasa Metabólica Basal (TMB), Gasto Energético Total (GET) y
            macronutrientes con fórmulas estandarizadas.
          </p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Parámetros del Paciente</h3>
          </div>

          <form onSubmit={handleCalculate} className="form-grid">
            <div className="form-group full">
              <label>Cargar datos desde expediente (opcional)</label>
              <select
                value={selectedPacienteId}
                onChange={(e) => handleSelectPatient(e.target.value)}
              >
                <option value="">— Ingreso manual —</option>
                {pacientes.map((p) => (
                  <option key={p.id_paciente} value={p.id_paciente}>
                    {p.apellido}, {p.nombre} ({p.edad} años)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Peso (kg)</label>
              <input
                className="input"
                type="number"
                step="0.1"
                required
                value={form.peso_kg}
                onChange={(e) => setForm({ ...form, peso_kg: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Altura (cm)</label>
              <input
                className="input"
                type="number"
                step="0.5"
                required
                value={form.altura_cm}
                onChange={(e) => setForm({ ...form, altura_cm: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Edad (años)</label>
              <input
                className="input"
                type="number"
                required
                value={form.edad}
                onChange={(e) => setForm({ ...form, edad: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Sexo biológico</label>
              <select value={form.sexo} onChange={(e) => setForm({ ...form, sexo: e.target.value })}>
                <option value="F">Femenino</option>
                <option value="M">Masculino</option>
              </select>
            </div>

            <div className="form-group">
              <label>Fórmula predictiva</label>
              <select value={form.formula} onChange={(e) => setForm({ ...form, formula: e.target.value })}>
                <option value="mifflin">Mifflin-St Jeor (Recomendada)</option>
                <option value="harris">Harris-Benedict revisada</option>
              </select>
            </div>
            <div className="form-group">
              <label>Nivel de actividad física</label>
              <select
                value={form.nivel_actividad}
                onChange={(e) => setForm({ ...form, nivel_actividad: e.target.value })}
              >
                <option value="sedentario">Sedentario (x1.2)</option>
                <option value="ligero">Ligero (x1.375)</option>
                <option value="moderado">Moderado (x1.55)</option>
                <option value="activo">Activo (x1.725)</option>
                <option value="muy_activo">Muy activo (x1.9)</option>
              </select>
            </div>

            <div className="form-group full">
              <label>Objetivo terapéutico</label>
              <select value={form.objetivo} onChange={(e) => setForm({ ...form, objetivo: e.target.value })}>
                <option value="deficit_moderado">Descenso de peso saludable (-400 kcal)</option>
                <option value="deficit_suave">Descenso gradual (-250 kcal)</option>
                <option value="mantenimiento">Mantenimiento normocalórico (0 kcal)</option>
                <option value="superavit_suave">Ganancia muscular magra (+250 kcal)</option>
                <option value="superavit_moderado">Aumento de masa corporal (+400 kcal)</option>
              </select>
            </div>

            <div className="form-group full">
              <label>Distribución de macronutrientes (% Proteínas / % Carbohidratos / % Grasas)</label>
              <div className="grid-3">
                <input
                  className="input"
                  type="number"
                  value={form.pct_proteina}
                  onChange={(e) => setForm({ ...form, pct_proteina: e.target.value })}
                  placeholder="% Prot"
                />
                <input
                  className="input"
                  type="number"
                  value={form.pct_carbohidratos}
                  onChange={(e) => setForm({ ...form, pct_carbohidratos: e.target.value })}
                  placeholder="% Carb"
                />
                <input
                  className="input"
                  type="number"
                  value={form.pct_grasa}
                  onChange={(e) => setForm({ ...form, pct_grasa: e.target.value })}
                  placeholder="% Grasas"
                />
              </div>
            </div>

            <div className="form-group full">
              <button className="btn btn-primary" type="submit">
                <Calculator size={17} />
                Calcular Requerimientos
              </button>
            </div>
          </form>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Resultados del Cálculo Clínico</h3>
          </div>

          {!result ? (
            <div className="empty-state">
              Completa los parámetros y presiona <strong>Calcular Requerimientos</strong> para obtener
              el gasto calórico y la distribución recomendada de macronutrientes.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 18 }}>
              <div className="grid-3">
                <div className="meal-card" style={{ flexDirection: 'column', gap: 2 }}>
                  <span className="kpi-label">IMC</span>
                  <strong style={{ fontSize: '1.35rem' }}>{result.imc}</strong>
                  <span className="badge badge-primary">{result.clasificacion_imc}</span>
                </div>
                <div className="meal-card" style={{ flexDirection: 'column', gap: 2 }}>
                  <span className="kpi-label">TMB ({result.formula.split(' ')[0]})</span>
                  <strong style={{ fontSize: '1.35rem' }}>{result.tmb} kcal</strong>
                  <span style={{ fontSize: '0.76rem', color: '#556962' }}>Gasto basal</span>
                </div>
                <div className="meal-card" style={{ flexDirection: 'column', gap: 2 }}>
                  <span className="kpi-label">Objetivo Diario</span>
                  <strong style={{ fontSize: '1.35rem', color: '#0f766e' }}>
                    {result.objetivo_calorico} kcal
                  </strong>
                  <span style={{ fontSize: '0.76rem', color: '#556962' }}>GET: {result.get} kcal</span>
                </div>
              </div>

              <div style={{ padding: 14, borderRadius: 12, background: '#f6f8f7' }}>
                <MacroChart
                  proteinas={result.macronutrientes.proteinas.gramos}
                  carbohidratos={result.macronutrientes.carbohidratos.gramos}
                  grasas={result.macronutrientes.grasas.gramos}
                  objetivoCalorico={result.objetivo_calorico}
                />
              </div>

              <button
                className="btn btn-primary"
                type="button"
                onClick={handleCreatePlanFromCalc}
                disabled={!selectedPacienteId}
              >
                <ClipboardPlus size={17} />
                {selectedPacienteId
                  ? 'Crear Plan Alimenticio con este cálculo'
                  : 'Selecciona un paciente para crear un plan directo'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

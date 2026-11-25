import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calculator, ClipboardPlus, Plus, Save, Trash2 } from 'lucide-react';
import { apiRequest } from '../services/api';
import EvolutionChart from '../components/EvolutionChart';
import ProgressDeltas from '../components/ProgressDeltas';

export default function PatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const [editForm, setEditForm] = useState(null);
  const [medForm, setMedForm] = useState({
    fecha_registro: new Date().toISOString().slice(0, 10),
    peso_kg: '',
    altura_cm: '',
    porcentaje_grasa: '',
    masa_muscular_kg: '',
  });

  const loadData = async () => {
    try {
      const data = await apiRequest(`/pacientes/${id}`);
      setPaciente(data);
      setEditForm({
        nombre: data.nombre,
        apellido: data.apellido,
        fecha_nacimiento: String(data.fecha_nacimiento).slice(0, 10),
        correo_electronico: data.correo_electronico,
        sexo: data.sexo || 'F',
        nivel_actividad: data.nivel_actividad || 'moderado',
        antecedentes_medicos: data.antecedentes_medicos || '',
        restricciones_alimentarias: data.restricciones_alimentarias || '',
      });
      if (data.registros_antropometricos?.length > 0) {
        const last = data.registros_antropometricos[data.registros_antropometricos.length - 1];
        setMedForm((prev) => ({ ...prev, altura_cm: String(last.altura_cm) }));
      }
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    try {
      await apiRequest(`/pacientes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(editForm),
      });
      setMsg('Historia clínica actualizada correctamente.');
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddMedicion = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    try {
      await apiRequest(`/antropometria/${id}`, {
        method: 'POST',
        body: JSON.stringify(medForm),
      });
      setMedForm({
        fecha_registro: new Date().toISOString().slice(0, 10),
        peso_kg: '',
        altura_cm: medForm.altura_cm,
        porcentaje_grasa: '',
        masa_muscular_kg: '',
      });
      setMsg('Medición antropométrica registrada.');
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteMedicion = async (idRegistro) => {
    try {
      await apiRequest(`/antropometria/${idRegistro}`, { method: 'DELETE' });
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateQuickPlan = async () => {
    try {
      const res = await apiRequest('/planes', {
        method: 'POST',
        body: JSON.stringify({
          id_paciente: Number(id),
          objetivo_calorico: 2000,
          estado: 'Borrador',
          observaciones: '',
        }),
      });
      navigate(`/planes/${res.id_plan}`);
    } catch (err) {
      setError(err.message);
    }
  };

  if (!paciente) {
    return <div className="empty-state">{error || 'Cargando expediente clínico...'}</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <Link to="/pacientes" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: '#0f766e', fontWeight: 600, marginBottom: 6 }}>
            <ArrowLeft size={15} /> Volver a pacientes
          </Link>
          <h1>{paciente.nombre} {paciente.apellido}</h1>
          <p>{paciente.edad} años · {paciente.correo_electronico}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to={`/calculadora?paciente=${paciente.id_paciente}`} className="btn btn-secondary">
            <Calculator size={16} />
            Calcular Requerimientos
          </Link>
          <button className="btn btn-primary" onClick={handleCreateQuickPlan}>
            <ClipboardPlus size={16} />
            Nuevo Plan Alimenticio
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Historia Clínica y Antecedentes</h3>
          </div>
          {editForm && (
            <form onSubmit={handleSaveProfile} className="form-grid">
              <div className="form-group">
                <label>Nombre</label>
                <input
                  className="input"
                  value={editForm.nombre}
                  onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Apellido</label>
                <input
                  className="input"
                  value={editForm.apellido}
                  onChange={(e) => setEditForm({ ...editForm, apellido: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Fecha de nacimiento</label>
                <input
                  className="input"
                  type="date"
                  value={editForm.fecha_nacimiento}
                  onChange={(e) => setEditForm({ ...editForm, fecha_nacimiento: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Actividad física</label>
                <select
                  value={editForm.nivel_actividad}
                  onChange={(e) => setEditForm({ ...editForm, nivel_actividad: e.target.value })}
                >
                  <option value="sedentario">Sedentario</option>
                  <option value="ligero">Ligero</option>
                  <option value="moderado">Moderado</option>
                  <option value="activo">Activo</option>
                  <option value="muy_activo">Muy activo</option>
                </select>
              </div>
              <div className="form-group full">
                <label>Antecedentes médicos</label>
                <textarea
                  rows={2}
                  value={editForm.antecedentes_medicos}
                  onChange={(e) => setEditForm({ ...editForm, antecedentes_medicos: e.target.value })}
                />
              </div>
              <div className="form-group full">
                <label>Restricciones alimentarias</label>
                <textarea
                  rows={2}
                  value={editForm.restricciones_alimentarias}
                  onChange={(e) => setEditForm({ ...editForm, restricciones_alimentarias: e.target.value })}
                />
              </div>
              <div className="form-group full">
                <button className="btn btn-primary" type="submit">
                  <Save size={16} />
                  Guardar cambios
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Evolución Antropométrica</h3>
          </div>
          <ProgressDeltas registros={paciente.registros_antropometricos} />
          <EvolutionChart registros={paciente.registros_antropometricos} />
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Registros Antropométricos</h3>
          </div>

          <form onSubmit={handleAddMedicion} className="form-grid" style={{ marginBottom: 18, paddingBottom: 16, borderBottom: '1px solid #e2e8e5' }}>
            <div className="form-group">
              <label>Fecha *</label>
              <input
                className="input"
                type="date"
                required
                value={medForm.fecha_registro}
                onChange={(e) => setMedForm({ ...medForm, fecha_registro: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Peso (kg) *</label>
              <input
                className="input"
                type="number"
                step="0.1"
                required
                value={medForm.peso_kg}
                onChange={(e) => setMedForm({ ...medForm, peso_kg: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Altura (cm) *</label>
              <input
                className="input"
                type="number"
                step="0.5"
                required
                value={medForm.altura_cm}
                onChange={(e) => setMedForm({ ...medForm, altura_cm: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>% Grasa / Masa Musc. (kg)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="input"
                  type="number"
                  step="0.1"
                  placeholder="% Grasa"
                  value={medForm.porcentaje_grasa}
                  onChange={(e) => setMedForm({ ...medForm, porcentaje_grasa: e.target.value })}
                />
                <input
                  className="input"
                  type="number"
                  step="0.1"
                  placeholder="Músc. kg"
                  value={medForm.masa_muscular_kg}
                  onChange={(e) => setMedForm({ ...medForm, masa_muscular_kg: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group full">
              <button className="btn btn-soft" type="submit">
                <Plus size={16} />
                Registrar medición
              </button>
            </div>
          </form>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Peso</th>
                  <th>IMC</th>
                  <th>% Grasa</th>
                  <th>Músculo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paciente.registros_antropometricos.map((r) => (
                  <tr key={r.id_registro}>
                    <td>{String(r.fecha_registro).slice(0, 10)}</td>
                    <td><strong>{r.peso_kg} kg</strong></td>
                    <td>{r.imc} ({r.clasificacion})</td>
                    <td>{r.porcentaje_grasa ? `${r.porcentaje_grasa}%` : '—'}</td>
                    <td>{r.masa_muscular_kg ? `${r.masa_muscular_kg} kg` : '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteMedicion(r.id_registro)}
                        title="Eliminar medición"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Planes Alimenticios Asignados</h3>
          </div>
          {paciente.planes_alimenticios.length === 0 ? (
            <div className="empty-state">Este paciente aún no tiene planes asignados.</div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {paciente.planes_alimenticios.map((pl) => (
                <div className="meal-card" key={pl.id_plan}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong>Plan #{pl.id_plan} · {pl.objetivo_calorico} kcal/día</strong>
                      <span
                        className={`badge ${
                          pl.estado === 'Aprobado'
                            ? 'badge-success'
                            : pl.estado === 'Borrador'
                            ? 'badge-warning'
                            : 'badge-neutral'
                        }`}
                      >
                        {pl.estado}
                      </span>
                    </div>
                    <p style={{ margin: '5px 0 0', fontSize: '0.84rem', color: '#556962' }}>
                      {pl.observaciones || 'Sin observaciones clínicas.'}
                    </p>
                    <div style={{ fontSize: '0.78rem', color: '#556962', marginTop: 6 }}>
                      Creado: {String(pl.fecha_creacion).slice(0, 10)} · {pl.total_comidas} comida(s) cargada(s)
                    </div>
                  </div>
                  <Link to={`/planes/${pl.id_plan}`} className="btn btn-secondary btn-sm">
                    Editar Plan
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
